from typing import Tuple
import re

def migrate_existing_dockerfile(
    dockerfile_text: str,
    findings: dict,
) -> Tuple[str, bool]:
    """
    Deterministically migrate an existing NVIDIA-oriented Dockerfile
    toward AMD ROCm.

    Returns:
        (dockerfile_text, changed)
    """

    migrated = dockerfile_text
    changes: list[str] = []

    # --------------------------------------------------
    # Rule 1
    # NVIDIA CUDA base image -> ROCm PyTorch
    # --------------------------------------------------
    if re.search(r"FROM\s+nvidia/cuda[^\n]*", migrated, re.IGNORECASE):
        migrated = re.sub(
            r"FROM\s+nvidia/cuda[^\n]*",
            "FROM rocm/pytorch:latest",
            migrated,
            flags=re.IGNORECASE,
        )
        changes.append("Replaced NVIDIA CUDA base image with ROCm PyTorch image.")

    # --------------------------------------------------
    # Rule 2
    # Remove CUDA_VISIBLE_DEVICES
    # --------------------------------------------------
    if "CUDA_VISIBLE_DEVICES" in migrated:
        lines = []
        for line in migrated.splitlines():
            if "CUDA_VISIBLE_DEVICES" in line:
                lines.append("# AMD Port Studio: Removed CUDA_VISIBLE_DEVICES (ROCm)")
            else:
                lines.append(line)
        migrated = "\n".join(lines)
        changes.append("Removed CUDA_VISIBLE_DEVICES.")

    # --------------------------------------------------
    # Rule 3
    # NVIDIA docker runtime
    # --------------------------------------------------
    if "--gpus all" in migrated:
        migrated = migrated.replace(
            "--gpus all",
            "# AMD Port Studio: ROCm uses /dev/kfd and /dev/dri",
        )
        changes.append("Replaced NVIDIA GPU runtime instructions.")

    # --------------------------------------------------
    # Rule 4
    # PyTorch ROCm wheels
    # --------------------------------------------------
    if (
        "pip install torch" in migrated
        and "download.pytorch.org/whl/rocm" not in migrated
    ):
        migrated = migrated.replace(
            "pip install torch",
            "pip install torch torchvision "
            "--index-url https://download.pytorch.org/whl/rocm6.2",
        )
        changes.append("Updated PyTorch installation to ROCm wheels.")

    # --------------------------------------------------
    # Rule 5
    # TensorRT warning
    # --------------------------------------------------
    has_tensorrt = any(
    pkg["name"] == "tensorrt"
    for pkg in findings["dependencies"].get(
        "nvidia_packages",
        [],
    ))
    if has_tensorrt:
        migrated = (
            "# AMD Port Studio:\n"
            "# TensorRT is not supported on ROCm.\n\n"
            + migrated
        )
        changes.append("Detected TensorRT dependency.")

    # --------------------------------------------------
    # Nothing changed
    # --------------------------------------------------
    if not changes:
        return dockerfile_text, False

    # --------------------------------------------------
    # Build migration header
    # --------------------------------------------------
    header = [
        "# ==========================================================",
        "# AMD Port Studio",
        "# Docker Migration Report",
        "#",
        "# Mode: Existing NVIDIA Dockerfile Migration",
        "#",
        "# Changes:",
    ]
    for change in changes:
        header.append(f"#  ✓ {change}")
    header.extend([
        "# ==========================================================",
        "",
    ])

    migrated = "\n".join(header) + migrated
    return migrated, True
