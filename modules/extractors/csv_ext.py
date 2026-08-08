from __future__ import annotations

import csv
import io
from typing import List, Tuple

from modules.cleaner import full_clean
from modules.extractors._base import BaseExtractor
from modules.models import PageContent, TableData


class CSVExtractor(BaseExtractor):
    ROWS_PER_PAGE = 50

    def extract(self, data: bytes) -> Tuple[List[PageContent], List[str]]:
        pages: List[PageContent] = []
        warnings: List[str] = []

        text_content = None
        for encoding in ("utf-8", "utf-8-sig", "latin-1", "cp1252"):
            try:
                text_content = data.decode(encoding)
                break
            except (UnicodeDecodeError, ValueError):
                continue

        if text_content is None:
            warnings.append("Could not decode CSV file")
            return pages, warnings

        try:
            reader = csv.reader(io.StringIO(text_content))
            rows = list(reader)
        except Exception as e:
            warnings.append(f"Failed to parse CSV: {e}")
            return pages, warnings

        if not rows:
            warnings.append("CSV file is empty")
            return pages, warnings

        header = rows[0]
        header_line = " | ".join(header)
        data_rows = rows[1:]

        if not data_rows:
            table = TableData(headers=header, rows=[], page_number=1)
            pages.append(PageContent(
                page_number=1,
                text=f"Headers: {header_line}\n(No data rows)",
                source_label="Rows 1-1 (header only)",
                tables=[table],
            ))
            return pages, warnings

        for i in range(0, len(data_rows), self.ROWS_PER_PAGE):
            page_num = (i // self.ROWS_PER_PAGE) + 1
            chunk_rows = data_rows[i : i + self.ROWS_PER_PAGE]
            row_start = i + 2
            row_end = row_start + len(chunk_rows) - 1

            lines = [f"Columns: {header_line}", ""]
            for row in chunk_rows:
                pairs = []
                for j, val in enumerate(row):
                    col_name = header[j] if j < len(header) else f"Col{j + 1}"
                    if val.strip():
                        pairs.append(f"{col_name}: {val.strip()}")
                if pairs:
                    lines.append("; ".join(pairs))
                else:
                    lines.append("(empty row)")

            table = TableData(headers=header, rows=chunk_rows, page_number=page_num)
            text = full_clean("\n".join(lines))

            pages.append(PageContent(
                page_number=page_num,
                text=text,
                source_label=f"Rows {row_start}-{row_end}",
                tables=[table],
            ))

        return pages, warnings


def extract_csv(data: bytes) -> Tuple[List[PageContent], List[str]]:
    return CSVExtractor().extract(data)
