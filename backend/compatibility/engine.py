import json
from pathlib import Path

from compatibility.scoring import (
    compute_compatibility_score,
    compute_migration_effort,
    effort_to_difficulty,
    effort_to_hours,
    effort_to_risk,
    score_to_tier,
)

RULES_PATH = Path(__file__).resolve().parent.parent / "rules" / "rocm_rules.json"

_STATUS_RANK = {"supported": 0, "partial": 1, "unknown": 2, "unsupported": 3}


def load_rules() -> dict:
    with RULES_PATH.open(encoding="utf-8") as f:
        return json.load(f)


def _lookup_package(rules: dict, name: str) -> dict:
    pkg_rules = rules.get("packages", {})
    entry = pkg_rules.get(name)
    if entry:
        return {**entry, "id": name, "type": "package"}
    return {
        "id": name,
        "type": "package",
        "status": "unknown",
        "label": name,
        "alternative": "Manual verification required",
        "difficulty": "medium",
        "notes": "No ROCm rule defined yet for this package.",
    }


def _signal_component(rules: dict, signal_id: str, triggered: bool) -> dict | None:
    if not triggered:
        return None
    sig = rules.get("signals", {}).get(signal_id, {})
    return {
        "id": signal_id,
        "type": "signal",
        "status": sig.get("status", "partial"),
        "label": sig.get("label", signal_id),
        "alternative": sig.get("alternative", ""),
        "difficulty": sig.get("difficulty", "medium"),
        "notes": sig.get("notes", ""),
    }


def build_components(findings: dict, rules: dict) -> list[dict]:
    components: list[dict] = []

    # Packages — only AI-relevant / nvidia-related ones
    deps = findings["dependencies"]
    checked: set[str] = set()
    for pkg in deps.get("nvidia_packages", []) + deps.get("packages", []):
        name = pkg["name"]
        if name in checked:
            continue
        if pkg.get("category") not in {"nvidia", "ai_framework"} and name not in rules.get("packages", {}):
            continue
        checked.add(name)
        rule = _lookup_package(rules, name)
        components.append({
            "id": rule["id"],
            "type": "package",
            "name": rule.get("label", name),
            "status": rule["status"],
            "alternative": rule.get("alternative", ""),
            "difficulty": rule.get("difficulty", "medium"),
            "notes": rule.get("notes", ""),
            "manifest": pkg.get("manifest"),
        })

    cuda = findings["cuda"]["summary"]
    for signal_id, triggered in [
        ("torch_cuda_api", cuda["uses_torch_cuda"]),
        ("cuda_source_files", cuda["has_cuda_source"]),
        ("nvidia_docker", findings["docker"]["uses_nvidia_docker"]),
        ("cupy_usage", cuda["uses_cupy"]),
        ("tensorrt_usage", cuda["uses_tensorrt"]),
    ]:
        comp = _signal_component(rules, signal_id, triggered)
        if comp:
            components.append(comp)

    if not components:
        components.append({
            "id": "no_gpu_stack",
            "type": "info",
            "name": "No major GPU stack detected",
            "status": "supported",
            "alternative": "Standard ROCm setup",
            "difficulty": "low",
            "notes": "No NVIDIA-specific packages or CUDA signals found in scan.",
        })

    components.sort(key=lambda c: _STATUS_RANK.get(c["status"], 2))
    return components


def build_migration_steps(components: list[dict], findings: dict) -> list[str]:
    steps: list[str] = [
        "Install ROCm drivers and validate GPU with rocm-smi",
        "Replace NVIDIA Docker base images with ROCm-compatible images",
    ]

    unsupported = [c for c in components if c["status"] == "unsupported"]
    partial = [c for c in components if c["status"] == "partial"]

    if any(c["id"] == "torch_cuda_api" for c in partial + unsupported):
        steps.append("Migrate PyTorch code to ROCm-enabled build and validate device APIs")
    if any(c["id"] == "cuda_source_files" for c in components):
        steps.append(
            f"Plan manual port of {findings['cuda']['summary']['cu_file_count']} CUDA source file(s) to HIP/ROCm"
        )
    if any(c["id"] == "tensorrt_usage" for c in components):
        steps.append("Replace TensorRT inference path with ONNX Runtime ROCm or MIGraphX")
    if findings["docker"]["uses_nvidia_docker"]:
        steps.append("Update Docker runtime and GPU access flags for AMD containers")

    steps.append("Run workload benchmarks on AMD hardware and compare results")
    return steps


def evaluate_compatibility(findings: dict) -> dict:
    rules = load_rules()
    components = build_components(findings, rules)

    score = compute_compatibility_score(components)
    effort_score = compute_migration_effort(findings, components)
    tier = score_to_tier(score)
    difficulty = effort_to_difficulty(effort_score)
    cu_count = findings["cuda"]["summary"]["cu_file_count"]
    hours = effort_to_hours(effort_score, cu_count)

    unsupported = [c for c in components if c["status"] == "unsupported"]
    alternatives = sorted({
        c["alternative"] for c in components
        if c.get("alternative") and c["status"] in {"unsupported", "partial"}
    })

    return {
        "score": score,
        "tier": tier,
        "effort_score": effort_score,
        "components": components,
        "unsupported_count": len(unsupported),
        "migration": {
            "migrationDifficulty": difficulty,
            "estimatedHours": hours,
            "riskLevel": effort_to_risk(effort_score, len(unsupported)),
            "compatibilityScore": score,
            "unsupportedLibraries": [
                c.get("name") or c.get("label") or c["id"] for c in unsupported
            ],
            "recommendedAlternatives": alternatives[:6],
            "migrationSteps": build_migration_steps(components, findings),
        },
    }


def build_deterministic_summary(repo_name: str, compatibility: dict, findings: dict) -> str:
    cuda = findings["cuda"]["summary"]
    return (
        f"ROCm compatibility analysis for {repo_name.replace('_', '/')}: "
        f"{compatibility['score']}% ({compatibility['tier']}). "
        f"Found {cuda['api_hit_count']} CUDA API hits and {cuda['cu_file_count']} custom CUDA source files. "
        f"Estimated migration effort: {compatibility['migration']['estimatedHours']} hours "
        f"({compatibility['migration']['migrationDifficulty']} difficulty). "
        f"AI narrative advisor arrives on Day 5."
    )