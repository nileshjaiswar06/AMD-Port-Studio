_SEVERITY_RANK = {"critical": 0, "high": 1, "medium": 2}


def build_blockers(findings: dict, compatibility: dict) -> list[dict]:
    blockers: list[dict] = []
    seen: set[tuple[str, str]] = set()

    def add(severity: str, title: str, detail: str, source: str) -> None:
        key = (source, title)
        if key in seen:
            return
        seen.add(key)
        blockers.append(
            {"severity": severity, "title": title, "detail": detail, "source": source}
        )

    cuda = findings["cuda"]["summary"]
    docker = findings["docker"]
    components = compatibility.get("components", [])

    covered_component_ids: set[str] = set()

    if cuda["cu_file_count"] > 0:
        add(
            "critical",
            "Custom CUDA kernel source files",
            (
                f"{cuda['cu_file_count']} .cu file(s) detected; "
                "manual HIP porting is required before ROCm deployment."
            ),
            "cuda.summary.cu_file_count",
        )
        covered_component_ids.add("cuda_source_files")

    if cuda["uses_tensorrt"]:
        add(
            "high",
            "TensorRT inference stack",
            "TensorRT is NVIDIA-only; replace with ONNX Runtime ROCm or MIGraphX.",
            "cuda.summary.uses_tensorrt",
        )
        covered_component_ids.add("tensorrt_usage")

    for component in components:
        if component.get("status") != "unknown":
            continue
        label = component.get("name") or component.get("label") or component["id"]
        add(
            "medium",
            f"Unknown ROCm compatibility: {label}",
            component.get("notes") or "No ROCm rule defined; manual verification required.",
            "compatibility.components.unknown",
        )

    if docker["uses_nvidia_docker"]:
        add(
            "medium",
            "NVIDIA Docker base image or runtime",
            "Replace NVIDIA container base images and GPU runtime flags with ROCm equivalents.",
            "docker.uses_nvidia_docker",
        )
        covered_component_ids.add("nvidia_docker")

    for component in components:
        if component.get("status") != "unsupported":
            continue
        if component.get("id") in covered_component_ids:
            continue
        label = component.get("name") or component.get("label") or component["id"]
        add(
            "high",
            f"Unsupported library: {label}",
            component.get("notes") or f"{label} has no supported ROCm path in the rules engine.",
            "compatibility.unsupportedLibraries",
        )

    blockers.sort(key=lambda b: (_SEVERITY_RANK.get(b["severity"], 9), b["title"]))
    return blockers
