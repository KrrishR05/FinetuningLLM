"""
science_brief.py -- S&T Document Summarization with Map-Reduce
Handles uploading S&T PDFs/DOCX, chunking, map-reduce summarization,
and structured research brief generation with page citations.
"""

import re
import time
from typing import Dict, Any, List, Optional

from modules.model_adapter import ModelAdapter
from modules.prompts import st_brief_prompt
from modules.chunker import smart_chunk
from modules.models import PageContent, Chunk


def _parse_brief_response(text: str) -> Dict[str, str]:
    """Parse structured brief fields from raw LLM output."""
    fields = [
        "Title", "Authors", "Source/Published", "Objective",
        "Method", "Key Findings", "Important Values/Dates",
        "Limitations", "Implications", "Keywords",
    ]

    result = {}
    clean = text.strip()

    # Remove internal thinking tags if present
    clean = re.sub(r"<\|channel\b.*?<channel\|>", "", clean, flags=re.DOTALL).strip()

    for i, field in enumerate(fields):
        pattern_parts = [re.escape(field)]
        # Also match without slash variant
        if "/" in field:
            pattern_parts.append(re.escape(field.replace("/", " ")))

        # Build lookahead to stop at next field or end
        if i + 1 < len(fields):
            next_fields = "|".join(re.escape(f) for f in fields[i + 1:])
            stop = rf"(?=\n(?:{next_fields})\s*:|\Z)"
        else:
            stop = r"(?=\Z)"

        pattern = rf"(?:{'|'.join(pattern_parts)})\s*:\s*(.*?){stop}"
        match = re.search(pattern, clean, re.IGNORECASE | re.DOTALL)
        if match:
            value = match.group(1).strip()
            value = re.sub(r"^\*+|\*+$", "", value).strip()
            result[field] = value if value else "Not stated in source."
        else:
            result[field] = "Not stated in source."

    return result


def _map_chunk(
    chunk: Chunk,
    adapter: ModelAdapter,
    model_id: Optional[str],
    temperature: float,
    max_tokens: int,
    system_prompt: Optional[str],
    keep_alive: Optional[Any],
) -> Dict[str, Any]:
    """Summarize a single chunk into a partial brief."""
    prompt = st_brief_prompt(chunk.text)

    response = adapter.generate(
        prompt=prompt,
        model_id=model_id,
        system_prompt=system_prompt,
        temperature=temperature,
        max_tokens=max_tokens,
        keep_alive=keep_alive,
    )

    if response.get("status") != "success" or not response.get("text"):
        return {
            "status": "error",
            "source_pages": chunk.source_pages,
            "error": response.get("error", "Empty response from model."),
        }

    parsed = _parse_brief_response(response["text"])
    parsed["source_pages"] = chunk.source_pages

    return {"status": "success", "fields": parsed, "raw": response["text"]}


def _reduce_briefs(partial_briefs: List[Dict[str, str]]) -> Dict[str, str]:
    """Merge multiple partial briefs into one consolidated brief."""
    merged = {}
    field_names = [
        "Title", "Authors", "Source/Published", "Objective",
        "Method", "Key Findings", "Important Values/Dates",
        "Limitations", "Implications", "Keywords",
    ]

    not_stated = "not stated in source."

    for field in field_names:
        parts = []
        for brief in partial_briefs:
            value = brief.get(field, "").strip()
            if value and value.lower() != not_stated:
                if value not in parts:
                    parts.append(value)

        if not parts:
            merged[field] = "Not stated in source."
        elif field in ("Title", "Objective"):
            # For title/objective, pick the longest non-trivial one
            merged[field] = max(parts, key=len)
        else:
            merged[field] = "\n".join(parts)

    # Collect all source pages
    source_pages = []
    for brief in partial_briefs:
        sp = brief.get("source_pages", "")
        if sp and sp not in source_pages:
            source_pages.append(sp)
    merged["Source Pages"] = ", ".join(source_pages) if source_pages else "N/A"

    return merged


def generate_science_brief(
    pages: List[PageContent],
    adapter: ModelAdapter,
    model_id: Optional[str] = None,
    temperature: float = 0.2,
    max_tokens: int = 600,
    system_prompt: Optional[str] = None,
    keep_alive: Optional[Any] = None,
    max_chunk_chars: int = 3000,
) -> Dict[str, Any]:
    """Run the full map-reduce S&T brief pipeline.

    For short documents (1 chunk), runs a single pass.
    For longer documents, maps each chunk then reduces.
    """
    if not pages:
        return {"status": "error", "error": "No pages provided for S&T brief."}

    total_text = " ".join(p.text for p in pages if p.text.strip())
    if not total_text.strip():
        return {"status": "error", "error": "Extracted text is empty."}

    t0 = time.time()

    chunks = smart_chunk(pages, max_chars=max_chunk_chars)
    if not chunks:
        return {"status": "error", "error": "Chunking produced no output."}

    # Single-chunk fast path
    if len(chunks) == 1:
        map_result = _map_chunk(
            chunks[0], adapter, model_id,
            temperature, max_tokens, system_prompt, keep_alive,
        )
        elapsed = round(time.time() - t0, 2)

        if map_result["status"] != "success":
            return {
                "status": "error",
                "error": map_result.get("error", "Model returned empty."),
                "latency_seconds": elapsed,
            }

        fields = map_result["fields"]
        fields["Source Pages"] = chunks[0].source_pages
        return {
            "status": "success",
            "brief": fields,
            "num_chunks": 1,
            "latency_seconds": elapsed,
        }

    # Map phase: summarize each chunk
    partial_briefs = []
    errors = []
    for chunk in chunks:
        result = _map_chunk(
            chunk, adapter, model_id,
            temperature, max_tokens, system_prompt, keep_alive,
        )
        if result["status"] == "success":
            partial_briefs.append(result["fields"])
        else:
            errors.append(result.get("error", "chunk failed"))

    if not partial_briefs:
        return {
            "status": "error",
            "error": f"All {len(chunks)} chunks failed. Errors: {'; '.join(errors)}",
            "latency_seconds": round(time.time() - t0, 2),
        }

    # Reduce phase: merge partials
    merged = _reduce_briefs(partial_briefs)
    elapsed = round(time.time() - t0, 2)

    return {
        "status": "success",
        "brief": merged,
        "num_chunks": len(chunks),
        "chunks_succeeded": len(partial_briefs),
        "chunks_failed": len(errors),
        "latency_seconds": elapsed,
    }
