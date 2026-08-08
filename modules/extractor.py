"""
extractor.py — Document Extraction Module Shim
==============================================
Re-exports the modular extraction system components from:
  - modules.models
  - modules.cleaner
  - modules.chunker
  - modules.extractors

Maintains backward compatibility with imports referencing modules.extractor.
"""

from __future__ import annotations

from modules.chunker import chunk_pages, smart_chunk
from modules.cleaner import clean_text, full_clean, normalize_unicode
from modules.extractors import (
    SUPPORTED_EXTENSIONS,
    extract,
    extraction_summary,
    get_supported_extensions,
)
from modules.models import (
    Chunk,
    ExtractionResult,
    PageContent,
    Section,
    TableData,
)

__all__ = [
    "extract",
    "chunk_pages",
    "smart_chunk",
    "clean_text",
    "full_clean",
    "normalize_unicode",
    "extraction_summary",
    "get_supported_extensions",
    "SUPPORTED_EXTENSIONS",
    "PageContent",
    "Chunk",
    "ExtractionResult",
    "Section",
    "TableData",
]