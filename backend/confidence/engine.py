from __future__ import annotations

from typing import Any


def _confidence(score: int, reason: str) -> dict[str, Any]:
    if score >= 90:
        value = "high"
    elif score >= 70:
        value = "medium"
    else:
        value = "low"

    return {
        "value": value,
        "score": score,
        "reason": reason,
    }


def build_confidence(
    findings: dict[str, Any],
    compatibility: dict[str, Any],
    recommendations: list[dict] | None = None,
    ai_used: bool = False,
) -> dict[str, Any]:

    recommendations = recommendations or []

    cuda_summary = findings.get("cuda", {}).get("summary", {})
    dependency_data = findings.get("dependencies", {})
    docker = findings.get("docker", {})

    compatibility_components = compatibility.get("components", [])

    cuda_hits = cuda_summary.get("api_hit_count", 0)
    package_count = dependency_data.get("package_count", 0)
    docker_found = len(docker.get("dockerfiles_found", []))
    component_count = len(compatibility_components)

    cuda_score = 98 if cuda_hits > 0 else 75

    dependency_score = (
        min(100, 70 + package_count)
        if package_count
        else 70
    )

    docker_score = (
        92
        if docker_found
        else 70
    )

    compatibility_score = (
        95
        if component_count
        else 75
    )

    recommendation_score = (
        95
        if recommendations
        else 70
    )

    ai_score = (
        95
        if ai_used
        else 75
    )

    overall_score = round(
        (
            cuda_score
            + dependency_score
            + docker_score
            + compatibility_score
            + recommendation_score
            + ai_score
        )
        / 6
    )

    return {
        "cuda": _confidence(
            cuda_score,
            f"{cuda_hits} CUDA API usages detected.",
        ),

        "dependencies": _confidence(
            dependency_score,
            f"{package_count} dependency packages analysed.",
        ),

        "docker": _confidence(
            docker_score,
            "Docker configuration successfully inspected."
            if docker_found
            else "No Dockerfile detected.",
        ),

        "compatibility": _confidence(
            compatibility_score,
            f"{component_count} compatibility rules evaluated.",
        ),

        "recommendations": _confidence(
            recommendation_score,
            f"{len(recommendations)} migration recommendations generated.",
        ),

        "ai_summary": _confidence(
            ai_score,
            "AI planner generated migration guidance."
            if ai_used
            else "Deterministic rule engine used.",
        ),

        "overall": _confidence(
            overall_score,
            "Combined confidence across all analysis stages.",
        ),
    }