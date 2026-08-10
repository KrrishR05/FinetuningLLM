"""
rewriter.py -- Grammar Correction & Reformatting with Fact-Lock Protection
Takes raw text, applies grammar/style presets via local LLM,
preserves all factual content, and produces a diff of changes.
"""

import re
import time
import difflib
from typing import Dict, Any, List, Optional

from modules.model_adapter import ModelAdapter
from modules.prompts import grammar_rewrite_prompt
from modules.validators import extract_facts, check_fact_preservation


PRESETS = {
    "grammar": "Grammar Only",
    "formal": "Formal Report",
    "email": "Professional Email",
    "executive": "Executive Brief",
    "bullets": "Bullet Notes",
    "plain": "Plain Language",
}


def _parse_rewrite_response(text: str) -> Dict[str, str]:
    """Parse locked facts, rewritten text, and changes from LLM output."""
    clean = text.strip()
    clean = re.sub(r"<\|channel\b.*?<channel\|>", "", clean, flags=re.DOTALL).strip()

    result = {
        "locked_facts": "",
        "rewritten": "",
        "changes": [],
    }

    # Extract Locked Facts
    facts_match = re.search(
        r"Locked Facts:\s*(.*?)(?=\nRewritten:|\Z)",
        clean, re.IGNORECASE | re.DOTALL,
    )
    if facts_match:
        result["locked_facts"] = facts_match.group(1).strip()

    # Extract Rewritten text
    rewritten_match = re.search(
        r"Rewritten:\s*(.*?)(?=\nChanges Made:|\Z)",
        clean, re.IGNORECASE | re.DOTALL,
    )
    if rewritten_match:
        result["rewritten"] = rewritten_match.group(1).strip()

    # Extract Changes Made
    changes_match = re.search(
        r"Changes Made:\s*(.*)",
        clean, re.IGNORECASE | re.DOTALL,
    )
    if changes_match:
        raw = changes_match.group(1).strip()
        for line in raw.split("\n"):
            line = line.strip()
            if line.startswith(("-", "*", "+")):
                item = re.sub(r"^[\-\*\+\s]+", "", line).strip()
                if item:
                    result["changes"].append(item)

    # Fallback: if parsing failed, use the entire output as rewritten text
    if not result["rewritten"]:
        result["rewritten"] = clean

    return result


def compute_diff(original: str, rewritten: str) -> List[str]:
    """Produce a unified diff between original and rewritten text."""
    orig_lines = original.splitlines(keepends=True)
    new_lines = rewritten.splitlines(keepends=True)

    diff = list(difflib.unified_diff(
        orig_lines, new_lines,
        fromfile="Original", tofile="Rewritten",
        lineterm="",
    ))
    return diff


def rewrite_text(
    text: str,
    adapter: ModelAdapter,
    preset: str = "formal",
    model_id: Optional[str] = None,
    temperature: float = 0.2,
    max_tokens: int = 600,
    system_prompt: Optional[str] = None,
    keep_alive: Optional[Any] = None,
) -> Dict[str, Any]:
    """Run the grammar/rewrite pipeline with fact-lock validation.

    Steps:
    1. Extract locked facts from original text
    2. Send to LLM with rewrite prompt
    3. Parse response
    4. Validate fact preservation
    5. Compute diff
    """
    if not text or not text.strip():
        return {"status": "error", "error": "No input text provided for rewriting."}

    preset_label = PRESETS.get(preset, preset)
    t0 = time.time()

    # Step 1: Pre-extract facts for validation
    pre_facts = extract_facts(text)

    # Step 2: LLM call
    prompt = grammar_rewrite_prompt(text=text, preset=preset_label)
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

    # Step 3: Parse
    parsed = _parse_rewrite_response(response["text"])

    # Step 4: Fact preservation check
    fact_check = check_fact_preservation(text, parsed["rewritten"])

    # Step 5: Diff
    diff_lines = compute_diff(text, parsed["rewritten"])

    # Build warnings list for missing facts
    warnings = []
    for item in fact_check.get("missing", []):
        warnings.append(
            f"Possible {item['category']} change: '{item['value']}' not found in rewritten text"
        )

    return {
        "status": "success",
        "original": text,
        "rewritten": parsed["rewritten"],
        "locked_facts": parsed["locked_facts"],
        "changes": parsed["changes"],
        "diff": diff_lines,
        "fact_check": fact_check,
        "warnings": warnings,
        "preset": preset_label,
        "raw_text": response["text"],
        "latency_seconds": elapsed,
        "model_name": response.get("model_name", ""),
    }
