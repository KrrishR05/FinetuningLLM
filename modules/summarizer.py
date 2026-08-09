"""
summarizer.py — Quick Text Summarization Module
===============================================
Handles AI/ML text summarization workflows for both pasted raw text
and extracted document contents. Integrates with model_adapter and prompts.
"""

import re
import time
from typing import Dict, Any, List, Optional
from modules.prompts import quick_summary_prompt
from modules.model_adapter import ModelAdapter


def parse_summary_response(response_text: str, fmt: str = "bullets") -> Dict[str, Any]:
    """
    Parses structured title, summary, and bullet points from raw LLM output text.
    """
    title = ""
    summary = ""
    bullets: List[str] = []

    clean_text = response_text.strip()
    # Strip internal Gemma/channel thinking tags (<|channel>thought...<channel|>)
    if "<channel|>" in clean_text:
        clean_text = re.sub(r"<\|channel\b.*?<channel\|>", "", clean_text, flags=re.DOTALL).strip()
    else:
        clean_text = re.sub(r"^<\|channel\b.*?(?=\n(?:Title|Summary|\*\*Title|\*\*Summary|#)|$)", "", clean_text, flags=re.DOTALL).strip()


    # Extract Title
    title_match = re.search(r"(?:Title|TITLE):\s*(.*?)(?=\n|Summary|Key Points|$)", clean_text, re.IGNORECASE)
    if title_match:
        title = title_match.group(1).strip()
        title = re.sub(r"^[\*\#\s'\"]+|[\*\#\s'\"]+$", "", title).strip()

    # Extract Summary
    summary_match = re.search(r"(?:Summary|SUMMARY):\s*(.*?)(?=\n(?:Key Points|KEY POINTS)|$)", clean_text, re.IGNORECASE | re.DOTALL)
    if summary_match:
        summary = summary_match.group(1).strip()

    # Extract Key Points / Bullets
    bullets_match = re.search(r"(?:Key Points|KEY POINTS):\s*(.*)", clean_text, re.IGNORECASE | re.DOTALL)
    if bullets_match:
        raw_bullets = bullets_match.group(1).strip()
        for line in raw_bullets.split("\n"):
            line_clean = line.strip()
            if line_clean.startswith(("-", "*", "•", "1.", "2.", "3.", "4.", "5.")):
                item = re.sub(r"^[\-\*\•\d\.\s]+", "", line_clean).strip()
                item = re.sub(r"^[\*\_]+|[\*\_]+$", "", item).strip()
                # Filter out truncated single-word fragments (require at least 3 words)
                if item and len(item.split()) >= 3:
                    bullets.append(item)

    # Fallback heuristics if parsing didn't find specific headers
    if not title:
        lines = [l.strip() for l in clean_text.split("\n") if l.strip()]
        if lines:
            title = re.sub(r"^(?:Title|TITLE):?", "", lines[0], flags=re.IGNORECASE).strip("*'\"# ")

    if not summary:
        if "Summary:" in clean_text:
            parts = clean_text.split("Summary:")
            summary = parts[-1].strip()
        else:
            summary = clean_text

    return {
        "title": title or "Executive Summary",
        "summary": summary,
        "bullets": bullets,
    }



def summarize_text(
    text: str,
    adapter: ModelAdapter,
    model_id: Optional[str] = None,
    length: str = "100 words",
    fmt: str = "bullets",
    temperature: float = 0.2,
    max_tokens: int = 512,
    system_prompt: Optional[str] = None,
    keep_alive: Optional[Any] = None,
) -> Dict[str, Any]:
    """
    Executes text summarization using local model adapter.
    """
    if not text or not text.strip():
        return {
            "status": "error",
            "error": "No input text provided to summarize.",
        }

    prompt = quick_summary_prompt(text=text, length=length, fmt=fmt)

    t0 = time.time()
    response = adapter.generate(
        prompt=prompt,
        model_id=model_id,
        system_prompt=system_prompt,
        temperature=temperature,
        max_tokens=max_tokens,
        keep_alive=keep_alive,
    )

    elapsed = round(time.time() - t0, 2)

    if response.get("status") != "success" or not response.get("text"):
        return {
            "status": "error",
            "error": response.get("error", "Local LLM server returned an empty response."),
            "model_name": response.get("model_name", "Local Model"),
            "runtime": response.get("runtime", "unknown"),
        }

    raw_text = response["text"]
    parsed = parse_summary_response(raw_text, fmt=fmt)

    return {
        "status": "success",
        "title": parsed["title"],
        "summary": parsed["summary"],
        "bullets": parsed["bullets"],
        "raw_text": raw_text,
        "latency_seconds": response.get("latency_seconds", elapsed),
        "model_name": response.get("model_name", "Gemma 4 E2B"),
        "runtime": response.get("runtime", "ollama"),
        "endpoint": response.get("endpoint", ""),
    }
