def build_advisor_context(
    repo_name: str,
    repo_url: str,
    findings: dict,
    compatibility: dict,
    deterministic_analysis: dict,
) -> str:
    deps = findings["dependencies"]
    cuda = findings["cuda"]["summary"]
    docker = findings["docker"]
    components = findings["compatibility"]["components"]

    component_lines = []
    for c in components[:15]:
        label = c.get("name") or c.get("label") or c["id"]
        component_lines.append(
            f"- {label}: {c['status']} | alternative: {c.get('alternative', 'n/a')}"
        )

    return f"""
Repository: {repo_name.replace("_", "/")}
URL: {repo_url}

Deterministic analysis (DO NOT contradict these facts):
- Compatibility score: {compatibility['score']}% ({compatibility['tier']})
- Effort score: {compatibility['effort_score']}/100
- Migration difficulty: {deterministic_analysis['migrationDifficulty']}
- Estimated hours: {deterministic_analysis['estimatedHours']}
- Risk: {deterministic_analysis['riskLevel']}

Frameworks: {", ".join(deps.get("frameworks", [])) or "none"}
NVIDIA packages: {", ".join(p["name"] for p in deps.get("nvidia_packages", [])) or "none"}
CUDA API hits: {cuda['api_hit_count']}
Custom CUDA source files (.cu): {cuda['cu_file_count']}
Uses torch.cuda: {cuda['uses_torch_cuda']}
Uses TensorRT: {cuda['uses_tensorrt']}
NVIDIA Docker detected: {docker['uses_nvidia_docker']}
Dockerfiles found: {len(docker.get('dockerfiles_found', []))}

Compatibility components:
{chr(10).join(component_lines)}

Unsupported: {", ".join(deterministic_analysis.get("unsupportedLibraries", [])) or "none"}
""".strip()