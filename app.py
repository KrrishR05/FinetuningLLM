import streamlit as st
from modules.model_adapter import ModelAdapter

st.set_page_config(page_title="NODI JI KI WAANI", page_icon="💎", layout="wide")

# Header
st.title("💎 TEMP TEMP AI (NODI JI KI WAANI)")
st.caption("🔒 100% LOCAL AIR-GAPPED CHAT INTERFACE — NO INTERNET REQUIRED")

# Initialize Model Adapter
@st.cache_resource
def get_adapter():
    return ModelAdapter()

adapter = get_adapter()
health = adapter.check_health()

# Sidebar Settings
with st.sidebar:
    st.markdown("### 🎛️ Local Engine Control")
    if health.get("status") in ["online", "CHALU HAI"]:
        st.success(f"🟢 **Local Model CHALU**\n\nRuntime: `{health.get('runtime')}`\nEndpoint: `{health.get('endpoint')}`")
    else:
        st.warning(
            "🟡 **Local Inference Server Standby**\n\n"
            "Run `run_offline.bat` to start Gemma-4 on port `8080` (llama-server) or start Ollama on `11434`."
        )
        if st.button("🔄 Refresh Health Check", use_container_width=True):
            st.rerun()

    st.markdown("---")
    st.markdown("### ⚙️ Generation Settings")
    temperature = st.slider("Temperature (Creativity)", 0.0, 1.0, 0.2, 0.05)
    max_tokens = st.slider("Max Response Tokens", 128, 2048, 512, 64)
    system_prompt = st.text_area(
        "System Prompt",
        value="You are a helpful, direct, and factual local AI assistant powered by Gemma 4 E2B.",
        height=90,
    )

    st.markdown("---")
    if st.button("🗑️ Clear Chat History", use_container_width=True):
        st.session_state.messages = []
        st.rerun()

# Top status banner
if health.get("status") in ["online", "CHALU HAI"]:
    st.success(f"⚡ Local Model CHALU ({health.get('runtime')}) at `{health.get('endpoint')}` — Ready to Chat!")
else:
    st.info("💡 **Local Server Standby:** Double-click `run_offline.bat` to launch Gemma-4 on GPU/CPU port 8080.")

# Initialize chat history
if "messages" not in st.session_state:
    st.session_state.messages = [
        {"role": "assistant", "content": "Namaste! Mai hu Gemma 4 E2B local model. Pucho jo puchna hai, full offline chal raha hu! 🚀"}
    ]

# Display chat messages
for msg in st.session_state.messages:
    with st.chat_message(msg["role"], avatar="🧑" if msg["role"] == "user" else "💎"):
        st.markdown(msg["content"])
        if "latency" in msg:
            st.caption(f"⚡ Latency: `{msg['latency']}s` | Model: `{msg.get('model', 'Gemma-4 E2B')}`")

# Chat input prompt
user_prompt = st.chat_input("Pucho jo puchna hai... (Chat with Gemma 4)")

if user_prompt:
    # 1. Append & display user message
    st.session_state.messages.append({"role": "user", "content": user_prompt})
    with st.chat_message("user", avatar="🧑"):
        st.markdown(user_prompt)

    # 2. Generate response from local model
    with st.chat_message("assistant", avatar="💎"):
        with st.spinner("Gemma-4 soch raha hai..."):
            resp = adapter.generate(
                prompt=user_prompt,
                system_prompt=system_prompt if system_prompt.strip() else None,
                temperature=temperature,
                max_tokens=max_tokens,
            )

            if resp.get("status") == "success" and resp.get("text"):
                reply_text = resp["text"]
                latency = resp.get("latency_seconds", 0.0)
                model_name = resp.get("model_name", "Gemma 4 E2B")

                st.markdown(reply_text)
                st.caption(f"⚡ Latency: `{latency}s` | Model: `{model_name}` ({resp.get('runtime')})")

                st.session_state.messages.append({
                    "role": "assistant",
                    "content": reply_text,
                    "latency": latency,
                    "model": model_name,
                })
            else:
                err_msg = resp.get("error", "Local LLM server is offline.")
                fallback_reply = (
                    f"⚠️ **Local Server Offline Notice:**\n\n"
                    f"{err_msg}\n\n"
                    f"👉 **How to start:** Double-click `run_offline.bat` or run:\n"
                    f"```bash\n"
                    f"llama-server.exe -m gemma-4-E2B-it-Q4_0.gguf --port 8080\n"
                    f"```"
                )
                st.markdown(fallback_reply)
                st.session_state.messages.append({
                    "role": "assistant",
                    "content": fallback_reply,
                })
