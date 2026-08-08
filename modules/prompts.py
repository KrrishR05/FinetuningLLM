def quick_summary_prompt(text: str, length: str = "100 words", fmt: str = "bullets") -> str:
    if fmt == "bullets":
        format_instruction = "Use bullet points."
    else:
        format_instruction = "Write as a single continuous paragraph. Do NOT include bullet points or lists."

    if fmt == "bullets":
        output_block = """Title: <one line>
Summary: <the summary>
Key Points: <3-5 bullets>"""
    else:
        output_block = """Title: <one line>
Summary: <the summary>"""

    return f"""You are a precise summarization assistant.
Summarize the following text in {length}. Do NOT exceed {length}.
{format_instruction}

RULES:
- Use ONLY facts present in the text below. Do not add outside knowledge.
- Preserve all numbers, dates, and names exactly as written.
- If the text is unclear or too short to summarize meaningfully, say so instead of inventing content.
- Keep your total response under 400 words.

TEXT:
\"\"\"
{text}
\"\"\"

OUTPUT FORMAT:
{output_block}
"""

def st_brief_prompt(text: str) -> str:
    return f"""You are a research brief assistant.
Read the text below and fill in every section.

RULES:
- Use ONLY facts present in the text. Do not add outside knowledge.
- Preserve all numbers, units, dates exactly as written.
- If a section has no info in the text, write "Not stated in source."
- Keep your total response under 400 words.

TEXT:
\"\"\"
{text}
\"\"\"

OUTPUT FORMAT:
Title:
Authors:
Source/Published:
Objective:
Method:
Key Findings:
Important Values/Dates:
Limitations:
Implications:
Keywords:
"""

def news_digest_prompt(text: str, topic: str = "") -> str:
    if topic:
        topic_instruction = f"IMPORTANT: ONLY include items directly about {topic}. Completely discard all unrelated content."
    else:
        topic_instruction = "No topic filter given — cover all topics present in the text."

    return f"""You are a news analysis assistant.
Read the headlines/articles below and produce a topic-wise overview.

RULES:
- Use ONLY facts present in the text. Do not add outside knowledge.
- Separate every sentence into either FACT or OPINION — never blend them.
- FACT = verifiable claim (dates, numbers, events, statements attributed to a named source).
- OPINION = editorial judgment, speculation, or unattributed claim.
- Preserve all numbers, dates, and names exactly as written.
- {topic_instruction}
- Output exactly ONE set of Topic/Facts/Opinions/Summary. Do not create multiple Topic sections.
- Keep your total response under 400 words.

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

def grammar_rewrite_prompt(text: str, preset: str = "formal") -> str:
    return f"""You are a grammar and clarity assistant.
Your job is to fix grammar and improve phrasing WITHOUT changing any facts.

STEP 1 — Before rewriting, list every factual value in the text that must 
NOT change: numbers, dates, names, units, proper nouns.

STEP 2 — Rewrite the text in a {preset} tone, fixing grammar, punctuation, 
and awkward phrasing. Do not add, remove, or alter any fact from Step 1.

RULES:
- Do not add new information or opinions.
- Do not remove any factual content.
- If a sentence is ambiguous, keep the ambiguity rather than guessing intent.
- Keep your total response under 400 words.

TEXT:
\"\"\"
{text}
\"\"\"

OUTPUT FORMAT:
Locked Facts: <comma-separated list from Step 1>
Rewritten: <the improved version>
Changes Made: <bullet list of what was fixed and why, e.g. "fixed subject-verb agreement in sentence 2">
"""