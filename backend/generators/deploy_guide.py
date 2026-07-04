def generate_deploy_guide(findings: dict, repo_name: str) -> list[str]:
    cuda = findings["cuda"]["summary"]
    docker = findings["docker"]

    steps = [
        "Install ROCm drivers on the host (https://rocm.docs.amd.com/)",
        "Verify GPU: rocm-smi",
        "Install Docker and add user to render/video groups if needed",
    ]

    if docker.get("dockerfiles_found"):
        names = ", ".join(docker["dockerfiles_found"][:3])
        steps.append(f"Review existing Dockerfiles ({names}) and replace NVIDIA base images")

    if docker["uses_nvidia_docker"]:
        steps.append("Replace nvidia/cuda images with rocm/pytorch or rocm/dev")

    if cuda["uses_torch_cuda"]:
        steps.append("Install ROCm-enabled PyTorch and run a smoke test with torch.cuda.is_available()")

    if cuda["cu_file_count"] > 0:
        steps.append(
            f"Plan HIP port for {cuda['cu_file_count']} CUDA source files — manual engineering required"
        )

    steps.extend([
        "Build: docker build -f Dockerfile.rocm -t app-rocm .",
        "Run: docker run --device=/dev/kfd --device=/dev/dri --group-add video app-rocm",
        "Benchmark inference/training workload on AMD hardware",
        "Compare results against NVIDIA baseline",
    ])
    return steps