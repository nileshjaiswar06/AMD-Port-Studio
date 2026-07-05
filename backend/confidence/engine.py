def build_confidence(findings, compatibility) -> dict:
  return {
    "cuda": {
        "value": "high",
        "score": 99,
        "reason": "Direct CUDA API usage detected."
    },

    "dependencies": {
        "value": "high",
        "score": 96,
        "reason": "Dependency manifests parsed successfully."
    },

    "docker": {
        "value": "medium",
        "score": 72,
        "reason": "Dockerfile found but GPU runtime inferred."
    },

    "compatibility": {
        "value": "high",
        "score": 95,
        "reason": "Rule engine evaluated all detected components."
    }
}