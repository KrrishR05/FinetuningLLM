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
    Handles Gemma thinking tags, markdown artifacts, and various LLM output quirks.
    """
    title = ""
    summary = ""
    bullets: List[str] = []

    clean_text = response_text.strip()

    # Strip Gemma 4 E2B internal thinking/channel tags
    clean_text = re.sub(r"<\|channel\b.*?channel\|>", "", clean_text, flags=re.DOTALL).strip()
    clean_text = re.sub(r"<\|?thinking\|?>.*?<\|?/thinking\|?>", "", clean_text, flags=re.DOTALL).strip()
    clean_text = re.sub(r"<\|?channel\b[^>]*>.*?$", "", clean_text, flags=re.DOTALL).strip()

    # Strip markdown heading markers (## Title:, **Title:**)
    clean_text = re.sub(r"^#{1,4}\s*", "", clean_text, flags=re.MULTILINE)
    clean_text = re.sub(r"\*\*(Title|Summary|Key Points|Key Takeaways):\*\*", r"\1:", clean_text, flags=re.IGNORECASE)

    # Extract Title
    title_match = re.search(r"(?:Title|TITLE)\s*:\s*(.+?)(?:\n|$)", clean_text, re.IGNORECASE)
    if title_match:
        title = title_match.group(1).strip()
        title = re.sub(r"^[*#\s'\"]+|[*#\s'\"]+$", "", title).strip()

    # Extract Summary — everything between "Summary:" and "Key Points:"
    summary_match = re.search(
        r"(?:Summary|SUMMARY)\s*:\s*\n?(.*?)(?=\n\s*(?:Key\s*Points|KEY\s*POINTS|Key\s*Takeaways|KEY\s*TAKEAWAYS)\s*:|$)",
        clean_text, re.IGNORECASE | re.DOTALL
    )
    if summary_match:
        summary = summary_match.group(1).strip()
        # Clean up any remaining markdown bold markers inside summary text
        summary = re.sub(r"\*\*(.+?)\*\*", r"\1", summary)

    # Extract Key Points / Bullets
    bullets_match = re.search(
        r"(?:Key\s*Points|KEY\s*POINTS|Key\s*Takeaways|KEY\s*TAKEAWAYS)\s*:\s*\n?(.*)",
        clean_text, re.IGNORECASE | re.DOTALL
    )
    if bullets_match:
        raw_bullets = bullets_match.group(1).strip()
        for line in raw_bullets.split("\n"):
            line_clean = line.strip()
            if not line_clean:
                continue
            # Strip lead bullet symbols (dashes, asterisks, unicode symbols, numbers)
            item = re.sub(r"^[-•*▪▸►◆●]+\s*", "", line_clean).strip()
            item = re.sub(r"^\d+[.)]\s*", "", item).strip()
            item = re.sub(r"^\*\*(.+?)\*\*:?\s*", r"\1: ", item).strip()
            item = re.sub(r"^[*_]+|[*_]+$", "", item).strip()
            if item and len(item.split()) >= 3:
                bullets.append(item)

    # Fallback: if no structured title found, use first non-empty line
    if not title:
        lines = [l.strip() for l in clean_text.split("\n") if l.strip()]
        if lines:
            candidate = re.sub(r"^(?:Title|TITLE):?\s*", "", lines[0], flags=re.IGNORECASE).strip("*'\"# ")
            if len(candidate.split()) <= 12:
                title = candidate

    # Fallback: if no structured summary found
    if not summary:
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

    # Dynamically scale max_tokens based on requested target length
    effective_max_tokens = max_tokens
    if length == "50 words":
        effective_max_tokens = max(max_tokens, 600)
    elif length == "100 words":
        effective_max_tokens = max(max_tokens, 900)
    elif length == "250 words":
        effective_max_tokens = max(max_tokens, 1400)
    elif length == "Detailed":
        effective_max_tokens = max(max_tokens, 2048)

    # Truncate very long input to leave room for LLM output within context window.
    # Gemma 4 E2B default context is 4096 tokens (~3000 words).
    # We reserve ~1500 tokens for thinking + structured output.
    MAX_INPUT_WORDS = 2000
    words = text.split()
    if len(words) > MAX_INPUT_WORDS:
        text = " ".join(words[:MAX_INPUT_WORDS])

    prompt = quick_summary_prompt(text=text, length=length, fmt=fmt)

    t0 = time.time()
    response = adapter.generate(
        prompt=prompt,
        model_id=model_id,
        system_prompt=system_prompt,
        temperature=temperature,
        max_tokens=effective_max_tokens,
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
