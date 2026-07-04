from ai.gemini_provider import GeminiProvider
from ai.mock_provider import MockProvider
from ai.prompt_builder import build_advisor_context
from ai.schema import AIAdvisorOutput
from config import settings


def get_ai_provider():
    provider = settings.ai_provider.lower()
    if provider == "gemini":
        return GeminiProvider()
    return MockProvider()


def run_migration_advisor(
    repo_name: str,
    repo_url: str,
    findings: dict,
    compatibility: dict,
    deterministic_analysis: dict,
) -> AIAdvisorOutput | None:
    try:
        context = build_advisor_context(
            repo_name, repo_url, findings, compatibility, deterministic_analysis
        )
        provider = get_ai_provider()
        return provider.advise(context)
    except Exception:
        return None