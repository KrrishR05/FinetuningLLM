"""
cleaner.py — Text Cleaning and Normalization Utilities
======================================================
Provides functions for text cleaning, Unicode normalization, dehyphenation,
and repeating header/footer line removal across document pages.
"""

from __future__ import annotations

import re
import unicodedata
from collections import Counter
from typing import List

from modules.models import PageContent


def clean_text(text: str) -> str:
    """Strip whitespace from lines and collapse 3+ blank lines into 2."""
    lines = text.splitlines()
    cleaned = [line.strip() for line in lines]

    result_lines: list[str] = []
    blank_count = 0
    for line in cleaned:
        if line == "":
            blank_count += 1
            if blank_count <= 2:
                result_lines.append(line)
        else:
            blank_count = 0
            result_lines.append(line)
    return "\n".join(result_lines).strip()


# Unicode replacements mapping curly quotes, dashes, ligatures, and bullet points to ASCII
_UNICODE_MAP = {
    "\u2018": "'",
    "\u2019": "'",
    "\u201C": '"',
    "\u201D": '"',
    "\u2013": "-",
    "\u2014": "--",
    "\u2026": "...",
    "\u00A0": " ",
    "\u200B": "",
    "\u200C": "",
    "\u200D": "",
    "\uFEFF": "",
    "\u00AD": "",
    "\u2022": "- ",
    "\u2023": "- ",
    "\u25E6": "- ",
    "\u2043": "- ",
    "\u00B7": "- ",
    "\u2012": "-",
    "\u2015": "--",
    "\uFB01": "fi",
    "\uFB02": "fl",
    "\uFB00": "ff",
    "\uFB03": "ffi",
    "\uFB04": "ffl",
}

_UNICODE_PATTERN = re.compile(
    "|".join(re.escape(k) for k in _UNICODE_MAP.keys())
)


def normalize_unicode(text: str) -> str:
    """Normalize non-ASCII Unicode characters, smart quotes, dashes, and ligatures to ASCII."""
    if not text:
        return text

    text = _UNICODE_PATTERN.sub(lambda m: _UNICODE_MAP[m.group()], text)
    text = unicodedata.normalize("NFC", text)
    return text


def remove_headers_footers(
    pages: List[PageContent],
    min_pages_threshold: int = 3,
    max_line_length: int = 120,
) -> List[PageContent]:
    """Detect and remove repeating header or footer lines occurring across pages."""
    if len(pages) < min_pages_threshold:
        return pages

    NUM_LINES_CHECK = 3
    top_lines: list[list[str]] = []
    bottom_lines: list[list[str]] = []

    for page in pages:
        lines = page.text.strip().splitlines()
        top = [_normalize_for_comparison(l) for l in lines[:NUM_LINES_CHECK] if len(l.strip()) <= max_line_length]
        bot = [_normalize_for_comparison(l) for l in lines[-NUM_LINES_CHECK:] if len(l.strip()) <= max_line_length]
        top_lines.append(top)
        bottom_lines.append(bot)

    top_counter: Counter = Counter()
    bottom_counter: Counter = Counter()
    for lines in top_lines:
        for line in lines:
            if line:
                top_counter[line] += 1
    for lines in bottom_lines:
        for line in lines:
            if line:
                bottom_counter[line] += 1

    threshold = len(pages) * 0.5
    header_patterns = {line for line, count in top_counter.items() if count >= threshold}
    footer_patterns = {line for line, count in bottom_counter.items() if count >= threshold}

    if not header_patterns and not footer_patterns:
        return pages

    cleaned_pages: list[PageContent] = []
    for page in pages:
        lines = page.text.splitlines()
        filtered: list[str] = []
        for i, line in enumerate(lines):
            normalized = _normalize_for_comparison(line)
            if i < NUM_LINES_CHECK and normalized in header_patterns:
                continue
            if i >= len(lines) - NUM_LINES_CHECK and normalized in footer_patterns:
                continue
            filtered.append(line)

        cleaned_pages.append(PageContent(
            page_number=page.page_number,
            text="\n".join(filtered).strip(),
            source_label=page.source_label,
            sections=page.sections,
            tables=page.tables,
        ))

    return cleaned_pages


def _normalize_for_comparison(line: str) -> str:
    """Normalize a line for header/footer frequency matching."""
    line = line.strip().lower()
    line = re.sub(r'\b\d+\b', '', line)
    line = re.sub(r'\s+', ' ', line).strip()
    return line


_DEHYPHEN_PATTERN = re.compile(r'(\w+)-\s*\n\s*([a-z]\w*)')


def dehyphenate(text: str) -> str:
    """Rejoin hyphenated words split across line breaks."""
    if not text:
        return text
    return _DEHYPHEN_PATTERN.sub(r'\1\2', text)


def full_clean(text: str) -> str:
    """Apply complete cleaning pipeline: Unicode normalization, dehyphenation, and whitespace cleanup."""
    text = normalize_unicode(text)
    text = dehyphenate(text)
    text = clean_text(text)
    return text
