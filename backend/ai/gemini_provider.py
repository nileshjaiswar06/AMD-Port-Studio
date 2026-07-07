import json
import re

from google import genai
from google.genai import types

from ai.schema import AIAdvisorOutput
from config import settings
from ai.utils import extract_json
from ai.system_prompt import SYSTEM_PROMPT
from ai.chat_schema import ChatAssistantOutput


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
        raw = extract_json(response.text or "{}")
        return AIAdvisorOutput.model_validate(raw)

    def chat(self, context: str) -> str:
        response = self.client.models.generate_content(
        model=self.model,
        contents=context,
        config=types.GenerateContentConfig(
            temperature=0.2,
        ),
    )
        if response.text is None:
                return ""
        return response.text
    
    def structured_chat( self, context: str ) -> ChatAssistantOutput:
        response = self.client.models.generate_content(
            model=self.model,
            contents=context,
            config=types.GenerateContentConfig(
                temperature=0.2,
                response_mime_type="application/json",
        ),
    )

        raw = extract_json(response.text or "{}")
        return ChatAssistantOutput.model_validate(raw)