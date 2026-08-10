"""
news_digest.py -- News Headline/Editorial Digest with Fact-Opinion Separation
Parses uploaded news text/CSV, groups by topic, separates facts from
editorial opinions, and produces a structured digest via local LLM.
"""

import re
import csv
import io
import time
from typing import Dict, Any, List, Optional

from modules.model_adapter import ModelAdapter
from modules.prompts import news_digest_prompt
from modules.chunker import chunk_pages
from modules.models import PageContent, Chunk


def parse_news_csv(raw_text: str) -> List[Dict[str, str]]:
    """Parse CSV-formatted news input into list of article dicts.

    Expected columns: source, date, type, headline, body
    Tolerates missing columns gracefully.
    """
    articles = []
    try:
        reader = csv.DictReader(io.StringIO(raw_text))
        for row in reader:
            article = {
                "source": row.get("source", "").strip(),
                "date": row.get("date", "").strip(),
                "type": row.get("type", "news").strip().lower(),
                "headline": row.get("headline", "").strip(),
                "body": row.get("body", "").strip(),
            }
            if article["headline"] or article["body"]:
                articles.append(article)
    except Exception:
        pass

    return articles


def articles_to_text(articles: List[Dict[str, str]]) -> str:
    """Format parsed articles into a single text block for the LLM."""
    lines = []
    for i, a in enumerate(articles, 1):
        parts = [f"[{i}]"]
        if a.get("source"):
            parts.append(f"Source: {a['source']}")
        if a.get("date"):
            parts.append(f"Date: {a['date']}")
        if a.get("type"):
            parts.append(f"Type: {a['type']}")
        if a.get("headline"):
            parts.append(f"Headline: {a['headline']}")
        lines.append(" | ".join(parts))
        if a.get("body"):
            lines.append(a["body"])
        lines.append("")

    return "\n".join(lines)


def _parse_digest_response(text: str) -> Dict[str, Any]:
    """Parse the LLM digest output into structured fields."""
    clean = text.strip()
    clean = re.sub(r"<\|channel\b.*?<channel\|>", "", clean, flags=re.DOTALL).strip()

    result = {
        "topic": "",
        "facts": [],
        "opinions": [],
        "summary": "",
    }

    # Extract Topic
    topic_match = re.search(r"Topic:\s*(.*?)(?=\nFacts:|\n\*\*Facts|\Z)", clean, re.IGNORECASE | re.DOTALL)
    if topic_match:
        result["topic"] = topic_match.group(1).strip().strip("*").strip()

    # Extract Facts
    facts_match = re.search(
        r"Facts:\s*(.*?)(?=\nOpinions|Editorial|Overall Summary|\Z)",
        clean, re.IGNORECASE | re.DOTALL,
    )
    if facts_match:
        raw = facts_match.group(1).strip()
        for line in raw.split("\n"):
            line = line.strip()
            if line.startswith(("-", "*", "+")):
                item = re.sub(r"^[\-\*\+\s]+", "", line).strip()
                if item and len(item.split()) >= 3:
                    result["facts"].append(item)

    # Extract Opinions/Editorial Angles
    opinions_match = re.search(
        r"(?:Opinions|Editorial)[^:]*:\s*(.*?)(?=\nOverall Summary|\Z)",
        clean, re.IGNORECASE | re.DOTALL,
    )
    if opinions_match:
        raw = opinions_match.group(1).strip()
        for line in raw.split("\n"):
            line = line.strip()
            if line.startswith(("-", "*", "+")):
                item = re.sub(r"^[\-\*\+\s]+", "", line).strip()
                if item and len(item.split()) >= 3:
                    result["opinions"].append(item)

    # Extract Overall Summary
    summary_match = re.search(r"Overall Summary:\s*(.*)", clean, re.IGNORECASE | re.DOTALL)
    if summary_match:
        result["summary"] = summary_match.group(1).strip()

    return result


def generate_news_digest(
    text: str,
    adapter: ModelAdapter,
    topic: str = "",
    model_id: Optional[str] = None,
    temperature: float = 0.2,
    max_tokens: int = 600,
    system_prompt: Optional[str] = None,
    keep_alive: Optional[Any] = None,
) -> Dict[str, Any]:
    """Generate a news digest with fact-opinion separation.

    Accepts raw text or pre-parsed article text. For large inputs,
    chunks and processes each chunk then merges results.
    """
    if not text or not text.strip():
        return {"status": "error", "error": "No news text provided."}

    t0 = time.time()

    # For short text, single pass
    if len(text) <= 4000:
        prompt = news_digest_prompt(text=text, topic=topic)
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
                "error": response.get("error", "Model returned empty response."),
                "latency_seconds": elapsed,
            }

        parsed = _parse_digest_response(response["text"])
        return {
            "status": "success",
            "digest": parsed,
            "raw_text": response["text"],
            "latency_seconds": elapsed,
            "model_name": response.get("model_name", ""),
        }

    # Chunked processing for longer input
    pages = [PageContent(page_number=1, text=text, source_label="Input")]
    chunks = chunk_pages(pages, max_chars=3500)

    all_facts = []
    all_opinions = []
    all_topics = []
    summaries = []

    for chunk in chunks:
        prompt = news_digest_prompt(text=chunk.text, topic=topic)
        response = adapter.generate(
            prompt=prompt,
            model_id=model_id,
            system_prompt=system_prompt,
            temperature=temperature,
            max_tokens=max_tokens,
            keep_alive=keep_alive,
        )

        if response.get("status") == "success" and response.get("text"):
            parsed = _parse_digest_response(response["text"])
            if parsed["topic"]:
                all_topics.append(parsed["topic"])
            all_facts.extend(parsed["facts"])
            all_opinions.extend(parsed["opinions"])
            if parsed["summary"]:
                summaries.append(parsed["summary"])

    elapsed = round(time.time() - t0, 2)

    if not all_facts and not all_opinions and not summaries:
        return {
            "status": "error",
            "error": "All chunks failed to produce digest output.",
            "latency_seconds": elapsed,
        }

    # Deduplicate
    seen_facts = []
    for f in all_facts:
        if f not in seen_facts:
            seen_facts.append(f)

    seen_opinions = []
    for o in all_opinions:
        if o not in seen_opinions:
            seen_opinions.append(o)

    merged_topic = all_topics[0] if all_topics else (topic if topic else "General News Digest")
    merged_summary = " ".join(summaries) if summaries else ""

    return {
        "status": "success",
        "digest": {
            "topic": merged_topic,
            "facts": seen_facts,
            "opinions": seen_opinions,
            "summary": merged_summary,
        },
        "num_chunks": len(chunks),
        "latency_seconds": elapsed,
    }
