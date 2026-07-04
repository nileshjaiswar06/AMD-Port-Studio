from ai.schema import AIAdvisorOutput


class MockProvider:
    def advise(self, context: str) -> AIAdvisorOutput:
        return AIAdvisorOutput(
            executiveSummary=(
                "Mock AI advisor response. Set GEMINI_API_KEY and AI_PROVIDER=gemini for real narrative."
            ),
            migrationComplexity="Medium",
            estimatedHours=12,
            riskLevel="Moderate",
            keyBlockers=["Configure Gemini API key"],
            recommendedAlternatives=["ROCm-enabled PyTorch"],
            migrationSteps=[
                "Install ROCm drivers",
                "Switch to ROCm PyTorch build",
                "Validate workload on AMD hardware",
            ],
            amdDeploymentNotes="Use rocm/pytorch base image and validate with rocm-smi.",
            confidence="low",
        )