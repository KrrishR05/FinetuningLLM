"""
validators.py -- Fact Preservation Checks
Extracts locked facts (numbers, dates, proper nouns, units) from source text
and verifies they are preserved in LLM-rewritten output.
"""

import re
from typing import Dict, List, Any


_DATE_PATTERN = re.compile(
    r'\b(?:'
    r'\d{1,2}[/\-\.]\d{1,2}[/\-\.]\d{2,4}'
    r'|(?:January|February|March|April|May|June|July|August|September|October|November|December'
    r'|Jan|Feb|Mar|Apr|Jun|Jul|Aug|Sep|Sept|Oct|Nov|Dec)'
    r'\.?\s+\d{1,2},?\s+\d{4}'
    r'|\d{1,2}\s+(?:January|February|March|April|May|June|July|August|September|October|November|December'
    r'|Jan|Feb|Mar|Apr|Jun|Jul|Aug|Sep|Sept|Oct|Nov|Dec)\.?\s+\d{4}'
    r'|\d{4})'
    r'\b',
    re.IGNORECASE,
)

_NUMBER_PATTERN = re.compile(
    r'\b\d[\d,]*\.?\d*\s*(?:%|percent|kg|km|m|cm|mm|lb|lbs|oz|mg|g|'
    r'MHz|GHz|kHz|Hz|MW|kW|W|kWh|MB|GB|TB|KB|USD|INR|EUR|GBP|'
    r'crore|lakh|billion|million|trillion|thousand)?\b',
    re.IGNORECASE,
)

_PROPER_NOUN_PATTERN = re.compile(
    r'\b[A-Z][a-z]+(?:\s+[A-Z][a-z]+)*\b'
)

_UNIT_PATTERN = re.compile(
    r'\b\d[\d,]*\.?\d*\s*(?:kg|km|m|cm|mm|lb|lbs|oz|mg|g|'
    r'MHz|GHz|kHz|Hz|MW|kW|W|kWh|MB|GB|TB|KB|meters|kilometres|'
    r'kilograms|grams|miles|feet|inches|litres|liters|gallons)\b',
    re.IGNORECASE,
)


def extract_facts(text: str) -> Dict[str, List[str]]:
    """Pull all locked factual tokens from text, grouped by category."""
    dates = list(set(_DATE_PATTERN.findall(text)))
    numbers = list(set(_NUMBER_PATTERN.findall(text)))
    proper_nouns = list(set(_PROPER_NOUN_PATTERN.findall(text)))
    units = list(set(_UNIT_PATTERN.findall(text)))

    # Filter out very short proper nouns that are likely sentence starters
    stopwords = {
        "The", "This", "That", "These", "Those", "There", "Then",
        "They", "Their", "When", "Where", "Which", "What", "With",
        "From", "Into", "Upon", "About", "After", "Before", "During",
        "However", "Although", "Because", "Since", "While", "Also",
        "Some", "Many", "Most", "Such", "Each", "Every", "Both",
    }
    proper_nouns = [n for n in proper_nouns if n not in stopwords and len(n) > 2]

    return {
        "dates": dates,
        "numbers": numbers,
        "proper_nouns": proper_nouns,
        "units": units,
    }


def check_fact_preservation(
    original_text: str,
    rewritten_text: str,
) -> Dict[str, Any]:
    """Compare original vs rewritten text for fact preservation.

    Returns a dict with preserved/missing facts and a pass/fail verdict.
    """
    original_facts = extract_facts(original_text)
    rewritten_lower = rewritten_text.lower()

    preserved = []
    missing = []

    for category, items in original_facts.items():
        for item in items:
            if item.lower() in rewritten_lower:
                preserved.append({"category": category, "value": item})
            else:
                missing.append({"category": category, "value": item})

    total = len(preserved) + len(missing)
    score = len(preserved) / total if total > 0 else 1.0

    return {
        "total_facts": total,
        "preserved_count": len(preserved),
        "missing_count": len(missing),
        "preserved": preserved,
        "missing": missing,
        "score": round(score, 3),
        "passed": len(missing) == 0,
    }


def _normalize_value(v: str) -> str:
    """Strip trailing/leading punctuation and whitespace for comparison."""
    return v.strip().strip(".,;:!? ")


def validate_no_hallucination(original_text: str, output_text: str) -> Dict[str, Any]:
    """Basic check that output doesn't introduce numbers/dates absent from source."""
    original_numbers = {_normalize_value(n) for n in _NUMBER_PATTERN.findall(original_text)}
    output_numbers = {_normalize_value(n) for n in _NUMBER_PATTERN.findall(output_text)}

    original_dates = {_normalize_value(d) for d in _DATE_PATTERN.findall(original_text)}
    output_dates = {_normalize_value(d) for d in _DATE_PATTERN.findall(output_text)}

    new_numbers = output_numbers - original_numbers
    new_dates = output_dates - original_dates

    # Filter trivial numbers (single digits, common counts)
    trivial = {"0", "1", "2", "3", "4", "5", "6", "7", "8", "9", "10"}
    new_numbers = {n for n in new_numbers if n not in trivial}

    hallucinated = list(new_numbers | new_dates)

    return {
        "hallucinated_values": hallucinated,
        "count": len(hallucinated),
        "clean": len(hallucinated) == 0,
    }
