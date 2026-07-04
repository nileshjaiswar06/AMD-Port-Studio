def score_to_tier(score: int) -> str:
    if score >= 90:
        return "Ready for AMD"
    if score >= 70:
        return "Minor migration"
    if score >= 40:
        return "Moderate migration"
    return "Major migration"


STATUS_WEIGHT = {
    "supported": 1.0,
    "partial": 0.5,
    "unsupported": 0.0,
    "unknown": 0.25,
}


def compute_compatibility_score(components: list[dict]) -> int:
    if not components:
        return 100
    total = sum(STATUS_WEIGHT.get(c["status"], 0.25) for c in components)
    return round((total / len(components)) * 100)


def effort_to_difficulty(effort_score: int) -> str:
    if effort_score <= 20:
        return "Easy"
    if effort_score <= 40:
        return "Low"
    if effort_score <= 70:
        return "Medium"
    return "High"


def effort_to_risk(effort_score: int, unsupported_count: int) -> str:
    if unsupported_count >= 3 or effort_score >= 71:
        return "High"
    if effort_score >= 41 or unsupported_count >= 1:
        return "Moderate"
    return "Low"


def effort_to_hours(effort_score: int, cu_file_count: int) -> int:
    base = {
        range(0, 21): 4,
        range(21, 41): 12,
        range(41, 71): 24,
        range(71, 101): 48,
    }
    hours = 8
    for band, value in base.items():
        if effort_score in band:
            hours = value
            break
    # custom CUDA kernels add significant manual work
    if cu_file_count > 50:
        hours += 40
    elif cu_file_count > 10:
        hours += 16
    elif cu_file_count > 0:
        hours += 8
    return hours


def compute_migration_effort(findings: dict, components: list[dict]) -> int:
    cuda = findings["cuda"]["summary"]
    docker = findings["docker"]

    effort = 0
    effort += min(cuda["api_hit_count"] * 2, 25)
    effort += min(cuda["cu_file_count"], 35)

    if cuda["uses_tensorrt"]:
        effort += 20
    if cuda["uses_cupy"]:
        effort += 15
    if docker["uses_nvidia_docker"]:
        effort += 10

    unsupported = sum(1 for c in components if c["status"] == "unsupported")
    effort += unsupported * 8

    return min(effort, 100)