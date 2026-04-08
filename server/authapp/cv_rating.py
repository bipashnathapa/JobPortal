"""
CV feedback via Groq: improvement suggestions only (no numeric score).
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
# Exported for persistence / history (Groq API model id).
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


def _parse_suggestions(text: str) -> list:
    suggestions = []
    for line in text.splitlines():
        line = line.strip()
        if not line:
            continue
        if line.startswith("-"):
            suggestions.append(line.lstrip("- ").strip())
        elif line.startswith("•"):
            suggestions.append(line.lstrip("• ").strip())
    return suggestions[:8] if suggestions else ["Add more detail to key sections."]


def get_cv_feedback(cv_text: str) -> dict:
    cv_text = (cv_text or "").strip()
    if len(cv_text) < 50:
        return {
            "suggestions": ["Provide at least a few lines of CV content."],
            "summary": "",
            "error": None,
        }

    api_key = getattr(settings, "GROQ_API_KEY", None) or os.getenv("GROQ_API_KEY")
    if not api_key:
        return {
            "suggestions": [],
            "summary": "Add GROQ_API_KEY to server/.env (free key at console.groq.com).",
            "error": "GROQ_NOT_CONFIGURED",
        }

    prompt = """You are a career advisor. Review this CV and give only concrete improvement suggestions.

CV:
---
{cv}
---

Reply with 4-6 bullet points only. Each line must start with "-" (hyphen and space).
No scores, no numbered ratings, no "SUMMARY:" line — only bullet suggestions.
Keep each bullet one sentence when possible.""".format(
        cv=cv_text[:5000]
    )

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
        return {"suggestions": [], "summary": "", "error": str(e)}

    if r.status_code == 401:
        return {
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
        return {"suggestions": [], "summary": "", "error": msg}

    try:
        data = r.json()
        content = (data.get("choices") or [{}])[0].get("message", {}).get("content") or ""
        text = content.strip()
    except (IndexError, KeyError, TypeError):
        return {"suggestions": [], "summary": "", "error": "Invalid response."}
    if len(text) < 15:
        return {"suggestions": [], "summary": "", "error": "Response too short."}

    suggestions = _parse_suggestions(text)
    return {"suggestions": suggestions, "summary": "", "error": None}
