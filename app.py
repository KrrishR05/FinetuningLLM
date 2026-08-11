import os
import streamlit as st
from modules.model_adapter import ModelAdapter
from modules.summarizer import summarize_text
from modules.extractor import extract, extraction_summary
from modules.science_brief import generate_science_brief
from modules.news_digest import generate_news_digest, parse_news_csv, articles_to_text
from modules.rewriter import rewrite_text, PRESETS
from modules.validators import check_fact_preservation

# ---------------------------------------------------------
# Page Config & Custom Design System (CSS)
# ---------------------------------------------------------
st.set_page_config(
    page_title="VERIDIAN — Offline LLM Suite",
    page_icon="",
    layout="wide",
    initial_sidebar_state="expanded",
)

# Premium Glassmorphism & Sleek Dark CSS Styling
st.markdown(
    """
    <style>
    @import url('https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700&display=swap');

    html, body, [class*="css"] {
        font-family: 'Inter', sans-serif;
    }

    /* Main Container Background */
    .stApp {
        background: linear-gradient(135deg, #0d1117 0%, #161b22 50%, #0d1117 100%);
        color: #c9d1d9;
    }

    /* Header Banner */
    .netra-header {
        background: linear-gradient(90deg, rgba(31,41,55,0.7) 0%, rgba(17,24,39,0.9) 100%);
        border: 1px solid rgba(255,255,255,0.08);
        border-radius: 16px;
        padding: 24px 32px;
        margin-bottom: 24px;
        box-shadow: 0 8px 32px 0 rgba(0, 0, 0, 0.37);
        backdrop-filter: blur(12px);
    }
    .netra-title {
        font-size: 2.2rem;
        font-weight: 700;
        background: linear-gradient(90deg, #60a5fa, #a78bfa, #f472b6);
        -webkit-background-clip: text;
        -webkit-text-fill-color: transparent;
        margin: 0 0 6px 0;
    }
    .netra-subtitle {
        color: #9ca3af;
        font-size: 0.95rem;
        font-weight: 400;
        display: flex;
        align-items: center;
        gap: 12px;
    }

    /* Card Containers */
    .glass-card {
        background: rgba(22, 27, 34, 0.75);
        border: 1px solid rgba(255, 255, 255, 0.08);
        border-radius: 14px;
        padding: 20px 24px;
        margin-bottom: 20px;
        backdrop-filter: blur(10px);
        box-shadow: 0 4px 20px rgba(0,0,0,0.25);
    }
    .glass-card-header {
        font-size: 1.15rem;
        font-weight: 600;
        color: #f3f4f6;
        margin-bottom: 12px;
        display: flex;
        align-items: center;
        gap: 8px;
    }

    /* Metric Badges */
    .badge-online {
        background: rgba(16, 185, 129, 0.15);
        border: 1px solid rgba(16, 185, 129, 0.4);
        color: #34d399;
        padding: 4px 12px;
        border-radius: 20px;
        font-size: 0.82rem;
        font-weight: 600;
        display: inline-block;
    }
    .badge-offline {
        background: rgba(239, 68, 68, 0.15);
        border: 1px solid rgba(239, 68, 68, 0.4);
        color: #f87171;
        padding: 4px 12px;
        border-radius: 20px;
        font-size: 0.82rem;
        font-weight: 600;
        display: inline-block;
    }
    .badge-info {
        background: rgba(59, 130, 246, 0.15);
        border: 1px solid rgba(59, 130, 246, 0.4);
        color: #60a5fa;
        padding: 4px 12px;
        border-radius: 20px;
        font-size: 0.82rem;
        font-weight: 500;
    }

    /* Output Summary Box */
    .summary-box {
        background: rgba(17, 24, 39, 0.85);
        border-left: 4px solid #60a5fa;
        border-radius: 8px;
        padding: 18px 22px;
        font-size: 1.02rem;
        line-height: 1.65;
        color: #e5e7eb;
        margin-bottom: 16px;
    }
    .bullet-item {
        background: rgba(31, 41, 55, 0.5);
        border: 1px solid rgba(255,255,255,0.05);
        border-radius: 8px;
        padding: 10px 14px;
        margin-bottom: 8px;
        font-size: 0.95rem;
        color: #d1d5db;
        display: flex;
        align-items: flex-start;
        gap: 10px;
    }

    /* Tabs Styling */
    .stTabs [data-baseweb="tab-list"] {
        gap: 8px;
        background-color: rgba(15, 23, 42, 0.6);
        padding: 8px;
        border-radius: 12px;
        border: 1px solid rgba(255,255,255,0.06);
    }
    .stTabs [data-baseweb="tab"] {
        border-radius: 8px;
        padding: 10px 20px;
        color: #94a3b8;
        font-weight: 500;
    }
    .stTabs [aria-selected="true"] {
        background-color: #2563eb !important;
        color: #ffffff !important;
        font-weight: 600;
    }
    </style>
    """,
    unsafe_allow_html=True,
)

# ---------------------------------------------------------
# Adapter Initialization
# ---------------------------------------------------------
def get_adapter():
    a = ModelAdapter()
    a.load_registry()
    return a

adapter = get_adapter()
model_profiles = adapter.get_available_models()

# ---------------------------------------------------------
# Sidebar Controls & Model Selector
# ---------------------------------------------------------
with st.sidebar:
    st.markdown("###  Engine & Model Registry")
    
    # Model Selector Dropdown
    model_options = {m["id"]: f"{m.get('label', m['id'])}" for m in model_profiles}
    selected_model_id = st.selectbox(
        "Select Local LLM Model",
        options=list(model_options.keys()),
        format_func=lambda x: model_options[x],
        index=0,
        help="Switch between downloaded local models offline.",
    )
    
    # Selected Model Health Status
    health = adapter.check_health(selected_model_id)
    if health.get("status") in ["online", "CHALU HAI"]:
        st.markdown(
            f"""
            <div style="margin-top: 10px;">
                <span class="badge-online"> Model Server Online</span>
                <div style="font-size: 0.8rem; color: #9ca3af; margin-top: 6px;">
                    <b>Runtime:</b> <code>{health.get('runtime')}</code><br>
                    <b>Endpoint:</b> <code>{health.get('endpoint')}</code>
                </div>
            </div>
            """,
            unsafe_allow_html=True,
        )
    else:
        st.markdown(
            """
            <div style="margin-top: 10px;">
                <span class="badge-offline"> Server Offline</span>
                <div style="font-size: 0.8rem; color: #9ca3af; margin-top: 6px;">
                    Run <code>run_offline.bat</code> to launch local server.
                </div>
            </div>
            """,
            unsafe_allow_html=True,
        )
        if st.button(" Release GPU VRAM Now", use_container_width=True):
            if adapter.unload_model(selected_model_id):
                st.toast(" GPU VRAM Released!", icon="")
            else:
                st.toast(" Model already unloaded or offline.", icon="")

    st.markdown("---")
    st.markdown("### Generation Settings")
    auto_unload_vram = st.checkbox(
        " Auto-release GPU VRAM after generation",
        value=False,
        help="Instantly unloads model weights from VRAM after generation ends to free GPU memory.",
    )
    temperature = st.slider("Temperature (Creativity)", 0.0, 1.0, 0.2, 0.05)
    max_tokens = st.slider("Max Response Tokens", 128, 2048, 512, 64)
    system_prompt = st.text_area(
        "Custom System Prompt",
        value="You are a precise, direct, and factual offline LLM assistant.",
        height=90,
    )


    st.markdown("---")
    st.caption(" 100% Air-Gapped Local Inference Engine")

# ---------------------------------------------------------
# App Header
# ---------------------------------------------------------
st.markdown(
    """
    <div class="netra-header">
        <div class="netra-title"> VERIDIAN — Offline LLM Suite</div>
        <div class="netra-subtitle">
            <span> Air-Gapped Document Intelligence</span>
            <span></span>
            <span> Zero Cloud Dependency</span>
            <span></span>
            <span class="badge-info">RTX 4060 Accelerated</span>
        </div>
    </div>
    """,
    unsafe_allow_html=True,
)

# ---------------------------------------------------------
# 4 Main Workflow Tabs
# ---------------------------------------------------------
tab1, tab2, tab3, tab4 = st.tabs([
    " 1. AI/ML Text Summarization",
    " 2. S&T Document Brief",
    " 3. News Digest & Fact/Opinion",
    " 4. Rewrite & Grammar",
])

# =========================================================
# TAB 1: AI/ML Text Summarization (P0)
# =========================================================
with tab1:
    st.markdown("###  AI/ML Text Summarization")
    st.markdown("Summarize unstructured text or documents locally with custom length and structural formatting controls.")

    col_input, col_config = st.columns([2, 1])

    with col_input:
        input_mode = st.radio(
            "Select Input Source",
            [" Paste Raw Text", " Upload Document (.pdf, .docx, .txt)"],
            horizontal=True,
        )

        extracted_text = ""
        doc_filename = ""
        doc_page_count = 0

        if input_mode == " Paste Raw Text":
            extracted_text = st.text_area(
                "Paste Text Here",
                height=240,
                placeholder="Paste the text or report paragraph you wish to summarize...",
            )
            if extracted_text:
                char_count = len(extracted_text)
                word_count = len(extracted_text.split())
                st.caption(f" **Input Stats:** {word_count:,} words | {char_count:,} characters")

        else:
            uploaded_file = st.file_uploader(
                "Upload a File",
                type=["pdf", "docx", "txt"],
                help="Supports PDF, Word (.docx), and plain text (.txt) files.",
            )
            if uploaded_file is not None:
                doc_filename = uploaded_file.name
                file_bytes = uploaded_file.read()
                
                with st.spinner("Extracting text from document..."):
                    result = extract(file=file_bytes, filename=doc_filename)
                
                if result.warnings and not result.full_text.strip():
                    st.error(f"Extraction error: {result.warnings[0]}")
                else:
                    extracted_text = result.full_text
                    doc_page_count = result.metadata.get("num_pages", 0)
                    word_count = len(extracted_text.split())
                    
                    st.success(
                        f"Extracted successfully: `{doc_filename}` ({doc_page_count} pages, {word_count:,} words)"
                    )
                    with st.expander("View Extracted Document Preview"):
                        st.text(extracted_text[:1500] + ("..." if len(extracted_text) > 1500 else ""))

    with col_config:
        st.markdown("<div class='glass-card'>", unsafe_allow_html=True)
        st.markdown("<div class='glass-card-header'> Summarizer Controls</div>", unsafe_allow_html=True)
        
        target_length = st.select_slider(
            "Target Summary Length",
            options=["50 words", "100 words", "250 words", "Detailed"],
            value="100 words",
        )

        output_format = st.selectbox(
            "Output Structural Format",
            ["Bullet Points", "Executive Paragraph"],
            index=0,
        )

        fmt_key = "bullets" if output_format == "Bullet Points" else "paragraph"

        generate_btn = st.button(" Generate Summary", use_container_width=True, type="primary")
        st.markdown("</div>", unsafe_allow_html=True)

    # Execution & Output Section
    if generate_btn:
        if not extracted_text or not extracted_text.strip():
            st.warning("Please paste text or upload a valid document first!")
        else:
            st.markdown("---")
            with st.spinner(" Local model is generating structured summary..."):
                res = summarize_text(
                    text=extracted_text,
                    adapter=adapter,
                    model_id=selected_model_id,
                    length=target_length,
                    fmt=fmt_key,
                    temperature=temperature,
                    max_tokens=max_tokens,
                    system_prompt=system_prompt if system_prompt.strip() else None,
                    keep_alive=0 if auto_unload_vram else None,
                )


            if res.get("status") == "success":
                st.markdown("###  Structured Summary Output")
                
                # Title Card
                st.markdown(
                    f"""
                    <div style="background: rgba(37, 99, 235, 0.15); border: 1px solid rgba(37, 99, 235, 0.4); padding: 12px 18px; border-radius: 10px; margin-bottom: 16px;">
                        <span style="font-size: 0.8rem; text-transform: uppercase; letter-spacing: 1px; color: #60a5fa; font-weight: 600;">Title</span>
                        <div style="font-size: 1.25rem; font-weight: 700; color: #ffffff; margin-top: 2px;">{res['title']}</div>
                    </div>
                    """,
                    unsafe_allow_html=True,
                )

                # Executive Summary Text
                st.markdown("####  Executive Summary")
                st.markdown(f"<div class='summary-box'>{res['summary']}</div>", unsafe_allow_html=True)

                # Bullet Points section
                if res.get("bullets"):
                    st.markdown("####  Key Takeaways")
                    for b in res["bullets"]:
                        st.markdown(
                            f"""
                            <div class="bullet-item">
                                <span></span>
                                <div>{b}</div>
                            </div>
                            """,
                            unsafe_allow_html=True,
                        )

                # Action toolbar & Metadata
                st.markdown("<br>", unsafe_allow_html=True)
                col_meta1, col_meta2 = st.columns([1, 1])

                with col_meta1:
                    full_export_text = f"TITLE: {res['title']}\n\nSUMMARY:\n{res['summary']}\n\n"
                    if res.get("bullets"):
                        full_export_text += "KEY POINTS:\n" + "\n".join([f"- {b}" for b in res["bullets"]])
                    
                    st.download_button(
                        label=" Download Summary (.txt)",
                        data=full_export_text,
                        file_name=f"summary_{res['title'][:20].replace(' ', '_')}.txt",
                        mime="text/plain",
                    )

                with col_meta2:
                    st.markdown(
                        f"""
                        <div style="text-align: right; font-size: 0.85rem; color: #9ca3af;">
                             <b>Latency:</b> <code>{res.get('latency_seconds')}s</code> | 
                             <b>Model:</b> <code>{res.get('model_name')}</code> ({res.get('runtime')})
                        </div>
                        """,
                        unsafe_allow_html=True,
                    )

            else:
                st.error(f" Summarization failed: {res.get('error')}")

# =========================================================
# TAB 2: S&T Document Brief (P0)
# =========================================================
with tab2:
    st.markdown("### S&T Document Research Brief")
    st.markdown("Upload a scientific/technical PDF or DOCX to generate a structured research brief with page citations.")

    st2_col_input, st2_col_config = st.columns([2, 1])

    with st2_col_input:
        st2_input_mode = st.radio(
            "Input Source",
            ["Upload S&T Document (.pdf, .docx, .txt)", "Paste Raw Text"],
            horizontal=True,
            key="st2_input_mode",
        )

        st2_text = ""
        st2_pages = []

        if st2_input_mode == "Paste Raw Text":
            st2_text = st.text_area(
                "Paste S&T Text Here",
                height=220,
                placeholder="Paste the research paper or technical report text...",
                key="st2_textarea",
            )
            if st2_text.strip():
                from modules.models import PageContent
                st2_pages = [PageContent(page_number=1, text=st2_text, source_label="Pasted Text")]
                st.caption(f"Input: {len(st2_text.split()):,} words | {len(st2_text):,} characters")
        else:
            st2_file = st.file_uploader(
                "Upload S&T Document",
                type=["pdf", "docx", "txt", "md"],
                help="Supports PDF, DOCX, TXT, and Markdown files.",
                key="st2_uploader",
            )
            if st2_file is not None:
                st2_bytes = st2_file.read()
                with st.spinner("Extracting document text..."):
                    st2_result = extract(file=st2_bytes, filename=st2_file.name)

                if st2_result.warnings and not st2_result.full_text.strip():
                    st.error(f"Extraction error: {st2_result.warnings[0]}")
                else:
                    st2_pages = st2_result.pages
                    st2_text = st2_result.full_text
                    st2_meta = st2_result.metadata
                    st.success(
                        f"Extracted: `{st2_file.name}` ({st2_meta.get('num_pages', 0)} pages, "
                        f"{st2_meta.get('word_count', 0):,} words, {st2_meta.get('num_sections', 0)} sections)"
                    )
                    with st.expander("View Extracted Preview"):
                        st.text(st2_text[:1500] + ("..." if len(st2_text) > 1500 else ""))

    with st2_col_config:
        st.markdown("<div class='glass-card'>", unsafe_allow_html=True)
        st.markdown("<div class='glass-card-header'>Brief Settings</div>", unsafe_allow_html=True)
        st2_chunk_size = st.slider("Chunk Size (chars)", 1500, 5000, 3000, 500, key="st2_chunk")
        st2_generate = st.button("Generate S&T Brief", use_container_width=True, type="primary", key="st2_btn")
        st.markdown("</div>", unsafe_allow_html=True)

    if st2_generate:
        if not st2_pages:
            st.warning("Please upload a document or paste text first.")
        else:
            st.markdown("---")
            with st.spinner("Generating structured S&T brief (map-reduce)..."):
                st2_res = generate_science_brief(
                    pages=st2_pages,
                    adapter=adapter,
                    model_id=selected_model_id,
                    temperature=temperature,
                    max_tokens=max_tokens,
                    system_prompt=system_prompt if system_prompt.strip() else None,
                    keep_alive=0 if auto_unload_vram else None,
                    max_chunk_chars=st2_chunk_size,
                )

            if st2_res.get("status") == "success":
                brief = st2_res["brief"]
                st.markdown("### Structured Research Brief")

                for field_name in ["Title", "Authors", "Source/Published", "Objective",
                                   "Method", "Key Findings", "Important Values/Dates",
                                   "Limitations", "Implications", "Keywords", "Source Pages"]:
                    value = brief.get(field_name, "Not stated in source.")
                    st.markdown(
                        f"<div style='background: rgba(17,24,39,0.85); border-left: 4px solid #60a5fa; "
                        f"border-radius: 8px; padding: 12px 16px; margin-bottom: 10px;'>"
                        f"<span style='font-size:0.8rem; text-transform:uppercase; letter-spacing:1px; "
                        f"color:#60a5fa; font-weight:600;'>{field_name}</span>"
                        f"<div style='color:#e5e7eb; margin-top:4px;'>{value}</div></div>",
                        unsafe_allow_html=True,
                    )

                col_b1, col_b2 = st.columns([1, 1])
                with col_b1:
                    export_lines = [f"{k}: {v}" for k, v in brief.items()]
                    st.download_button(
                        label="Download Brief (.txt)",
                        data="\n\n".join(export_lines),
                        file_name="st_research_brief.txt",
                        mime="text/plain",
                        key="st2_download",
                    )
                with col_b2:
                    st.markdown(
                        f"<div style='text-align:right; font-size:0.85rem; color:#9ca3af;'>"
                        f"Latency: <code>{st2_res.get('latency_seconds')}s</code> | "
                        f"Chunks: <code>{st2_res.get('num_chunks', 1)}</code></div>",
                        unsafe_allow_html=True,
                    )
            else:
                st.error(f"S&T Brief generation failed: {st2_res.get('error')}")

# =========================================================
# TAB 3: News Digest & Fact/Opinion (P0)
# =========================================================
with tab3:
    st.markdown("### News Digest & Fact/Opinion Separator")
    st.markdown("Upload news headlines/editorials or paste text to get a topic-wise overview with strict fact vs. opinion separation.")

    st3_col_input, st3_col_config = st.columns([2, 1])

    with st3_col_input:
        st3_input_mode = st.radio(
            "Input Source",
            ["Paste Raw Text", "Paste CSV (source,date,type,headline,body)"],
            horizontal=True,
            key="st3_input_mode",
        )

        st3_text = ""
        if st3_input_mode == "Paste Raw Text":
            st3_text = st.text_area(
                "Paste News Headlines / Articles",
                height=220,
                placeholder="Paste news headlines, articles, or editorials here...",
                key="st3_textarea",
            )
        else:
            st3_csv_raw = st.text_area(
                "Paste CSV Data",
                height=220,
                placeholder="source,date,type,headline,body\nTimes of India,2024-01-15,news,ISRO Launches PSLV,Details here...",
                key="st3_csv",
            )
            if st3_csv_raw.strip():
                articles = parse_news_csv(st3_csv_raw)
                if articles:
                    st3_text = articles_to_text(articles)
                    st.caption(f"Parsed {len(articles)} articles from CSV")
                else:
                    st.warning("Could not parse CSV. Check column headers: source, date, type, headline, body")

    with st3_col_config:
        st.markdown("<div class='glass-card'>", unsafe_allow_html=True)
        st.markdown("<div class='glass-card-header'>Digest Settings</div>", unsafe_allow_html=True)
        st3_topic = st.text_input("Topic Filter (optional)", value="", placeholder="e.g. Space, Defence, AI", key="st3_topic")
        st3_generate = st.button("Generate News Digest", use_container_width=True, type="primary", key="st3_btn")
        st.markdown("</div>", unsafe_allow_html=True)

    if st3_generate:
        if not st3_text or not st3_text.strip():
            st.warning("Please paste news text or CSV data first.")
        else:
            st.markdown("---")
            with st.spinner("Analyzing news for fact/opinion separation..."):
                st3_res = generate_news_digest(
                    text=st3_text,
                    adapter=adapter,
                    topic=st3_topic,
                    model_id=selected_model_id,
                    temperature=temperature,
                    max_tokens=max_tokens,
                    system_prompt=system_prompt if system_prompt.strip() else None,
                    keep_alive=0 if auto_unload_vram else None,
                )

            if st3_res.get("status") == "success":
                digest = st3_res["digest"]

                # Topic Header
                st.markdown(
                    f"<div style='background: rgba(37,99,235,0.15); border: 1px solid rgba(37,99,235,0.4); "
                    f"padding: 12px 18px; border-radius: 10px; margin-bottom: 16px;'>"
                    f"<span style='font-size:0.8rem; text-transform:uppercase; letter-spacing:1px; "
                    f"color:#60a5fa; font-weight:600;'>Topic</span>"
                    f"<div style='font-size:1.25rem; font-weight:700; color:#fff; margin-top:2px;'>"
                    f"{digest.get('topic', 'General')}</div></div>",
                    unsafe_allow_html=True,
                )

                # Facts
                if digest.get("facts"):
                    st.markdown("#### Verified Facts")
                    for fact in digest["facts"]:
                        st.markdown(
                            f"<div class='bullet-item'><span style='color:#34d399;'>FACT</span>"
                            f"<div>{fact}</div></div>",
                            unsafe_allow_html=True,
                        )

                # Opinions
                if digest.get("opinions"):
                    st.markdown("#### Editorial Opinions")
                    for opinion in digest["opinions"]:
                        st.markdown(
                            f"<div class='bullet-item'><span style='color:#f59e0b;'>OPINION</span>"
                            f"<div>{opinion}</div></div>",
                            unsafe_allow_html=True,
                        )

                # Summary
                if digest.get("summary"):
                    st.markdown("#### Overall Summary")
                    st.markdown(f"<div class='summary-box'>{digest['summary']}</div>", unsafe_allow_html=True)

                col_n1, col_n2 = st.columns([1, 1])
                with col_n1:
                    export = f"Topic: {digest.get('topic', '')}\n\nFacts:\n"
                    export += "\n".join(f"- {f}" for f in digest.get('facts', []))
                    export += "\n\nOpinions:\n"
                    export += "\n".join(f"- {o}" for o in digest.get('opinions', []))
                    export += f"\n\nSummary: {digest.get('summary', '')}"
                    st.download_button(
                        label="Download Digest (.txt)",
                        data=export,
                        file_name="news_digest.txt",
                        mime="text/plain",
                        key="st3_download",
                    )
                with col_n2:
                    st.markdown(
                        f"<div style='text-align:right; font-size:0.85rem; color:#9ca3af;'>"
                        f"Latency: <code>{st3_res.get('latency_seconds')}s</code> | "
                        f"Model: <code>{st3_res.get('model_name', '')}</code></div>",
                        unsafe_allow_html=True,
                    )
            else:
                st.error(f"News digest failed: {st3_res.get('error')}")

# =========================================================
# TAB 4: Rewrite & Grammar (P0)
# =========================================================
with tab4:
    st.markdown("### Reformatting & Contextual Grammar Fixer")
    st.markdown("Paste text to fix grammar and reformat with fact-lock protection. All facts are verified after rewriting.")

    st4_col_input, st4_col_config = st.columns([2, 1])

    with st4_col_input:
        st4_text = st.text_area(
            "Paste Text for Rewriting",
            height=220,
            placeholder="Paste the rough draft, report text, or email you want to fix...",
            key="st4_textarea",
        )
        if st4_text.strip():
            st.caption(f"Input: {len(st4_text.split()):,} words | {len(st4_text):,} characters")

    with st4_col_config:
        st.markdown("<div class='glass-card'>", unsafe_allow_html=True)
        st.markdown("<div class='glass-card-header'>Rewrite Settings</div>", unsafe_allow_html=True)
        st4_preset = st.selectbox(
            "Style Preset",
            options=list(PRESETS.keys()),
            format_func=lambda x: PRESETS[x],
            index=1,
            key="st4_preset",
        )
        st4_generate = st.button("Rewrite Text", use_container_width=True, type="primary", key="st4_btn")
        st.markdown("</div>", unsafe_allow_html=True)

    if st4_generate:
        if not st4_text or not st4_text.strip():
            st.warning("Please paste text to rewrite first.")
        else:
            st.markdown("---")
            with st.spinner(f"Rewriting with '{PRESETS.get(st4_preset, st4_preset)}' preset + fact-lock check..."):
                st4_res = rewrite_text(
                    text=st4_text,
                    adapter=adapter,
                    preset=st4_preset,
                    model_id=selected_model_id,
                    temperature=temperature,
                    max_tokens=max_tokens,
                    system_prompt=system_prompt if system_prompt.strip() else None,
                    keep_alive=0 if auto_unload_vram else None,
                )

            if st4_res.get("status") == "success":
                # Side-by-side comparison
                st.markdown("### Original vs. Rewritten")
                col_orig, col_new = st.columns(2)
                with col_orig:
                    st.markdown("**Original**")
                    st.markdown(
                        f"<div style='background:rgba(17,24,39,0.85); border-left:4px solid #6b7280; "
                        f"border-radius:8px; padding:14px 18px; color:#d1d5db; font-size:0.95rem; "
                        f"line-height:1.6;'>{st4_res['original']}</div>",
                        unsafe_allow_html=True,
                    )
                with col_new:
                    st.markdown("**Rewritten**")
                    st.markdown(
                        f"<div style='background:rgba(17,24,39,0.85); border-left:4px solid #34d399; "
                        f"border-radius:8px; padding:14px 18px; color:#e5e7eb; font-size:0.95rem; "
                        f"line-height:1.6;'>{st4_res['rewritten']}</div>",
                        unsafe_allow_html=True,
                    )

                # Fact-Lock Report
                fact_check = st4_res.get("fact_check", {})
                score = fact_check.get("score", 0)
                if fact_check.get("passed"):
                    st.markdown(
                        f"<div style='background:rgba(16,185,129,0.15); border:1px solid rgba(16,185,129,0.4); "
                        f"padding:10px 16px; border-radius:8px; color:#34d399; font-weight:600;'>"
                        f"Fact-Lock Check PASSED - All {fact_check.get('total_facts', 0)} facts preserved "
                        f"(score: {score})</div>",
                        unsafe_allow_html=True,
                    )
                else:
                    st.markdown(
                        f"<div style='background:rgba(239,68,68,0.15); border:1px solid rgba(239,68,68,0.4); "
                        f"padding:10px 16px; border-radius:8px; color:#f87171; font-weight:600;'>"
                        f"Fact-Lock WARNING - {fact_check.get('missing_count', 0)} of "
                        f"{fact_check.get('total_facts', 0)} facts may have changed (score: {score})</div>",
                        unsafe_allow_html=True,
                    )

                # Warnings
                if st4_res.get("warnings"):
                    with st.expander(f"Fact-Lock Warnings ({len(st4_res['warnings'])})" ):
                        for w in st4_res["warnings"]:
                            st.markdown(f"- {w}")

                # Changes list
                if st4_res.get("changes"):
                    with st.expander("Changes Made"):
                        for c in st4_res["changes"]:
                            st.markdown(f"- {c}")

                # Diff view
                if st4_res.get("diff"):
                    with st.expander("Unified Diff"):
                        diff_text = "\n".join(st4_res["diff"])
                        st.code(diff_text, language="diff")

                # Metadata and download
                col_r1, col_r2 = st.columns([1, 1])
                with col_r1:
                    export = f"PRESET: {st4_res.get('preset', '')}\n\n"
                    export += f"ORIGINAL:\n{st4_res['original']}\n\n"
                    export += f"REWRITTEN:\n{st4_res['rewritten']}\n\n"
                    if st4_res.get('changes'):
                        export += "CHANGES:\n" + "\n".join(f"- {c}" for c in st4_res['changes'])
                    st.download_button(
                        label="Download Rewrite (.txt)",
                        data=export,
                        file_name="rewritten_text.txt",
                        mime="text/plain",
                        key="st4_download",
                    )
                with col_r2:
                    st.markdown(
                        f"<div style='text-align:right; font-size:0.85rem; color:#9ca3af;'>"
                        f"Latency: <code>{st4_res.get('latency_seconds')}s</code> | "
                        f"Model: <code>{st4_res.get('model_name', '')}</code></div>",
                        unsafe_allow_html=True,
                    )
            else:
                st.error(f"Rewrite failed: {st4_res.get('error')}")
