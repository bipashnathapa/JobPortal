"""
Simple CV rating: extract text from PDF, call Groq once for a rating + short suggestions.
"""
import os
import re
import requests
from django.conf import settings

try:
    from pypdf import PdfReader
except ImportError:
    PdfReader = None

GROQ_URL = "https://api.groq.com/openai/v1/chat/completions"
GROQ_MODEL = "llama-3.1-8b-instant"


def extract_text_from_pdf(file) -> str:
    if not PdfReader:
        return ""
    try:
        reader = PdfReader(file)
        parts = [p.extract_text() for p in reader.pages if p.extract_text()]
        return "\n".join(parts).strip() if parts else ""
    except Exception:
        return ""


def _parse(text: str) -> dict:
    rating = 0
    suggestions = []
    summary = ""
    m = re.search(r"RATING:\s*(\d+)", text, re.I)
    if m:
        rating = min(10, max(1, int(m.group(1))))
    for line in text.splitlines():
        line = line.strip()
        if not line:
            continue
        if line.startswith("-"):
            suggestions.append(line.lstrip("- ").strip())
        elif "SUMMARY:" in line.upper() and not summary:
            summary = line.split(":", 1)[-1].strip()
        elif "RATING:" not in line.upper() and len(line) > 12 and not line.startswith("-"):
            summary = summary or line
    return {
        "rating": rating,
        "suggestions": suggestions[:6] or ["Add more detail to key sections."],
        "summary": summary or "Review completed.",
    }


def get_cv_feedback(cv_text: str) -> dict:
    cv_text = (cv_text or "").strip()
    if len(cv_text) < 50:
        return {
            "rating": 0,
            "suggestions": ["Provide at least a few lines of CV content."],
            "summary": "Not enough text to evaluate.",
            "error": None,
        }

    api_key = getattr(settings, "GROQ_API_KEY", None) or os.getenv("GROQ_API_KEY")
    if not api_key:
        return {
            "rating": 0,
            "suggestions": [],
            "summary": "Add GROQ_API_KEY to server/.env (free key at console.groq.com).",
            "error": "GROQ_NOT_CONFIGURED",
        }

    prompt = """You are a career advisor. Review this CV and reply in this exact format only.

CV:
---
{cv}
---

Reply with exactly:
1. RATING: (one number from 1 to 10)
2. SUMMARY: (one short sentence on overall strength)
3. Then 3-5 bullet points, each on a new line starting with "-"

Keep it brief.""".format(cv=cv_text[:5000])

    headers = {"Authorization": f"Bearer {api_key}", "Content-Type": "application/json"}
    payload = {
        "model": GROQ_MODEL,
        "messages": [{"role": "user", "content": prompt}],
        "max_tokens": 350,
        "temperature": 0.3,
    }

    try:
        r = requests.post(GROQ_URL, headers=headers, json=payload, timeout=30)
    except requests.RequestException as e:
        return {"rating": 0, "suggestions": [], "summary": "", "error": str(e)}

    if r.status_code == 401:
        return {
            "rating": 0,
            "suggestions": [],
            "summary": "Invalid Groq API key.",
            "error": "GROQ_NOT_CONFIGURED",
        }
    if r.status_code != 200:
        msg = "CV analysis failed."
        try:
            err = r.json()
            msg = err.get("error", {}).get("message", msg) or msg
        except Exception:
            msg = r.text[:150] or msg
        return {"rating": 0, "suggestions": [], "summary": "", "error": msg}

    try:
        data = r.json()
        content = (data.get("choices") or [{}])[0].get("message", {}).get("content") or ""
        text = content.strip()
    except (IndexError, KeyError, TypeError):
        return {"rating": 0, "suggestions": [], "summary": "", "error": "Invalid response."}
    if len(text) < 15:
        return {"rating": 0, "suggestions": [], "summary": "", "error": "Response too short."}

    out = _parse(text)
    out["error"] = None
    return out
