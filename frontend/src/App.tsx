import React, { useState } from "react";
import {
  AnalyzeResponse,
  Clause,
  RiskLevel,
  analyzeContract,
  chatAboutContract,
  summarizeContract,
  uploadPdf
} from "./api";

const PROFILES = ["Student", "Freelancer", "Startup employee / founder"] as const;

type Profile = (typeof PROFILES)[number];

interface ChatTurn {
  role: "user" | "assistant";
  content: string;
}

function riskColor(level: RiskLevel): string {
  switch (level) {
    case "High":
      return "#f97373";
    case "Medium":
      return "#facc6b";
    default:
      return "#4ade80";
  }
}

function App() {
  const [contractText, setContractText] = useState("");
  const [profile, setProfile] = useState<Profile>("Freelancer");
  const [summary, setSummary] = useState<string | null>(null);
  const [analysis, setAnalysis] = useState<AnalyzeResponse | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  const [isSummarizing, setIsSummarizing] = useState(false);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [chatInput, setChatInput] = useState("");
  const [chatHistory, setChatHistory] = useState<ChatTurn[]>([]);
  const [isChatting, setIsChatting] = useState(false);
  const [activeClauseIndex, setActiveClauseIndex] = useState<number | null>(null);

  const hasContract = contractText.trim().length > 0;

  async function handlePdfChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    setError(null);
    setIsUploading(true);
    try {
      const text = await uploadPdf(file);
      setContractText(text);
    } catch (err: any) {
      setError(err.message || "Failed to extract text from PDF.");
    } finally {
      setIsUploading(false);
    }
  }

  async function handleSummarize() {
    if (!hasContract) {
      setError("Please paste or upload a contract first.");
      return;
    }
    setError(null);
    setIsSummarizing(true);
    try {
      const s = await summarizeContract(contractText);
      setSummary(s);
    } catch (err: any) {
      setError(err.message || "Failed to summarize contract.");
    } finally {
      setIsSummarizing(false);
    }
  }

  async function handleAnalyze() {
    if (!hasContract) {
      setError("Please paste or upload a contract first.");
      return;
    }
    setError(null);
    setIsAnalyzing(true);
    try {
      const result = await analyzeContract(contractText, profile);
      setAnalysis(result);
      setSummary(result.summary);
    } catch (err: any) {
      setError(err.message || "Failed to analyze contract.");
    } finally {
      setIsAnalyzing(false);
    }
  }

  async function handleSendChat(e: React.FormEvent) {
    e.preventDefault();
    if (!chatInput.trim() || !hasContract) {
      if (!hasContract) setError("Upload or paste a contract before asking questions.");
      return;
    }
    const question = chatInput.trim();
    setChatInput("");
    setChatHistory((prev) => [...prev, { role: "user", content: question }]);
    setIsChatting(true);
    setError(null);
    try {
      const answer = await chatAboutContract(contractText, question);
      setChatHistory((prev) => [...prev, { role: "assistant", content: answer }]);
    } catch (err: any) {
      setError(err.message || "Chat failed.");
    } finally {
      setIsChatting(false);
    }
  }

  const highRiskCount =
    analysis?.clauses.filter((c) => c.risk_level === "High").length ?? 0;
  const mediumRiskCount =
    analysis?.clauses.filter((c) => c.risk_level === "Medium").length ?? 0;
  const lowRiskCount =
    analysis?.clauses.filter((c) => c.risk_level === "Low").length ?? 0;

  const dominantRisk: RiskLevel | null = (() => {
    if (!analysis) return null;
    if (highRiskCount > mediumRiskCount && highRiskCount > lowRiskCount)
      return "High";
    if (mediumRiskCount >= highRiskCount && mediumRiskCount > lowRiskCount)
      return "Medium";
    return "Low";
  })();

  return (
    <div className="app-root">
      <div className="hero-gradient" />
      <header className="hero-header">
        <div className="hero-pill">5.0 Rated</div>
        <h1 className="hero-title">Contracts. Simplified. Secured. Signed.</h1>
        <p className="hero-subtitle">
          An AI-powered threat calculator that analyzes your contracts for risks and
          vulnerabilities. From first upload to comprehensive risk assessment.
        </p>
      </header>

      <main className="main-grid">
        <section className="card upload-card">
          <div className="upload-icon">📄</div>
          <h2>Upload Your Agreement</h2>
          <p className="upload-help">
            Drop your contract here or click to browse. Supports PDF.
          </p>
          <label className="upload-button">
            <input
              type="file"
              accept="application/pdf"
              onChange={handlePdfChange}
              disabled={isUploading}
            />
            {isUploading ? "Extracting text..." : "Choose PDF"}
          </label>

          <textarea
            className="contract-textarea"
            placeholder="Or paste contract text here..."
            value={contractText}
            onChange={(e) => setContractText(e.target.value)}
          />

          <div className="profile-row">
            <span className="profile-label">Profile</span>
            <div className="profile-chips">
              {PROFILES.map((p) => (
                <button
                  key={p}
                  type="button"
                  className={`chip ${profile === p ? "chip-active" : ""}`}
                  onClick={() => setProfile(p)}
                >
                  {p}
                </button>
              ))}
            </div>
          </div>

          <div className="actions-row">
            <button
              type="button"
              className="btn btn-secondary"
              onClick={handleSummarize}
              disabled={isSummarizing || !hasContract}
            >
              {isSummarizing ? "Summarizing..." : "Summary"}
            </button>
            <button
              type="button"
              className="btn btn-primary"
              onClick={handleAnalyze}
              disabled={isAnalyzing || !hasContract}
            >
              {isAnalyzing ? "Analyzing..." : "Analyze Contract"}
            </button>
          </div>

          {error && <div className="error-banner">{error}</div>}
        </section>

        <section className="card insights-card">
          <h2>Plain-English Summary</h2>
          <div className="summary-box">
            {summary ? (
              <pre>{summary}</pre>
            ) : (
              <p className="placeholder-text">
                Run a summary or full analysis to see a contract overview here.
              </p>
            )}
          </div>

          {analysis && (
            <>
              <div className="score-row">
                <div className="score-main">
                  <span className="score-label">Contract Safety Score</span>
                  <span className="score-value">{analysis.score}/100</span>
                </div>
                <div className="score-breakdown">
                  <ScoreBar
                    label="Financial risk"
                    value={analysis.score_breakdown.financial}
                  />
                  <ScoreBar
                    label="Legal exposure"
                    value={analysis.score_breakdown.legal}
                  />
                  <ScoreBar
                    label="Control imbalance"
                    value={analysis.score_breakdown.control}
                  />
                </div>
              </div>

              {dominantRisk && (
                <div className="persona-banner">
                  <span className="persona-label">Risk for {profile}</span>
                  <span
                    className="persona-chip"
                    style={{ backgroundColor: riskColor(dominantRisk) }}
                  >
                    {dominantRisk === "High"
                      ? "High risk - proceed very carefully"
                      : dominantRisk === "Medium"
                      ? "Medium risk - review key clauses"
                      : "Low risk - broadly standard terms"}
                  </span>
                </div>
              )}

              <div className="heatmap">
                <h3>Risk Heatmap</h3>
                <p className="heatmap-caption">
                  Each bar segment represents one risky clause along the length of the contract.
                </p>
                <div className="heatmap-strip">
                  {analysis.clauses.map((c, idx) => (
                    <button
                      key={idx}
                      type="button"
                      className={`heatmap-dot-button ${
                        idx === activeClauseIndex ? "heatmap-dot-active" : ""
                      }`}
                      style={{ backgroundColor: riskColor(c.risk_level) }}
                      title={`${c.category || "Clause"} • ${c.risk_level} risk`}
                      onClick={() => setActiveClauseIndex(idx)}
                    />
                  ))}
                </div>
                <div className="heatmap-legend">
                  <span className="dot high" /> High
                  <span className="dot medium" /> Medium
                  <span className="dot low" /> Low
                </div>
              </div>

              <ClauseList
                clauses={analysis.clauses}
                activeIndex={activeClauseIndex}
                onSelect={setActiveClauseIndex}
              />

              <RiskyContractView
                contract={contractText}
                clauses={analysis.clauses}
                activeIndex={activeClauseIndex}
                onSelect={setActiveClauseIndex}
              />
            </>
          )}
        </section>

        <section className="card chat-card">
          <h2>Ask About This Contract</h2>
          <p className="chat-subtitle">
            Contract-aware chatbot. Answers are limited strictly to the uploaded
            agreement.
          </p>
          <div className="chat-window">
            {chatHistory.length === 0 ? (
              <p className="placeholder-text">
                Ask things like “Can they terminate without notice?” or “Who owns the
                intellectual property?”
              </p>
            ) : (
              <div className="chat-messages">
                {chatHistory.map((msg, idx) => (
                  <div
                    key={idx}
                    className={`chat-bubble ${
                      msg.role === "user" ? "chat-user" : "chat-assistant"
                    }`}
                  >
                    <span className="chat-role">
                      {msg.role === "user" ? "You" : "Assistant"}
                    </span>
                    <p>{msg.content}</p>
                  </div>
                ))}
              </div>
            )}
          </div>
          <form className="chat-form" onSubmit={handleSendChat}>
            <input
              type="text"
              placeholder="Type your question..."
              value={chatInput}
              onChange={(e) => setChatInput(e.target.value)}
              disabled={isChatting || !hasContract}
            />
            <button
              type="submit"
              className="btn btn-primary"
              disabled={isChatting || !hasContract}
            >
              {isChatting ? "Thinking..." : "Ask"}
            </button>
          </form>
        </section>
      </main>

      <footer className="footer">
        <span className="dot high" /> High risk &nbsp;&nbsp;
        <span className="dot medium" /> Medium risk &nbsp;&nbsp;
        <span className="dot low" /> Low / Standard
        <span className="footer-disclaimer">
          &nbsp;This tool provides risk awareness, not legal advice.
        </span>
      </footer>
    </div>
  );
}

interface ScoreBarProps {
  label: string;
  value: number;
}

function ScoreBar({ label, value }: ScoreBarProps) {
  return (
    <div className="scorebar">
      <div className="scorebar-header">
        <span>{label}</span>
        <span>{value}</span>
      </div>
      <div className="scorebar-track">
        <div className="scorebar-fill" style={{ width: `${value}%` }} />
      </div>
    </div>
  );
}

interface ClauseListProps {
  clauses: Clause[];
  activeIndex: number | null;
  onSelect: (index: number) => void;
}

function ClauseList({ clauses, activeIndex, onSelect }: ClauseListProps) {
  if (!clauses.length) {
    return (
      <div className="placeholder-text">
        No clause-level risks found or analysis did not return structured clauses.
      </div>
    );
  }

  const grouped = clauses.reduce<Record<string, Clause[]>>((acc, clause) => {
    const cat = clause.category || "Other";
    acc[cat] = acc[cat] || [];
    acc[cat].push(clause);
    return acc;
  }, {});

  return (
      <div className="clauses-section">
        <h3>Clause-Level Risk Detection</h3>
        <p className="clauses-caption">
          Tap a clause to highlight it inside the contract and see industry comparison + safer rewrite.
        </p>
        <div className="clauses-grid">
          {Object.entries(grouped).map(([category, catClauses]) => (
            <div key={category} className="clause-column">
              <h4>{category}</h4>
              {catClauses.map((c, idx) => {
                const globalIndex = clauses.indexOf(c);
                return (
                  <article
                    key={`${category}-${idx}`}
                    className={`clause-card ${
                      globalIndex === activeIndex ? "clause-card-active" : ""
                    }`}
                    onClick={() => onSelect(globalIndex)}
                  >
                <div className="clause-header">
                  <span
                    className="risk-pill"
                    style={{ backgroundColor: riskColor(c.risk_level) }}
                  >
                    {c.risk_level} risk
                  </span>
                  {c.industry_comparison && (
                    <span className="industry-text">{c.industry_comparison}</span>
                  )}
                </div>
                <p className="clause-text">“{c.clause_text}”</p>
                    {c.explanation && (
                      <p className="clause-explanation">{c.explanation}</p>
                    )}
                    {c.industry_comparison && (
                      <p className="industry-detail">
                        <strong>Industry view:</strong> {c.industry_comparison}
                      </p>
                    )}
                    {c.safer_rewrite && (
                      <details className="safer-rewrite">
                        <summary>Suggest safer version</summary>
                        <p>{c.safer_rewrite}</p>
                      </details>
                    )}
                  </article>
                );
              })}
            </div>
          ))}
        </div>
    </div>
  );
}

interface RiskyContractViewProps {
  contract: string;
  clauses: Clause[];
  activeIndex: number | null;
  onSelect: (index: number) => void;
}

function RiskyContractView({
  contract,
  clauses,
  activeIndex,
  onSelect
}: RiskyContractViewProps) {
  if (!contract.trim() || !clauses.length) return null;

  const sorted = clauses
    .map((c, idx) => ({ clause: c, index: idx }))
    .filter((x) => x.clause.clause_text)
    .sort(
      (a, b) =>
        contract.indexOf(a.clause.clause_text) -
        contract.indexOf(b.clause.clause_text)
    );

  const segments: { text: string; clauseIndex: number | null; level?: RiskLevel }[] = [];
  let cursor = 0;

  for (const { clause, index } of sorted) {
    const snippet = clause.clause_text;
    const pos = contract.indexOf(snippet, cursor);
    if (pos === -1) continue;
    if (pos > cursor) {
      segments.push({ text: contract.slice(cursor, pos), clauseIndex: null });
    }
    segments.push({
      text: snippet,
      clauseIndex: index,
      level: clause.risk_level
    });
    cursor = pos + snippet.length;
  }

  if (cursor < contract.length) {
    segments.push({ text: contract.slice(cursor), clauseIndex: null });
  }

  return (
    <div className="risky-contract">
      <h3>Highlighted Contract (risky clauses)</h3>
      <div className="risky-contract-box">
        {segments.map((seg, i) =>
          seg.clauseIndex === null ? (
            <span key={i}>{seg.text}</span>
          ) : (
            <button
              key={i}
              type="button"
              className={`highlight-span ${
                seg.clauseIndex === activeIndex ? "highlight-span-active" : ""
              }`}
              style={{ backgroundColor: riskColor(seg.level || "Low") }}
              onClick={() => onSelect(seg.clauseIndex!)}
            >
              {seg.text}
            </button>
          )
        )}
      </div>
    </div>
  );
}

export default App;

