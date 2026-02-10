import requests
import os

MODEL = "llama-3.1-8b-instant"


def call_llm(prompt, system="You are a legal risk analysis assistant. Be concise and accurate."):
    api_key = os.getenv("GROQ_API_KEY")
    if not api_key:
        raise ValueError("GROQ_API_KEY is not set in environment.")
    url = "https://api.groq.com/openai/v1/chat/completions"
    headers = {
        "Authorization": f"Bearer {api_key}",
        "Content-Type": "application/json"
    }
    payload = {
        "model": MODEL,
        "messages": [
            {"role": "system", "content": system},
            {"role": "user", "content": prompt}
        ],
        "temperature": 0.2
    }
    response = requests.post(url, json=payload, headers=headers, timeout=60)
    response.raise_for_status()
    data = response.json()
    if "choices" not in data or not data["choices"]:
        raise ValueError("Invalid API response: no choices")
    return data["choices"][0]["message"]["content"]
