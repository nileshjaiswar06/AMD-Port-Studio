import json
import re

import httpx

from ai.schema import AIAdvisorOutput
from config import settings
from ai.utils import extract_json
from ai.system_prompt import SYSTEM_PROMPT


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
            timeout=45.0,
        )
        response.raise_for_status()
        content = response.json()["choices"][0]["message"]["content"]
        raw = extract_json(content or "{}")
        return AIAdvisorOutput.model_validate(raw)
