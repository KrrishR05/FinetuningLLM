"""
extractors/__init__.py — Document Extractor Registry and Dispatcher
=====================================================================
Unified entry point for document extraction across all supported file formats:
  extract(file, filename)  -> ExtractionResult
  get_supported_extensions() -> set of supported file extensions
  extraction_summary(result) -> human-readable string summary
"""

from __future__ import annotations

import os
from typing import BinaryIO, Callable, Dict, List, Optional, Set, Tuple, Union

from modules.extractors._base import _read_bytes
from modules.extractors.csv_ext import extract_csv
from modules.extractors.docx import extract_docx
from modules.extractors.json_ext import extract_json
from modules.extractors.pdf import extract_pdf
from modules.extractors.pptx import extract_pptx
from modules.extractors.txt import extract_txt
from modules.extractors.xlsx import extract_xlsx
from modules.models import ExtractionResult, PageContent, Section, TableData

SUPPORTED_EXTENSIONS: Set[str] = {
    ".pdf", ".docx", ".pptx", ".txt",
    ".csv", ".json", ".xlsx", ".md",
}

_EXTRACTORS: Dict[str, Callable[[bytes], Tuple[List[PageContent], List[str]]]] = {
    ".pdf":  extract_pdf,
    ".docx": extract_docx,
    ".pptx": extract_pptx,
    ".txt":  extract_txt,
    ".md":   extract_txt,
    ".csv":  extract_csv,
    ".json": extract_json,
    ".xlsx": extract_xlsx,
}


def get_supported_extensions() -> Set[str]:
    """Return the set of supported file extensions (with leading dots)."""
    return SUPPORTED_EXTENSIONS.copy()


def extract(
    file: Union[str, bytes, BinaryIO],
    filename: Optional[str] = None,
) -> ExtractionResult:
    """
    Universal entry point for document extraction.

    Parameters
    ----------
    file : str | bytes | BinaryIO
        File path, raw byte string, or file-like stream.
    filename : str, optional
        Filename used to determine format extension when file is bytes or stream.

    Returns
    -------
    ExtractionResult
        Extracted pages, full text, metadata, detected sections, and tables.
    """
    warnings: List[str] = []

    if filename is None:
        if isinstance(file, str):
            filename = os.path.basename(file)
        elif hasattr(file, "name"):
            filename = file.name
        else:
            return ExtractionResult(
                pages=[],
                full_text="",
                metadata={"error": "Cannot determine file format - no filename provided"},
                warnings=["Cannot determine file format. Please provide a filename."],
            )

    ext = os.path.splitext(filename)[1].lower()

    if ext not in _EXTRACTORS:
        return ExtractionResult(
            pages=[],
            full_text="",
            metadata={"format": ext, "error": f"Unsupported format: {ext}"},
            warnings=[
                f"Unsupported file format: '{ext}'. "
                f"Supported: {', '.join(sorted(SUPPORTED_EXTENSIONS))}"
            ],
        )

    try:
        data = _read_bytes(file)
    except Exception as e:
        return ExtractionResult(
            pages=[],
            full_text="",
            metadata={"format": ext, "error": str(e)},
            warnings=[f"Failed to read file: {e}"],
        )

    if not data:
        return ExtractionResult(
            pages=[],
            full_text="",
            metadata={"format": ext, "error": "File is empty"},
            warnings=["The uploaded file is empty (0 bytes)."],
        )

    extractor_fn = _EXTRACTORS[ext]
    try:
        pages, extract_warnings = extractor_fn(data)
        warnings.extend(extract_warnings)
    except Exception as e:
        return ExtractionResult(
            pages=[],
            full_text="",
            metadata={"format": ext, "error": str(e)},
            warnings=[f"Extraction failed: {e}"],
        )

    full_text = "\n\n".join(p.text for p in pages if p.text.strip())

    all_sections: List[Section] = []
    all_tables: List[TableData] = []
    for p in pages:
        all_sections.extend(p.sections)
        all_tables.extend(p.tables)

    metadata = {
        "format": ext.lstrip("."),
        "filename": filename,
        "num_pages": len(pages),
        "non_empty_pages": sum(1 for p in pages if p.text.strip()),
        "char_count": len(full_text),
        "word_count": len(full_text.split()),
        "num_sections": len(all_sections),
        "num_tables": len(all_tables),
    }

    return ExtractionResult(
        pages=pages,
        full_text=full_text,
        metadata=metadata,
        warnings=warnings,
        sections=all_sections,
        tables=all_tables,
    )


def extraction_summary(result: ExtractionResult) -> str:
    """Generate a clean, single-line human-readable summary of an ExtractionResult."""
    m = result.metadata
    fmt = m.get("format", "unknown").upper()
    pages = m.get("num_pages", 0)
    non_empty = m.get("non_empty_pages", pages)
    chars = m.get("char_count", 0)
    words = m.get("word_count", 0)
    num_tables = m.get("num_tables", len(result.tables))
    num_sections = m.get("num_sections", len(result.sections))

    parts = [f"{fmt}"]
    if pages == 1:
        parts.append("1 page")
    else:
        parts.append(f"{pages} pages")
        if non_empty < pages:
            parts.append(f"({non_empty} with text)")

    parts.append(f"{words:,} words")
    parts.append(f"{chars:,} chars")

    if num_sections > 0:
        parts.append(f"{num_sections} section(s)")
    if num_tables > 0:
        parts.append(f"{num_tables} table(s)")

    if result.warnings:
        parts.append(f"{len(result.warnings)} warning(s)")

    return " * ".join(parts)
