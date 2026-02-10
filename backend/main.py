import re
import json
from pathlib import Path
from dotenv import load_dotenv
from fastapi.middleware.cors import CORSMiddleware

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # for hackathon/demo
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


# Load .env BEFORE importing llm (llm reads GROQ_API_KEY at import time)
load_dotenv(Path(__file__).resolve().parent / ".env")

from fastapi import FastAPI, Form, HTTPException, UploadFile, File
from fastapi.middleware.cors import CORSMiddleware
from llm import call_llm
from prompts import SUMMARY_PROMPT, RISK_SCAN_PROMPT, CHAT_PROMPT
from contract_utils import calculate_score

app = FastAPI(title="AI Contract Risk Scanner")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_methods=["*"],
    allow_headers=["*"],
)


def extract_json_array(raw: str):
    """Extract a JSON array from LLM output (handles markdown code blocks)."""
    raw = (raw or "").strip()
    # Try direct parse
    try:
        return json.loads(raw)
    except json.JSONDecodeError:
        pass
    # Try ```json ... ``` or ``` ... ```
    for pattern in (r"```(?:json)?\s*([\s\S]*?)```", r"\[[\s\S]*\]"):
        match = re.search(pattern, raw)
        if match:
            s = match.group(1) if "```" in pattern else match.group(0)
            try:
                return json.loads(s)
            except json.JSONDecodeError:
                continue
    return []


def normalize_clause(c):
    """Ensure each clause has expected keys."""
    return {
        "clause_text": c.get("clause_text") or c.get("clause") or "",
        "category": c.get("category") or "Other",
        "risk_level": (c.get("risk_level") or "Low").strip(),
        "explanation": c.get("explanation") or "",
        "industry_comparison": c.get("industry_comparison") or "",
        "safer_rewrite": c.get("safer_rewrite") or "",
    }


def extract_text_from_pdf(bytes_content: bytes) -> str:
    """Extract plain text from PDF bytes."""
    try:
        from pypdf import PdfReader
        from io import BytesIO
        reader = PdfReader(BytesIO(bytes_content))
        parts = []
        for page in reader.pages:
            text = page.extract_text()
            if text:
                parts.append(text)
        return "\n\n".join(parts).strip() if parts else ""
    except Exception as e:
        raise HTTPException(status_code=400, detail=f"Could not read PDF: {str(e)}")


@app.post("/extract-pdf")
async def extract_pdf(file: UploadFile = File(...)):
    """Extract text from an uploaded PDF. Returns plain text for the contract textarea."""
    if not file.filename or not file.filename.lower().endswith(".pdf"):
        raise HTTPException(status_code=400, detail="Please upload a PDF file.")
    content = await file.read()
    if not content:
        raise HTTPException(status_code=400, detail="File is empty.")
    text = extract_text_from_pdf(content)
    if not text:
        raise HTTPException(status_code=400, detail="No text could be extracted from this PDF.")
    return {"text": text}


@app.post("/summarize")
async def summarize_only(contract: str = Form(...)):
    """One-click plain-English summary only (no full risk scan)."""
    contract = (contract or "").strip()
    if not contract:
        raise HTTPException(status_code=400, detail="Contract text is required.")
    try:
        summary = call_llm(SUMMARY_PROMPT.format(contract=contract))
    except Exception as e:
        raise HTTPException(status_code=502, detail=f"Summary failed: {str(e)}")
    return {"summary": summary}


@app.post("/analyze")
async def analyze(contract: str = Form(...), profile: str = Form("Freelancer")):
    contract = (contract or "").strip()
    if not contract:
        raise HTTPException(status_code=400, detail="Contract text is required.")
    try:
        summary = call_llm(SUMMARY_PROMPT.format(contract=contract))
    except Exception as e:
        raise HTTPException(status_code=502, detail=f"Summary failed: {str(e)}")
    try:
        raw = call_llm(RISK_SCAN_PROMPT.format(contract=contract, profile=profile))
    except Exception as e:
        raise HTTPException(status_code=502, detail=f"Risk scan failed: {str(e)}")
    clauses = extract_json_array(raw)
    if isinstance(clauses, list):
        clauses = [normalize_clause(c) for c in clauses if isinstance(c, dict)]
    else:
        clauses = []
    score, score_breakdown = calculate_score(clauses)
    return {
        "summary": summary,
        "clauses": clauses,
        "score": score,
        "score_breakdown": score_breakdown,
    }


@app.post("/chat")
async def chat(contract: str = Form(...), question: str = Form(...)):
    contract = (contract or "").strip()
    question = (question or "").strip()
    if not contract or not question:
        raise HTTPException(status_code=400, detail="Contract and question are required.")
    try:
        answer = call_llm(CHAT_PROMPT.format(contract=contract, question=question))
    except Exception as e:
        raise HTTPException(status_code=502, detail=f"Chat failed: {str(e)}")
    return {"answer": answer}

