from knowledge.retrieval import retrieve


def build_rag_context(
    question: str,
    analysis: dict,
) -> tuple[str, list[dict]]:
    """
    Build the prompt context for the AI assistant.
    Returns:
        prompt
        retrieved_chunks
    """

    chunks = retrieve(question)

    findings = analysis.get("findings", {})
    compatibility = analysis.get("compatibility", {})
    recommendations = analysis.get("recommendations", [])
    confidence = analysis.get("confidence", {})

    knowledge = []

    for chunk in chunks:
        knowledge.append(
            f"""
Title: {chunk['title']}
Category: {chunk['category']}
Question: {chunk['question']}
Answer: {chunk['answer']}
Alternative: {chunk['alternative']}
"""
        )

    context = f"""
You are AMD Port Studio, an AI assistant that helps engineers migrate
AI applications from NVIDIA CUDA to AMD ROCm.

You are inside a professional engineering dashboard.

Your answers MUST be concise, actionable and repository-specific.

========================
Repository Findings
========================

{findings}

========================
Compatibility Analysis
========================

{compatibility}

========================
Recommendations
========================

{recommendations}

========================
Confidence
========================

{confidence}

========================
Retrieved AMD Knowledge
========================

{''.join(knowledge)}

========================
User Question
========================

{question}

======================================================
STRICT RESPONSE FORMAT
======================================================

Return ONLY JSON.

{{
  "answer": "...",

  "recommendation": "...",

  "repositoryImpact": "...",

  "nextSteps": [
    "...",
    "...",
    "..."
  ],

  "confidence": "High"
}}

Rules

Never output markdown.

Never output headings.

Never explain the JSON.

Return JSON only.
"""

    return context, chunks