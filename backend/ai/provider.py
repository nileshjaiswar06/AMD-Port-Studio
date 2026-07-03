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
        except (ValueError, Exception):
            return None
    if provider == "fireworks":
        try:
            return FireworksProvider()
        except (ValueError, Exception):
            return None
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
        return None
