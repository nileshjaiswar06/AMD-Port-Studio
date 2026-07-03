_PRIORITY_RANK = {"critical": 0, "high": 1, "medium": 2, "low": 3}


def _component_priority(component: dict) -> str | None:
    status = component.get("status")
    difficulty = (component.get("difficulty") or "medium").lower()

    if status == "unsupported":
        return "critical" if difficulty == "high" else "high"
    if status == "unknown":
        return "medium"
    if status == "partial":
        return {"high": "high", "medium": "medium", "low": "low"}.get(difficulty, "medium")
    return None


def _component_action(component: dict) -> str:
    label = component.get("name") or component.get("label") or component["id"]
    alternative = component.get("alternative")
    if alternative:
        return f"Address {label}: {alternative}"
    return f"Review and migrate {label} for ROCm compatibility"


def build_recommendations(
    findings: dict,
    compatibility: dict,
    blockers: list[dict],
) -> list[dict]:
    recommendations: list[dict] = []
    seen_titles: set[str] = set()

    for component in compatibility.get("components", []):
        priority = _component_priority(component)
        if priority is None:
            continue
        label = component.get("name") or component.get("label") or component["id"]
        if label in seen_titles:
            continue
        seen_titles.add(label)
        recommendations.append(
            {
                "priority": priority,
                "action": _component_action(component),
                "rationale": component.get("notes") or f"Rules engine status: {component['status']}.",
            }
        )

    for blocker in blockers:
        if blocker["title"] in seen_titles:
            continue
        seen_titles.add(blocker["title"])
        recommendations.append(
            {
                "priority": blocker["severity"],
                "action": blocker["title"],
                "rationale": blocker["detail"],
            }
        )

    recommendations.sort(
        key=lambda r: (_PRIORITY_RANK.get(r["priority"], 9), r["action"])
    )
    return recommendations
