import json
import re

import httpx

from ai.schema import AIAdvisorOutput
from config import settings

SYSTEM_PROMPT = """You are an AMD ROCm migration engineering advisor.
You receive deterministic repository analysis facts. Never invent packages or scores.
Return ONLY valid JSON matching this schema:
{
  "executiveSummary": "2-4 sentences for engineering teams",
  "migrationComplexity": "Easy|Low|Medium|High",
  "estimatedHours": number,
  "riskLevel": "Low|Moderate|High",
  "keyBlockers": ["..."],
  "recommendedAlternatives": ["..."],
  "migrationSteps": ["ordered steps"],
  "amdDeploymentNotes": "ROCm deployment guidance paragraph",
  "confidence": "low|medium|high"
}
Align migrationComplexity, estimatedHours, and riskLevel with the deterministic facts provided.
Do not claim unsupported libraries are compatible. Be honest about custom CUDA kernels.
"""


def _extract_json(text: str) -> dict:
    text = text.strip()
    if text.startswith("```"):
        text = re.sub(r"^```(?:json)?\n?", "", text)
        text = re.sub(r"\n?```$", "", text)
    return json.loads(text)


class FireworksProvider:
    def __init__(self) -> None:
        if not settings.fireworks_api_key:
            raise ValueError("FIREWORKS_API_KEY is not set")
        self.api_key = settings.fireworks_api_key
        self.model = settings.fireworks_model

    def advise(self, context: str) -> AIAdvisorOutput:
        response = httpx.post(
            "https://api.fireworks.ai/inference/v1/chat/completions",
            headers={
                "Authorization": f"Bearer {self.api_key}",
                "Content-Type": "application/json",
            },
            json={
                "model": self.model,
                "messages": [
                    {"role": "system", "content": SYSTEM_PROMPT},
                    {"role": "user", "content": context},
                ],
                "temperature": 0.2,
                "response_format": {"type": "json_object"},
            },
            timeout=120.0,
        )
        response.raise_for_status()
        content = response.json()["choices"][0]["message"]["content"]
        raw = _extract_json(content or "{}")
        return AIAdvisorOutput.model_validate(raw)
