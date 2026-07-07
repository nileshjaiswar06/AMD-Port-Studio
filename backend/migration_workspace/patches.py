def generate_patch_suggestions(analysis: dict) -> list[dict]:
    patches = []
    findings = analysis.get("findings", {})
    docker = findings.get("docker", {})
    cuda = findings.get("cuda", {})

    if docker.get("uses_nvidia_docker"):
        patches.append(
            {
                "id": "docker-base",
                "title": "Replace NVIDIA Docker base image",
                "type": "docker",
                "before": "FROM nvidia/cuda:12.4-runtime",
                "after": "FROM rocm/pytorch:latest",
            }
        )

    if cuda.get("api_hit_count", 0):
        patches.append(
            {
                "id": "cuda-api",
                "title": "CUDA API migration",
                "type": "code",
                "before": "cudaMalloc(...)",
                "after": "hipMalloc(...)",
            }
        )

    packages = findings.get("dependencies", {}).get("nvidia_packages", [])

    if "tensorrt" in packages:
        patches.append(
            {
                "id": "tensorrt",
                "title": "TensorRT replacement",
                "type": "dependency",
                "before": "tensorrt",
                "after": "ONNX Runtime ROCm",
            }
        )
    return patches