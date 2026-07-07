import difflib

HIGH = "High"
MEDIUM = "Medium"
LOW = "Low"

EASY = "Easy"
MODERATE = "Moderate"
HARD = "Hard"

def build_diff(before: str, after: str) -> str:
    """
    Generate a unified diff preview between the original
    and suggested migration code.
    """
    return "\n".join(
        difflib.unified_diff(
            before.splitlines(),
            after.splitlines(),
            fromfile="before",
            tofile="after",
            lineterm="",
        )
    )


def create_patch(
    *,
    patch_id: str,
    title: str,
    patch_type: str,
    before: str,
    after: str,
    reason: str,
    confidence: str = HIGH,
    difficulty: str = EASY,
    files: list[str] | None = None,
    references: list[str] | None = None,
) -> dict:

    return {
        "id": patch_id,
        "title": title,
        "type": patch_type,
        "reason": reason,
        "confidence": confidence,
        "difficulty": difficulty,
        "before": before,
        "after": after,
        "diff": build_diff(before, after),
        "files": files or [],
        "references": references or [],
    }


def generate_patch_suggestions(analysis: dict) -> list[dict]:
    patches: list[dict] = []

    findings = analysis.get("findings", {})
    docker = findings.get("docker", {})
    cuda = findings.get("cuda", {})
    summary = cuda.get("summary", {})

    # --------------------------------------------------
    # Docker
    # --------------------------------------------------

    if docker.get("uses_nvidia_docker"):
        patches.append(
            create_patch(
                patch_id="docker-base",
                title="Replace NVIDIA Docker base image",
                patch_type="docker",
                before="FROM nvidia/cuda:12.4-runtime",
                after="FROM rocm/pytorch:latest",
                reason="NVIDIA CUDA images cannot run ROCm workloads. Use the official ROCm PyTorch image instead.",
                files=["Dockerfile"],
                references=[
                    "https://rocm.docs.amd.com/",
                ],
            )
        )

    # --------------------------------------------------
    # CUDA API
    # --------------------------------------------------

    if summary.get("api_hit_count", 0):
        patches.append(
            create_patch(
                patch_id="cuda-api",
                title="CUDA API migration",
                patch_type="code",
                before="cudaMalloc(...)",
                after="hipMalloc(...)",
                reason="HIP provides a compatible memory allocation API for AMD GPUs.",
                files=["*.cu", "*.cpp"],
                references=[
                    "https://rocm.docs.amd.com/projects/HIP/en/latest/",
                ],
            )
        )

    # --------------------------------------------------
    # TensorRT
    # --------------------------------------------------

    packages = findings.get("dependencies", {}).get("nvidia_packages", [])

    package_names = []

    for pkg in packages:
        if isinstance(pkg, dict):
            package_names.append(pkg.get("name", "").lower())
        else:
            package_names.append(str(pkg).lower())

    if "tensorrt" in package_names:
        patches.append(
            create_patch(
                patch_id="tensorrt",
                title="TensorRT replacement",
                patch_type="dependency",
                before="tensorrt",
                after="ONNX Runtime ROCm",
                reason="TensorRT is NVIDIA-specific. ONNX Runtime ROCm is the recommended AMD alternative.",
                files=["requirements.txt", "pyproject.toml"],
                references=[
                    "https://onnxruntime.ai/",
                ],
            )
        )

    return patches