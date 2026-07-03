from config import settings

_BLOCKER_PENALTY = {"critical": 0.20, "high": 0.10, "medium": 0.05}
_MAX_BLOCKER_PENALTY = 0.75

_TIER_SUCCESS = {
    "Ready for AMD": 95,
    "Minor migration": 90,
    "Moderate migration": 80,
    "Major migration": 65,
}
_DIFFICULTY_SUCCESS = {
    "Easy": 95,
    "Low": 90,
    "Medium": 80,
    "High": 65,
}
_BLOCKER_SUCCESS_DELTA = {"critical": 10, "high": 5, "medium": 2}


def _blocker_penalty(blockers: list[dict]) -> float:
    penalty = sum(_BLOCKER_PENALTY.get(b["severity"], 0.05) for b in blockers)
    return min(penalty, _MAX_BLOCKER_PENALTY)


def _estimated_hours(compatibility: dict) -> int:
    migration = compatibility.get("migration") or {}
    hours = migration.get("estimatedHours")
    if hours is not None:
        return int(hours)
    effort = compatibility.get("effort_score", 0)
    if effort <= 20:
        return 4
    if effort <= 40:
        return 12
    if effort <= 70:
        return 24
    return 48


def _migration_difficulty(compatibility: dict) -> str:
    migration = compatibility.get("migration") or {}
    return migration.get("migrationDifficulty") or compatibility.get("tier", "Medium")


def _timeline_weights(findings: dict, compatibility: dict) -> dict[str, float]:
    cuda = findings["cuda"]["summary"]
    docker = findings["docker"]
    components = compatibility.get("components", [])

    unsupported = sum(1 for c in components if c.get("status") == "unsupported")
    unknown = sum(1 for c in components if c.get("status") == "unknown")
    nvidia_packages = len(findings["dependencies"].get("nvidia_packages", []))

    docker_w = (
        0.18
        if docker.get("uses_nvidia_docker")
        else (0.10 if docker.get("dockerfiles_found") else 0.05)
    )
    deps_w = 0.10 + min(unsupported * 0.06 + unknown * 0.03 + nvidia_packages * 0.02, 0.25)
    cuda_w = min(0.05 + cuda["cu_file_count"] * 0.04, 0.40)
    if cuda.get("uses_tensorrt"):
        deps_w += 0.08
    if cuda["cu_file_count"] == 0 and cuda.get("uses_torch_cuda"):
        cuda_w = 0.08
    elif cuda["cu_file_count"] == 0:
        cuda_w = 0.0

    raw = {
        "preparation": 0.15,
        "docker": docker_w,
        "dependencies": deps_w,
        "cuda_kernels": cuda_w,
        "validation": 0.18,
    }
    total = sum(raw.values()) or 1.0
    return {phase: weight / total for phase, weight in raw.items()}


def _build_timeline(hours: int, weights: dict[str, float]) -> dict[str, float]:
    phases = {phase: round(hours * weight, 1) for phase, weight in weights.items()}
    drift = hours - sum(phases.values())
    if drift:
        phases["validation"] = round(phases["validation"] + drift, 1)
    return {**phases, "total": float(hours)}


def compute_success_probability(compatibility: dict, blockers: list[dict]) -> int:
    tier = compatibility.get("tier", "")
    difficulty = _migration_difficulty(compatibility)
    base = _TIER_SUCCESS.get(tier) or _DIFFICULTY_SUCCESS.get(difficulty, 75)

    for blocker in blockers:
        base -= _BLOCKER_SUCCESS_DELTA.get(blocker["severity"], 2)

    return max(5, min(98, base))


def compute_metrics(
    findings: dict,
    compatibility: dict,
    blockers: list[dict],
    *,
    hourly_rate: float | None = None,
) -> dict:
    rate = hourly_rate if hourly_rate is not None else settings.hourly_rate
    compat_score = compatibility.get("score", 0)
    penalty = _blocker_penalty(blockers)
    hours = _estimated_hours(compatibility)
    weights = _timeline_weights(findings, compatibility)

    return {
        "readinessScore": round(compat_score * (1 - penalty)),
        "successProbability": compute_success_probability(compatibility, blockers),
        "developerDays": round(hours / 8, 1),
        "estimatedCost": round(hours * rate, 2),
        "timeline": _build_timeline(hours, weights),
    }
