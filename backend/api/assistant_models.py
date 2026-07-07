from pydantic import BaseModel, Field


class AssistantRequest(BaseModel):
    analysis_id: str = Field(min_length=1)
    question: str = Field(min_length=3)


class AssistantResponse(BaseModel):
    answer: str
    recommendation: str
    repositoryImpact: str
    nextSteps: list[str]
    confidence: str
    sources: list[str]