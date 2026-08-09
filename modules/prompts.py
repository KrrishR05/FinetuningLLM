def quick_summary_prompt(text: str, length: str = "100 words", fmt: str = "bullets") -> str:
    word_guidelines = {
        "50 words": "Provide a concise 2-3 sentence executive overview (approx 50 words).",
        "100 words": "Provide a well-balanced executive overview (approx 100 words).",
        "250 words": "Provide a detailed, comprehensive executive overview (approx 250 words).",
        "Detailed": "Provide an in-depth, thorough executive breakdown."
    }
    length_desc = word_guidelines.get(length, f"Target length: {length}.")

    if fmt == "bullets":
        output_format_instructions = f"""
OUTPUT FORMAT (Strictly follow this structure):
Title: <Create a concise, professional 3-7 word title>

Summary:
<Executive summary paragraph synthesizing the core thesis. {length_desc}>

Key Points:
- <Full, informative key takeaway sentence>
- <Full, informative key takeaway sentence>
- <Full, informative key takeaway sentence>
"""
    else:
        output_format_instructions = f"""
OUTPUT FORMAT (Strictly follow this structure):
Title: <Create a concise, professional 3-7 word title>

Summary:
<Executive summary paragraph synthesizing the core thesis and main takeaways. {length_desc}>
"""

    return f"""You are an expert executive summarization assistant.
Your task is to analyze the text below and generate a high-impact, professional summary.

RULES:
1. Synthesize the core ideas into a polished summary—do NOT simply copy or repeat sentences line by line.
2. {length_desc}
3. Preserve all factual details, names, numbers, and dates accurately without outside speculation.
4. Every bullet point in Key Points MUST be a full, meaningful sentence (at least 5 words).

TEXT TO SUMMARIZE:
\"\"\"
{text}
\"\"\"

{output_format_instructions}
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