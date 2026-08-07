# Offline Intelligence Suite (Netravaani)

> **A 100% local, air-gapped document intelligence workspace powered by open-source LLMs.**  
> Summarize sensitive documents, generate structured S&T research briefs, digest local news with fact/opinion separation, and rewrite text with strict factual integrity — entirely offline without cloud APIs.

---

## 📌 Features & Workflows

### 1. ⚡ Quick Summary Mode
- Input pasted text or upload `TXT`, `PDF`, or `DOCX` files.
- Adjustable output lengths: Short (50 words), Medium (100 words), or Detailed Executive Brief.
- Formats: Paragraph, Bullet points, or Key takeaways.

### 2. 🔬 Science & Technology (S&T) Research Brief
- Page-aware extraction for technical documents.
- Automatic map-reduce summarization preserving original page citations.
- Extracts **Objective**, **Methodology**, **Key Findings**, **Values/Units/Dates**, and **Limitations**.

### 3. 📰 News & Editorial Digest
- Process pre-stored local news headlines and editorials (CSV or TXT format).
- Topic-wise timeline overview.
- **Strict Fact vs. Opinion Separation**: News facts are strictly isolated from subjective editorial viewpoints.

### 4. ✍️ Rewrite & Grammar (Context-Safe)
- Rewrite technical drafts into formal reports, emails, or executive memos.
- **Fact-Lock Engine**: Locks dates, numerical values, proper nouns, and technical units to prevent hallucination during rewrite.
- Side-by-side original vs. revised diff view with change explanations.

### 5. 🎛️ Config-Driven Multi-Model Registry
- Seamlessly switch between **5 local models across 4 families**:
  - `Qwen 2.5 7B` (Alibaba) — *Default (GPU-accelerated)*
  - `Qwen 2.5 3B` (Alibaba) — *Fast / CPU-friendly profile*
  - `Llama 3.2 3B` (Meta) — *Cross-vendor model profile*
  - `Gemma 3 4B` (Google) — *High instruction-following capability*
  - `Phi-4 Mini 3.8B` (Microsoft) — *Reasoning profile*
- Driven by `models.json` — add or swap models without changing application code.

---

## 🛠️ System Requirements

- **OS:** Windows 10/11, Linux, or macOS
- **CPU:** Intel i5/i7 or AMD Ryzen 5/7 (Multi-core recommended)
- **RAM:** 16GB minimum (32GB recommended)
- **GPU (Optional but recommended):** NVIDIA RTX 3060 / 4060 or better (8GB+ VRAM)
- **Runtime:** Python 3.10+ and [Ollama](https://ollama.com/)

---

## 🚀 Quick Setup Guide

### Phase 1: Setup & Model Download (Requires Internet)

1. **Clone or Navigate to Project Directory:**
   ```bash
   cd Hackathon_Project
   ```

2. **Install Python Dependencies:**
   ```bash
   pip install -r requirements.txt
   ```

3. **Pull Tested Local Models via Ollama:**
   ```bash
   # Pull default high-quality demo model
   ollama pull qwen2.5:7b

   # Pull remaining multi-vendor profiles (optional but recommended for judging)
   ollama pull qwen2.5:3b
   ollama pull llama3.2:3b
   ollama pull gemma3:4b
   ollama pull phi4-mini:3.8b
   ```

---

### Phase 2: Running 100% Offline (Air-Gapped Mode)

1. **Disconnect Internet:** Disable Wi-Fi and unplug Ethernet cables.
2. **Start the Application:**
   - Double-click `run_offline.bat` (Windows)  
   - OR run via CLI:
     ```bash
     streamlit run app.py
     ```
3. **Access UI:** Open browser at `http://localhost:8501`.

---

## 📂 Project Architecture

```
Hackathon_Project/
├── app.py                      # Main Streamlit UI with 4 workflow tabs
├── modules/
│   ├── model_adapter.py        # Unified Ollama / GGUF local model interface
│   ├── extractor.py            # Page-aware PDF / DOCX / TXT text extraction
│   ├── summarizer.py           # Quick summary pipeline
│   ├── science_brief.py        # S&T map-reduce chunking & structured output
│   ├── news_digest.py          # Topic grouping & Fact/Opinion separator
│   ├── rewriter.py             # Grammar reformatting & side-by-side diff
│   ├── prompts.py              # Centralized prompt templates
│   └── validators.py           # Fact preservation & entity locking logic
├── models.json                 # Model registry configuration
├── sample_data/                # Sample S&T papers, news CSVs, and technical drafts
│   ├── st_papers/
│   ├── news/
│   └── rough_drafts/
├── evaluation-results.csv      # Model latency & accuracy test log
├── requirements.txt            # Python dependencies
├── run_offline.bat             # One-click offline launcher
├── manifest.json               # System metadata & model licenses
└── README.md                   # Project documentation
```

---

## 🌐 LAN Server-Client Deployment

To run in **Isolated-LAN mode** (serving multiple browser clients over a local router without WAN):

```bash
streamlit run app.py --server.address 0.0.0.0 --server.port 8501
```

Other devices on the local router can access the suite at `http://<SERVER_IP>:8501`.

---

## 📜 License & Compliance

- Built strictly using open-source tools (`Streamlit`, `PyMuPDF`, `Ollama`).
- Pre-downloaded model weights adhere to their respective open-weight licenses (Apache 2.0 / Llama 3 Community / Gemma Terms).
