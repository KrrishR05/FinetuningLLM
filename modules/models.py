"""
models.py — Data Structures for Document Extraction
===================================================
Provides dataclasses representing page content, detected sections,
extracted tables, chunks, and extraction results.
"""

from __future__ import annotations

from dataclasses import dataclass, field
from typing import List, Optional


@dataclass
class Section:
    """Represents a detected heading or section within a document page."""
    title: str
    level: int
    text: str
    page_number: int

    def __repr__(self) -> str:
        return f"Section(level={self.level}, title={self.title!r}, page={self.page_number})"


@dataclass
class TableData:
    """Represents a structured table extracted from a document."""
    headers: List[str]
    rows: List[List[str]]
    page_number: int
    caption: str = ""

    @property
    def num_rows(self) -> int:
        """Return number of data rows in table."""
        return len(self.rows)

    @property
    def num_cols(self) -> int:
        """Return number of columns in table."""
        return len(self.headers) if self.headers else (len(self.rows[0]) if self.rows else 0)

    def to_text(self) -> str:
        """Render table as pipe-delimited text for LLM prompts."""
        lines: list[str] = []
        if self.caption:
            lines.append(f"Table: {self.caption}")
        if self.headers:
            lines.append(" | ".join(self.headers))
            lines.append(" | ".join("---" for _ in self.headers))
        for row in self.rows:
            lines.append(" | ".join(row))
        return "\n".join(lines)


@dataclass
class PageContent:
    """Represents extracted content for a single page or logical section."""
    page_number: int
    text: str
    source_label: str
    sections: List[Section] = field(default_factory=list)
    tables: List[TableData] = field(default_factory=list)


@dataclass
class Chunk:
    """Represents a text chunk sized for LLM context windows."""
    text: str
    source_pages: str
    char_count: int = 0
    chunk_type: str = "text"

    def __post_init__(self):
        self.char_count = len(self.text)


@dataclass
class ExtractionResult:
    """Complete result container for a document extraction process."""
    pages: List[PageContent]
    full_text: str = ""
    metadata: dict = field(default_factory=dict)
    warnings: List[str] = field(default_factory=list)
    sections: List[Section] = field(default_factory=list)
    tables: List[TableData] = field(default_factory=list)

    def __post_init__(self):
        if not self.full_text and self.pages:
            self.full_text = "\n\n".join(p.text for p in self.pages if p.text.strip())
        if not self.metadata:
            self.metadata = {
                "num_pages": len(self.pages),
                "char_count": len(self.full_text),
            }
        if not self.sections and self.pages:
            for page in self.pages:
                self.sections.extend(page.sections)
        if not self.tables and self.pages:
            for page in self.pages:
                self.tables.extend(page.tables)
