from __future__ import annotations

import json
from typing import List, Tuple

from modules.cleaner import full_clean
from modules.extractors._base import BaseExtractor
from modules.models import PageContent, Section


class JSONExtractor(BaseExtractor):
    ITEMS_PER_PAGE = 20

    def extract(self, data: bytes) -> Tuple[List[PageContent], List[str]]:
        pages: List[PageContent] = []
        warnings: List[str] = []

        text_content = None
        for encoding in ("utf-8", "utf-8-sig"):
            try:
                text_content = data.decode(encoding)
                break
            except (UnicodeDecodeError, ValueError):
                continue

        if text_content is None:
            warnings.append("Could not decode JSON file")
            return pages, warnings

        try:
            parsed = json.loads(text_content)
        except json.JSONDecodeError as e:
            warnings.append(f"Invalid JSON: {e}")
            return pages, warnings

        if isinstance(parsed, dict):
            keys = list(parsed.keys())
            for i, key in enumerate(keys):
                page_num = i + 1
                text = f"Key: {key}\n\n{self._flatten_value(parsed[key])}"
                sections = [Section(title=key, level=1, text="", page_number=page_num)]
                pages.append(PageContent(
                    page_number=page_num,
                    text=full_clean(text),
                    source_label=f'Key: "{key}"',
                    sections=sections,
                ))
        elif isinstance(parsed, list):
            for i in range(0, len(parsed), self.ITEMS_PER_PAGE):
                page_num = (i // self.ITEMS_PER_PAGE) + 1
                chunk_items = parsed[i : i + self.ITEMS_PER_PAGE]
                lines = []
                sections = []
                for j, item in enumerate(chunk_items):
                    item_num = i + j + 1
                    lines.append(f"--- Item {item_num} ---")
                    lines.append(self._flatten_value(item))
                    lines.append("")
                    sections.append(Section(title=f"Item {item_num}", level=2, text="", page_number=page_num))

                text = full_clean("\n".join(lines))
                pages.append(PageContent(
                    page_number=page_num,
                    text=text,
                    source_label=f"Items {i + 1}-{i + len(chunk_items)}",
                    sections=sections,
                ))
        else:
            pages.append(PageContent(
                page_number=1,
                text=str(parsed),
                source_label="Value",
            ))

        return pages, warnings

    def _flatten_value(self, val, indent: int = 0) -> str:
        prefix = "  " * indent
        if isinstance(val, dict):
            lines = []
            for k, v in val.items():
                child = self._flatten_value(v, indent + 1)
                if "\n" in child:
                    lines.append(f"{prefix}{k}:")
                    lines.append(child)
                else:
                    lines.append(f"{prefix}{k}: {child}")
            return "\n".join(lines)
        elif isinstance(val, list):
            if not val:
                return f"{prefix}(empty list)"
            lines = []
            for i, item in enumerate(val):
                lines.append(f"{prefix}[{i + 1}] {self._flatten_value(item, indent + 1).lstrip()}")
            return "\n".join(lines)
        else:
            return f"{prefix}{val}"


def extract_json(data: bytes) -> Tuple[List[PageContent], List[str]]:
    return JSONExtractor().extract(data)
