def quick_summary_prompt(text: str, length: str = "100 words", fmt: str = "bullets") -> str:
    return f"""You are a precise summarization assistant.
Summarize the following text in {length}, formatted as {fmt}.

RULES:
- Use ONLY facts present in the text below. Do not add outside knowledge.
- Preserve all numbers, dates, and names exactly as written.
- If the text is unclear or too short to summarize meaningfully, say so instead of inventing content.

TEXT:
\"\"\"
{text}
\"\"\"

OUTPUT FORMAT:
Title: <one line>
Summary: <the summary>
Key Points: <3-5 bullets>
"""