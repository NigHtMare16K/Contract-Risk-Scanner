export type RiskLevel = "High" | "Medium" | "Low";

export interface Clause {
  clause_text: string;
  category: string;
  risk_level: RiskLevel;
  explanation: string;
  industry_comparison: string;
  safer_rewrite: string;
}

export interface AnalyzeResponse {
  summary: string;
  clauses: Clause[];
  score: number;
  score_breakdown: {
    financial: number;
    legal: number;
    control: number;
  };
}

// ✅ IMPORTANT: Use environment variable (works locally + hosted)
const BASE_URL = import.meta.env.VITE_API_URL;

async function handleResponse<T>(res: Response): Promise<T> {
  if (!res.ok) {
    let message = `Request failed with status ${res.status}`;
    try {
      const data = await res.json();
      if (data?.detail) {
        message = data.detail;
      }
    } catch {
      // ignore
    }
    throw new Error(message);
  }
  return (await res.json()) as T;
}

export async function uploadPdf(file: File): Promise<string> {
  const form = new FormData();
  form.append("file", file);

  const res = await fetch(`${BASE_URL}/extract-pdf`, {
    method: "POST",
    body: form,
  });

  const data = await handleResponse<{ text: string }>(res);
  return data.text;
}

export async function summarizeContract(contract: string): Promise<string> {
  const form = new FormData();
  form.append("contract", contract);

  const res = await fetch(`${BASE_URL}/summarize`, {
    method: "POST",
    body: form,
  });

  const data = await handleResponse<{ summary: string }>(res);
  return data.summary;
}

export async function analyzeContract(
  contract: string,
  profile: string
): Promise<AnalyzeResponse> {
  const form = new FormData();
  form.append("contract", contract);
  form.append("profile", profile);

  const res = await fetch(`${BASE_URL}/analyze`, {
    method: "POST",
    body: form,
  });

  return handleResponse<AnalyzeResponse>(res);
}

export interface ChatMessage {
  role: "user" | "assistant";
  content: string;
}

export async function chatAboutContract(
  contract: string,
  question: string
): Promise<string> {
  const form = new FormData();
  form.append("contract", contract);
  form.append("question", question);

  const res = await fetch(`${BASE_URL}/chat`, {
    method: "POST",
    body: form,
  });

  const data = await handleResponse<{ answer: string }>(res);
  return data.answer;
}
