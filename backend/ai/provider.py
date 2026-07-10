from ai.fireworks_provider import FireworksProvider
from ai.gemini_provider import GeminiProvider
from ai.prompt_builder import build_advisor_context
from ai.schema import AIAdvisorOutput
from config import settings

def get_ai_provider():
    provider = settings.ai_provider.lower()

    if provider == "gemini":
        try:
            return GeminiProvider()
        except Exception as e:
            print(f"[AI] Failed to initialize Gemini provider: {e}")
            return None

    if provider == "fireworks":
        try:
            return FireworksProvider()
        except Exception as e:
            print(f"[AI] Failed to initialize Fireworks provider: {e}")
            return None

    print(f"[AI] Unknown provider: {provider}")
    return None


def run_migration_advisor(
    repo_name: str,
    repo_url: str,
    findings: dict,
    compatibility: dict,
    deterministic_analysis: dict,
) -> AIAdvisorOutput | None:
    try:
        provider = get_ai_provider()
        if provider is None:
            return None
        context = build_advisor_context(
            repo_name, repo_url, findings, compatibility, deterministic_analysis
        )
        return provider.advise(context)
    except Exception:
        print("=" * 80)
        print("AI MIGRATION ADVISOR ERROR")
        traceback.print_exc()
        print("=" * 80)
        raise

from knowledge.rag import build_rag_context


import traceback

def run_rag_assistant(
    question: str,
    analysis: dict,
):
    print("AI Provider:", settings.ai_provider)
    print("Gemini Key Present:", bool(settings.gemini_api_key))
    print("Fireworks Key Present:", bool(settings.fireworks_api_key))
    try:

        provider = get_ai_provider()

        if provider is None:
            print("No AI provider configured.")
            return None

        context, chunks = build_rag_context(
            question,
            analysis,
        )

        result = provider.structured_chat(context)

        return {
            "answer": result.answer,
            "recommendation": result.recommendation,
            "repositoryImpact": result.repositoryImpact,
            "nextSteps": result.nextSteps,
            "confidence": result.confidence,
            "sources": [
                chunk["title"]
                for chunk in chunks
            ],
        }

    except Exception as e:
        print("=" * 80)
        print("RAG ERROR")
        traceback.print_exc()
        print("=" * 80)
        return None