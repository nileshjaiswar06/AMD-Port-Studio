from pydantic import BaseModel, Field

class ChatAssistantOutput(BaseModel):
    answer: str = Field(min_length=10)
    recommendation: str = Field(min_length=5)
    repositoryImpact: str = Field(min_length=5)
    nextSteps: list[str] = Field(default_factory=list)
    confidence: str = "medium"