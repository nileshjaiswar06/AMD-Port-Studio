import json
import re

from google import genai
from google.genai import types

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


class GeminiProvider:
    def __init__(self) -> None:
        if not settings.gemini_api_key:
            raise ValueError("GEMINI_API_KEY is not set")
        self.client = genai.Client(api_key=settings.gemini_api_key)
        self.model = settings.gemini_model

    def advise(self, context: str) -> AIAdvisorOutput:
        response = self.client.models.generate_content(
            model=self.model,
            contents=context,
            config=types.GenerateContentConfig(
                system_instruction=SYSTEM_PROMPT,
                temperature=0.2,
                response_mime_type="application/json",
            ),
        )
        raw = _extract_json(response.text or "{}")
        return AIAdvisorOutput.model_validate(raw)