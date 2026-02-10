# AI Contract Risk Scanner

AI Contract Risk Scanner is a **LegalTech + AI web application** that helps users identify hidden risks in legal contracts before signing.  
It translates complex legal language into **plain English**, highlights risky clauses, and provides an overall **contract safety score**.

---

## Problem
Most individuals, freelancers, and startups sign contracts without fully understanding:
- Hidden obligations
- One-sided clauses
- Long-term legal or financial risks  

Professional legal review is expensive and inaccessible for many users.

---

## Solution
Our system uses **LLM-based reasoning** to analyze contracts and:
- Detect risky clauses
- Explain risks in simple language
- Visualize risk levels
- Answer contract-specific questions via chatbot

The goal is to make **legal understanding accessible to everyone**.

---

## Key Features
- Plain-English contract summary  
- Clause-level risk detection  
- Risk heatmap visualization  
- Overall contract safety score  
- Contract-aware chatbot  
- Safer clause rewrite suggestions  

---

## Architecture (High-Level)
User → Frontend (React + Vite) → FastAPI Backend → Groq (LLaMA 3.1)

---

## Tech Stack & Why
- **React + Vite**: Fast, clean UI and ideal for hackathon demos  
- **FastAPI (Python)**: High-performance backend with rapid development  
- **LLaMA 3.1 via Groq**: Extremely fast inference, free-tier friendly  

No custom dataset training required.

## Backend Setup:
cd backend

pip install -r requirements.txt

## Run backend:

python -m uvicorn main:app --reload

## Frontend Setup:
cd frontend

npm install

npm run dev