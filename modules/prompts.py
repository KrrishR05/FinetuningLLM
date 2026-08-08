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

def st_brief_prompt(text: str) -> str:
    return f"""You are a research brief assistant.
Read the text below and fill in every section.

RULES:
- Use ONLY facts present in the text. Do not add outside knowledge.
- Preserve all numbers, units, dates exactly as written.
- If a section has no info in the text, write "Not stated in source."

TEXT:
\"\"\"
{text}
\"\"\"

OUTPUT FORMAT:
Title:
Objective:
Method:
Key Findings:
Important Values/Dates:
Limitations:
Implications:
Keywords:
"""

def news_digest_prompt(text: str, topic: str = "") -> str:
    return f"""You are a news analysis assistant.
Read the headlines/articles below and produce a topic-wise overview.

RULES:
- Use ONLY facts present in the text. Do not add outside knowledge.
- Separate every sentence into either FACT or OPINION — never blend them.
- FACT = verifiable claim (dates, numbers, events, statements attributed to a named source).
- OPINION = editorial judgment, speculation, or unattributed claim.
- Preserve all numbers, dates, and names exactly as written.
- If a topic filter is given ({topic if topic else "none"}), only include items relevant to it.

TEXT:
\"\"\"
{text}
\"\"\"

OUTPUT FORMAT:
Topic: <one line>
Facts:
- <fact 1>
- <fact 2>
Opinions/Editorial Angles:
- <opinion 1>
- <opinion 2>
Overall Summary: <2-3 sentences>
"""