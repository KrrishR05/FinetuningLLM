from __future__ import annotations

import re
from typing import List, Tuple

from modules.cleaner import full_clean
from modules.extractors._base import BaseExtractor
from modules.models import PageContent, Section


class TXTExtractor(BaseExtractor):
    LINES_PER_PAGE = 40

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
            warnings.append("Could not decode text file with any supported encoding")
            return pages, warnings

        lines = text_content.splitlines()
        if not lines:
            warnings.append("Text file is empty")
            return pages, warnings

        for i in range(0, len(lines), self.LINES_PER_PAGE):
            page_num = (i // self.LINES_PER_PAGE) + 1
            chunk_lines = lines[i : i + self.LINES_PER_PAGE]
            text = full_clean("\n".join(chunk_lines))

            sections = self._detect_headings(chunk_lines, page_num)

            pages.append(PageContent(
                page_number=page_num,
                text=text,
                source_label=f"Lines {i + 1}-{min(i + self.LINES_PER_PAGE, len(lines))}",
                sections=sections,
            ))

        return pages, warnings

    def _detect_headings(self, lines: list[str], page_num: int) -> List[Section]:
        sections: List[Section] = []
        for line in lines:
            stripped = line.strip()
            if not stripped:
                continue

            if stripped.startswith("#"):
                match = re.match(r'^(#{1,6})\s+(.+)$', stripped)
                if match:
                    level = len(match.group(1))
                    title = match.group(2).strip()
                    sections.append(Section(title=title, level=level, text="", page_number=page_num))
                    continue

            if len(stripped) <= 60 and stripped.isupper() and any(c.isalpha() for c in stripped):
                sections.append(Section(title=stripped, level=1, text="", page_number=page_num))

        return sections


def extract_txt(data: bytes) -> Tuple[List[PageContent], List[str]]:
    return TXTExtractor().extract(data)
