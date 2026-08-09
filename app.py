import os
import streamlit as st
from modules.model_adapter import ModelAdapter
from modules.summarizer import summarize_text
from modules.extractor import extract

# ---------------------------------------------------------
# Page Config & Custom Design System (CSS)
# ---------------------------------------------------------
st.set_page_config(
    page_title="NETRAVAANI — Offline LLM Suite",
    page_icon="💎",
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
    st.markdown("### 💎 Engine & Model Registry")
    
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
                <span class="badge-online">🟢 Model Server Online</span>
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
                <span class="badge-offline">🔴 Server Offline</span>
                <div style="font-size: 0.8rem; color: #9ca3af; margin-top: 6px;">
                    Run <code>run_offline.bat</code> to launch local server.
                </div>
            </div>
            """,
            unsafe_allow_html=True,
        )
        if st.button("🧹 Release GPU VRAM Now", use_container_width=True):
            if adapter.unload_model(selected_model_id):
                st.toast("✅ GPU VRAM Released!", icon="🚀")
            else:
                st.toast("ℹ️ Model already unloaded or offline.", icon="💡")

    st.markdown("---")
    st.markdown("### ⚙️ Generation Settings")
    auto_unload_vram = st.checkbox(
        "⚡ Auto-release GPU VRAM after generation",
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
    st.caption("🔒 100% Air-Gapped Local Inference Engine")

# ---------------------------------------------------------
# App Header
# ---------------------------------------------------------
st.markdown(
    """
    <div class="netra-header">
        <div class="netra-title">💎 NETRAVAANI — Offline LLM Suite</div>
        <div class="netra-subtitle">
            <span>🔒 Air-Gapped Document Intelligence</span>
            <span>•</span>
            <span>⚡ Zero Cloud Dependency</span>
            <span>•</span>
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
    "⚡ 1. AI/ML Text Summarization",
    "🔬 2. S&T Document Brief",
    "📰 3. News Digest & Fact/Opinion",
    "✍️ 4. Rewrite & Grammar",
])

# =========================================================
# TAB 1: AI/ML Text Summarization (P0)
# =========================================================
with tab1:
    st.markdown("### ⚡ AI/ML Text Summarization")
    st.markdown("Summarize unstructured text or documents locally with custom length and structural formatting controls.")

    col_input, col_config = st.columns([2, 1])

    with col_input:
        input_mode = st.radio(
            "Select Input Source",
            ["📝 Paste Raw Text", "📁 Upload Document (.pdf, .docx, .txt)"],
            horizontal=True,
        )

        extracted_text = ""
        doc_filename = ""
        doc_page_count = 0

        if input_mode == "📝 Paste Raw Text":
            extracted_text = st.text_area(
                "Paste Text Here",
                height=240,
                placeholder="Paste the text or report paragraph you wish to summarize...",
            )
            if extracted_text:
                char_count = len(extracted_text)
                word_count = len(extracted_text.split())
                st.caption(f"📊 **Input Stats:** {word_count:,} words | {char_count:,} characters")

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
                
                if result.error:
                    st.error(f"❌ Extraction error: {result.error}")
                else:
                    extracted_text = result.text
                    doc_page_count = result.page_count
                    word_count = len(extracted_text.split())
                    
                    st.success(
                        f"📄 **Extracted successfully:** `{doc_filename}` ({doc_page_count} pages, {word_count:,} words)"
                    )
                    with st.expander("👁️ View Extracted Document Preview"):
                        st.text(extracted_text[:1500] + ("..." if len(extracted_text) > 1500 else ""))

    with col_config:
        st.markdown("<div class='glass-card'>", unsafe_allow_html=True)
        st.markdown("<div class='glass-card-header'>🎛️ Summarizer Controls</div>", unsafe_allow_html=True)
        
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

        generate_btn = st.button("⚡ Generate Summary", use_container_width=True, type="primary")
        st.markdown("</div>", unsafe_allow_html=True)

    # Execution & Output Section
    if generate_btn:
        if not extracted_text or not extracted_text.strip():
            st.warning("⚠️ Please paste text or upload a valid document first!")
        else:
            st.markdown("---")
            with st.spinner("🧠 Local model is generating structured summary..."):
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
                st.markdown("### 📌 Structured Summary Output")
                
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
                st.markdown("#### 📝 Executive Summary")
                st.markdown(f"<div class='summary-box'>{res['summary']}</div>", unsafe_allow_html=True)

                # Bullet Points section
                if res.get("bullets"):
                    st.markdown("#### 🔑 Key Takeaways")
                    for b in res["bullets"]:
                        st.markdown(
                            f"""
                            <div class="bullet-item">
                                <span>🔹</span>
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
                        label="📥 Download Summary (.txt)",
                        data=full_export_text,
                        file_name=f"summary_{res['title'][:20].replace(' ', '_')}.txt",
                        mime="text/plain",
                    )

                with col_meta2:
                    st.markdown(
                        f"""
                        <div style="text-align: right; font-size: 0.85rem; color: #9ca3af;">
                            ⚡ <b>Latency:</b> <code>{res.get('latency_seconds')}s</code> | 
                            🤖 <b>Model:</b> <code>{res.get('model_name')}</code> ({res.get('runtime')})
                        </div>
                        """,
                        unsafe_allow_html=True,
                    )

            else:
                st.error(f"❌ Summarization failed: {res.get('error')}")

# =========================================================
# TAB 2: S&T Document Brief (P0 - Placeholder preview)
# =========================================================
with tab2:
    st.markdown("### 🔬 Science & Technology Document Brief")
    st.info("🚧 **Tab 2 Workspace Ready:** S&T Map-Reduce pipeline for research PDFs/DOCX with page-aware citations will be active next.")

# =========================================================
# TAB 3: News Digest & Fact/Opinion (P0 - Placeholder preview)
# =========================================================
with tab3:
    st.markdown("### 📰 News Digest & Fact/Opinion Separator")
    st.info("🚧 **Tab 3 Workspace Ready:** Topic-wise headline overview & strict fact vs. editorial viewpoint separator will be active next.")

# =========================================================
# TAB 4: Rewrite & Grammar (P0 - Placeholder preview)
# =========================================================
with tab4:
    st.markdown("### ✍️ Reformatting & Contextual Grammar Fixer")
    st.info("🚧 **Tab 4 Workspace Ready:** Grammar rewrite presets with locked facts protection and side-by-side diff view will be active next.")
