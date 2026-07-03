import os
import re
from pathlib import Path

NVIDIA_IMAGE_PATTERNS = [
    r"nvidia/cuda",
    r"nvcr\.io/nvidia",
    r"cuda:\d",
    r"nvidia/pytorch",
    r"nvidia/tensorflow",
]

RUNTIME_PATTERNS = [
    r"nvidia-container-runtime",
    r"nvidia-docker",
    r"--gpus",
    r"NVIDIA_VISIBLE_DEVICES",
    r"CUDA_VISIBLE_DEVICES",
]


def analyze_docker_files(repo_path: Path) -> dict:
    findings: list[dict] = []
    dockerfiles: list[str] = []

    for root, dirs, filenames in os.walk(repo_path):
        dirs[:] = [d for d in dirs if d not in {".git", "node_modules", "venv", ".venv", "__pycache__"}]
        for name in filenames:
            lower = name.lower()
            if lower == "dockerfile" or lower.endswith(".dockerfile") or lower == "docker-compose.yml" or lower == "docker-compose.yaml":
                full = Path(root) / name
                rel = str(full.relative_to(repo_path)).replace("\\", "/")
                dockerfiles.append(rel)
                try:
                    text = full.read_text(encoding="utf-8", errors="ignore")
                except OSError:
                    continue

                for i, line in enumerate(text.splitlines(), 1):
                    lower_line = line.lower()
                    for pattern in NVIDIA_IMAGE_PATTERNS:
                        if re.search(pattern, lower_line):
                            findings.append({
                                "file": rel,
                                "line": i,
                                "kind": "nvidia_base_image",
                                "detail": line.strip(),
                                "severity": "high",
                            })
                    for pattern in RUNTIME_PATTERNS:
                        if re.search(pattern, lower_line, re.IGNORECASE):
                            findings.append({
                                "file": rel,
                                "line": i,
                                "kind": "nvidia_runtime",
                                "detail": line.strip(),
                                "severity": "medium",
                            })

    return {
        "dockerfiles_found": sorted(set(dockerfiles)),
        "findings": findings,
        "uses_nvidia_docker": len(findings) > 0,
    }