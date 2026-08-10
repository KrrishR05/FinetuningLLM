"""
FastAPI Backend — NETRAVAANI Offline LLM Suite
===============================================
REST API that wraps existing modules/ core logic.
All Python processing (summarization, extraction, rewriting, etc.)
is handled by the existing modules — this file only provides HTTP endpoints.
"""

import sys
import os

# Ensure the project root is on sys.path so `modules.*` imports work
PROJECT_ROOT = os.path.abspath(os.path.join(os.path.dirname(__file__), ".."))
if PROJECT_ROOT not in sys.path:
    sys.path.insert(0, PROJECT_ROOT)

from fastapi import FastAPI, UploadFile, File, Form
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel, Field
from typing import Optional, List
import json

# --- Import existing core modules (UNCHANGED) ---
from modules.model_adapter import ModelAdapter
from modules.summarizer import summarize_text
from modules.science_brief import generate_science_brief
from modules.news_digest import generate_news_digest, parse_news_csv, articles_to_text
from modules.rewriter import rewrite_text, PRESETS
from modules.validators import check_fact_preservation
from modules.extractor import extract
from modules.models import PageContent

# ---------------------------------------------------------
# App Initialization
# ---------------------------------------------------------
app = FastAPI(
    title="NETRAVAANI API",
    description="Offline LLM Document Intelligence REST API",
    version="1.0.0",
)

# CORS — allow React dev server (Vite on :5173) and production builds
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:5173", "http://127.0.0.1:5173", "http://localhost:3000"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Shared adapter instance
adapter = ModelAdapter()

# ---------------------------------------------------------
# Pydantic Request/Response Models
# ---------------------------------------------------------
class SummarizeRequest(BaseModel):
    text: str
    model_id: Optional[str] = None
    length: str = "100 words"
    fmt: str = "bullets"
    temperature: float = 0.2
    max_tokens: int = 1024
    system_prompt: Optional[str] = None
    auto_unload: bool = False


class ScienceBriefRequest(BaseModel):
    text: str
    model_id: Optional[str] = None
    chunk_size: int = 3000
    temperature: float = 0.2
    max_tokens: int = 600
    system_prompt: Optional[str] = None
    auto_unload: bool = False


class NewsDigestRequest(BaseModel):
    text: str
    topic: str = ""
    model_id: Optional[str] = None
    temperature: float = 0.2
    max_tokens: int = 600
    system_prompt: Optional[str] = None
    auto_unload: bool = False
    csv_mode: bool = False


class RewriteRequest(BaseModel):
    text: str
    preset: str = "formal"
    model_id: Optional[str] = None
    temperature: float = 0.2
    max_tokens: int = 600
    system_prompt: Optional[str] = None
    auto_unload: bool = False


class UnloadRequest(BaseModel):
    model_id: Optional[str] = None


# ---------------------------------------------------------
# API Endpoints
# ---------------------------------------------------------

@app.get("/api/health")
def health_check(model_id: Optional[str] = None):
    """Check Ollama / llama-server health status."""
    health = adapter.check_health(model_id)
    return health


@app.get("/api/models")
def get_models():
    """Return the full model registry from models.json."""
    models = adapter.get_available_models()
    return {"models": models, "presets": PRESETS}


@app.post("/api/summarize")
def api_summarize(req: SummarizeRequest):
    """Tab 1: AI/ML Text Summarization."""
    result = summarize_text(
        text=req.text,
        adapter=adapter,
        model_id=req.model_id,
        length=req.length,
        fmt=req.fmt,
        temperature=req.temperature,
        max_tokens=req.max_tokens,
        system_prompt=req.system_prompt if req.system_prompt else None,
        keep_alive=0 if req.auto_unload else None,
    )
    return result


@app.post("/api/science-brief")
def api_science_brief(req: ScienceBriefRequest):
    """Tab 2: S&T Document Research Brief (map-reduce)."""
    pages = [PageContent(page_number=1, text=req.text, source_label="API Input")]
    result = generate_science_brief(
        pages=pages,
        adapter=adapter,
        model_id=req.model_id,
        temperature=req.temperature,
        max_tokens=req.max_tokens,
        system_prompt=req.system_prompt if req.system_prompt else None,
        keep_alive=0 if req.auto_unload else None,
        max_chunk_chars=req.chunk_size,
    )
    return result


@app.post("/api/news-digest")
def api_news_digest(req: NewsDigestRequest):
    """Tab 3: News Digest with Fact/Opinion separation."""
    text = req.text
    if req.csv_mode:
        articles = parse_news_csv(text)
        if articles:
            text = articles_to_text(articles)
        else:
            return {"status": "error", "error": "Could not parse CSV data."}

    result = generate_news_digest(
        text=text,
        adapter=adapter,
        topic=req.topic,
        model_id=req.model_id,
        temperature=req.temperature,
        max_tokens=req.max_tokens,
        system_prompt=req.system_prompt if req.system_prompt else None,
        keep_alive=0 if req.auto_unload else None,
    )
    return result


@app.post("/api/rewrite")
def api_rewrite(req: RewriteRequest):
    """Tab 4: Grammar Rewrite with Fact-Lock."""
    result = rewrite_text(
        text=req.text,
        adapter=adapter,
        preset=req.preset,
        model_id=req.model_id,
        temperature=req.temperature,
        max_tokens=req.max_tokens,
        system_prompt=req.system_prompt if req.system_prompt else None,
        keep_alive=0 if req.auto_unload else None,
    )
    return result


@app.post("/api/extract")
async def api_extract(file: UploadFile = File(...)):
    """Extract text from uploaded document (PDF, DOCX, TXT, etc.)."""
    file_bytes = await file.read()
    filename = file.filename or "document.txt"

    result = extract(file=file_bytes, filename=filename)

    return {
        "full_text": result.full_text,
        "num_pages": len(result.pages) if result.pages else 0,
        "metadata": result.metadata,
        "warnings": result.warnings,
        "sections": [
            {"title": s.title, "level": s.level, "page_number": s.page_number}
            for s in result.sections
        ] if result.sections else [],
    }


@app.post("/api/unload-model")
def api_unload(req: UnloadRequest):
    """Release model from GPU VRAM."""
    success = adapter.unload_model(req.model_id)
    return {"success": success, "message": "VRAM released" if success else "Model already unloaded or offline"}


# ---------------------------------------------------------
# Run with: uvicorn server.main:app --reload --port 8000
# ---------------------------------------------------------
if __name__ == "__main__":
    import uvicorn
    uvicorn.run("server.main:app", host="0.0.0.0", port=8000, reload=True)
