"""
extractors/_base.py — Base Extractor Interface & Helper
======================================================
Defines the BaseExtractor abstract class and common I/O helpers.
"""

from __future__ import annotations

import abc
from typing import BinaryIO, List, Tuple, Union

from modules.models import PageContent


class BaseExtractor(abc.ABC):
    """Abstract base class for format-specific document extractors."""

    @abc.abstractmethod
    def extract(self, data: bytes) -> Tuple[List[PageContent], List[str]]:
        """Extract content pages and warnings from raw file bytes."""
        ...


def _read_bytes(file: Union[str, bytes, BinaryIO]) -> bytes:
    """Normalize file path, bytes, or file stream into raw bytes."""
    if isinstance(file, bytes):
        return file
    if isinstance(file, str):
        with open(file, "rb") as f:
            return f.read()
    if hasattr(file, "read"):
        pos = file.tell() if hasattr(file, "tell") else 0
        data = file.read()
        if hasattr(file, "seek"):
            file.seek(pos)
        return data if isinstance(data, bytes) else data.encode("utf-8")
    raise TypeError(f"Unsupported input type: {type(file)}")
