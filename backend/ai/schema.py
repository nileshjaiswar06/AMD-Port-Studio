from pydantic import BaseModel, Field


class AIAdvisorOutput(BaseModel):
    executiveSummary: str = Field(min_length=20)
    migrationComplexity: str  # Easy | Low | Medium | High
    estimatedHours: int = Field(ge=1, le=500)
    riskLevel: str  # Low | Moderate | High
    keyBlockers: list[str] = Field(default_factory=list)
    recommendedAlternatives: list[str] = Field(default_factory=list)
    migrationSteps: list[str] = Field(min_length=1)
    amdDeploymentNotes: str = Field(min_length=10)
    confidence: str = "medium"  # low | medium | high