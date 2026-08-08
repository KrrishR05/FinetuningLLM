"""
chunker.py — Document Chunking Algorithms
==========================================
Provides page-based and section-aware smart chunking algorithms
for fitting extracted content into LLM context windows.
"""

from __future__ import annotations

import re
from typing import List

from modules.models import Chunk, PageContent


def chunk_pages(
    pages: List[PageContent],
    max_chars: int = 3000,
    overlap_chars: int = 200,
) -> List[Chunk]:
    """
    Merge small pages and split large ones into LLM-friendly chunks.
    Preserves source page labels for citation and tracing.
    """
    if not pages:
        return []

    chunks: List[Chunk] = []
    current_text = ""
    current_page_numbers: list[int] = []

    def _flush():
        nonlocal current_text, current_page_numbers
        if current_text.strip():
            if len(current_page_numbers) == 1:
                src = pages[current_page_numbers[0] - 1].source_label
            else:
                first_label = pages[current_page_numbers[0] - 1].source_label
                last_label = pages[current_page_numbers[-1] - 1].source_label
                src = f"{first_label} - {last_label}"

            chunks.append(Chunk(
                text=current_text.strip(),
                source_pages=src,
            ))
        current_text = ""
        current_page_numbers = []

    for page in pages:
        page_text = page.text.strip()
        if not page_text:
            continue

        if len(page_text) > max_chars:
            _flush()

            words = page_text.split()
            sub_text = ""
            sub_idx = 0
            for word in words:
                if len(sub_text) + len(word) + 1 > max_chars and sub_text:
                    sub_idx += 1
                    chunks.append(Chunk(
                        text=sub_text.strip(),
                        source_pages=f"{page.source_label} (part {sub_idx})",
                    ))
                    overlap_words = sub_text.strip().split()
                    overlap_text = ""
                    for w in reversed(overlap_words):
                        if len(overlap_text) + len(w) + 1 > overlap_chars:
                            break
                        overlap_text = w + " " + overlap_text
                    sub_text = overlap_text.strip() + " " + word
                else:
                    sub_text = sub_text + " " + word if sub_text else word

            if sub_text.strip():
                sub_idx += 1
                chunks.append(Chunk(
                    text=sub_text.strip(),
                    source_pages=f"{page.source_label} (part {sub_idx})" if sub_idx > 1 else page.source_label,
                ))
            continue

        if current_text and len(current_text) + len(page_text) + 2 > max_chars:
            _flush()
            if chunks:
                prev_text = chunks[-1].text
                overlap_segment = prev_text[-overlap_chars:] if len(prev_text) > overlap_chars else ""
                if overlap_segment:
                    space_idx = overlap_segment.find(" ")
                    if space_idx >= 0:
                        overlap_segment = overlap_segment[space_idx + 1:]
                    current_text = overlap_segment + "\n\n"

        current_text = current_text + "\n\n" + page_text if current_text else page_text
        current_page_numbers.append(page.page_number)

    _flush()
    return chunks


_SENTENCE_SPLIT_PATTERN = re.compile(r'(?<=[.!?])\s+')


def smart_chunk(
    pages: List[PageContent],
    max_chars: int = 3000,
    overlap_chars: int = 200,
    respect_sections: bool = True,
) -> List[Chunk]:
    """
    Enhanced chunking with section boundary awareness, sentence splitting,
    and table preservation.
    """
    if not pages:
        return []

    chunks: List[Chunk] = []
    current_text = ""
    current_pages: List[str] = []
    current_type = "text"

    def _flush_chunk():
        nonlocal current_text, current_pages, current_type
        if current_text.strip():
            src_str = ", ".join(dict.fromkeys(current_pages))
            chunks.append(Chunk(
                text=current_text.strip(),
                source_pages=src_str,
                chunk_type=current_type,
            ))
        current_text = ""
        current_pages = []
        current_type = "text"

    for page in pages:
        # Preserve isolated table chunks if they fit within max_chars
        for tbl in page.tables:
            tbl_text = tbl.to_text()
            if len(tbl_text) <= max_chars:
                if current_text.strip():
                    _flush_chunk()
                chunks.append(Chunk(
                    text=tbl_text,
                    source_pages=page.source_label,
                    chunk_type="table",
                ))

        page_text = page.text.strip()
        if not page_text:
            continue

        units = [page_text]
        if len(page_text) > max_chars:
            units = _split_into_sentences_or_paragraphs(page_text, max_chars)

        for unit in units:
            unit_len = len(unit)

            is_section_header = any(
                sec.title in unit[:100] for sec in page.sections
            ) if respect_sections else False

            if is_section_header and current_text and len(current_text) > max_chars // 2:
                _flush_chunk()

            if current_text and len(current_text) + unit_len + 2 > max_chars:
                _flush_chunk()

                if chunks:
                    last_chunk = chunks[-1].text
                    if len(last_chunk) > overlap_chars:
                        overlap_part = last_chunk[-overlap_chars:]
                        space_idx = overlap_part.find(" ")
                        if space_idx != -1:
                            overlap_part = overlap_part[space_idx + 1:]
                        current_text = overlap_part + "\n\n"

            current_text = current_text + "\n\n" + unit if current_text else unit
            current_pages.append(page.source_label)

    _flush_chunk()
    return chunks


def _split_into_sentences_or_paragraphs(text: str, max_chars: int) -> List[str]:
    """Break large text block into paragraphs, then into sentences if needed."""
    paragraphs = text.split("\n\n")
    units: List[str] = []

    for para in paragraphs:
        if len(para) <= max_chars:
            units.append(para)
        else:
            sentences = _SENTENCE_SPLIT_PATTERN.split(para)
            accum = ""
            for sent in sentences:
                if len(accum) + len(sent) + 1 > max_chars and accum:
                    units.append(accum.strip())
                    accum = sent
                else:
                    accum = accum + " " + sent if accum else sent
            if accum.strip():
                units.append(accum.strip())

    return units
