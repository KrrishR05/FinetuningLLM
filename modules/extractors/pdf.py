from __future__ import annotations

from typing import List, Tuple

from modules.cleaner import full_clean
from modules.extractors._base import BaseExtractor
from modules.models import PageContent, Section, TableData


class PDFExtractor(BaseExtractor):

    def extract(self, data: bytes) -> Tuple[List[PageContent], List[str]]:
        import fitz

        pages: List[PageContent] = []
        warnings: List[str] = []

        try:
            doc = fitz.open(stream=data, filetype="pdf")
        except Exception as e:
            warnings.append(f"Failed to open PDF: {e}")
            return pages, warnings

        for i, page in enumerate(doc):
            page_num = i + 1
            sections: List[Section] = []
            tables: List[TableData] = []

            try:
                raw_text = page.get_text("text")
                text = full_clean(raw_text)

                if not text.strip():
                    warnings.append(f"Page {page_num} had no extractable text (may be scanned/image-only)")

                sections = self._extract_sections(page, page_num)
            except Exception as e:
                warnings.append(f"Error extracting text/sections from Page {page_num}: {e}")
                text = ""

            try:
                tables = self._extract_tables(page, page_num)
            except Exception as e:
                warnings.append(f"Error extracting tables from Page {page_num}: {e}")

            pages.append(PageContent(
                page_number=page_num,
                text=text,
                source_label=f"Page {page_num}",
                sections=sections,
                tables=tables,
            ))

        doc.close()
        return pages, warnings

    def _extract_sections(self, page, page_num: int) -> List[Section]:
        sections: List[Section] = []
        try:
            blocks = page.get_text("dict").get("blocks", [])
            font_sizes = []

            for b in blocks:
                if b.get("type") == 0:
                    for line in b.get("lines", []):
                        for span in line.get("spans", []):
                            if span.get("text", "").strip():
                                font_sizes.append(span.get("size", 0))

            if not font_sizes:
                return sections

            avg_size = sum(font_sizes) / len(font_sizes)
            heading_threshold = avg_size * 1.25

            for b in blocks:
                if b.get("type") == 0:
                    for line in b.get("lines", []):
                        line_text = ""
                        max_span_size = 0
                        is_bold = False

                        for span in line.get("spans", []):
                            span_text = span.get("text", "")
                            line_text += span_text
                            max_span_size = max(max_span_size, span.get("size", 0))
                            if "bold" in span.get("font", "").lower() or (span.get("flags", 0) & 2):
                                is_bold = True

                        clean_line = line_text.strip()
                        if not clean_line or len(clean_line) > 120:
                            continue

                        if max_span_size >= heading_threshold or (is_bold and max_span_size > avg_size):
                            level = 1 if max_span_size >= avg_size * 1.5 else 2
                            sections.append(Section(
                                title=clean_line,
                                level=level,
                                text="",
                                page_number=page_num,
                            ))
        except Exception:
            pass

        return sections

    def _extract_tables(self, page, page_num: int) -> List[TableData]:
        tables: List[TableData] = []
        if not hasattr(page, "find_tables"):
            return tables

        try:
            tabs = page.find_tables()
            for tab in tabs:
                df_rows = tab.extract()
                if not df_rows or len(df_rows) < 2:
                    continue

                headers = [str(cell).strip() if cell is not None else "" for cell in df_rows[0]]
                rows = [
                    [str(cell).strip() if cell is not None else "" for cell in row]
                    for row in df_rows[1:]
                ]
                tables.append(TableData(
                    headers=headers,
                    rows=rows,
                    page_number=page_num,
                ))
        except Exception:
            pass

        return tables


def extract_pdf(data: bytes) -> Tuple[List[PageContent], List[str]]:
    return PDFExtractor().extract(data)
