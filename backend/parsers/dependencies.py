import os
import re
from pathlib import Path

import yaml

MANIFEST_NAMES = {
    "requirements.txt",
    "requirements-dev.txt",
    "requirements-prod.txt",
    "pyproject.toml",
    "environment.yml",
    "environment.yaml",
    "setup.py",
    "setup.cfg",
    "Pipfile",
}

# package name -> category for UI
NVIDIA_PACKAGES = {
    "tensorrt", "nvidia-cublas-cu12", "nvidia-cuda-runtime-cu12",
    "nvidia-cudnn-cu12", "nvidia-nccl-cu12", "cupy-cuda12x", "pycuda",
}
AI_FRAMEWORK_PACKAGES = {
    "torch", "pytorch", "tensorflow", "transformers", "onnxruntime",
    "onnxruntime-gpu", "triton", "accelerate", "bitsandbytes",
}


def _normalize_name(raw: str) -> str:
    name = raw.strip().lower()
    name = re.split(r"[<>=!~\[\];]", name)[0].strip()
    return name.replace("_", "-")


def parse_requirements_line(line: str) -> str | None:
    line = line.split("#", 1)[0].strip()
    if not line or line.startswith("-"):
        return None
  # skip -r includes for Day 3
    if line.startswith("-r ") or line.startswith("--"):
        return None
    name = _normalize_name(line)
    return name or None


def parse_requirements_file(path: Path) -> list[dict]:
    packages: list[dict] = []
    for i, line in enumerate(path.read_text(encoding="utf-8", errors="ignore").splitlines(), 1):
        name = parse_requirements_line(line)
        if name:
            packages.append({"name": name, "source": str(path.name), "line": i})
    return packages


def parse_pyproject_file(path: Path) -> list[dict]:
    import tomllib

    packages: list[dict] = []
    data = tomllib.loads(path.read_text(encoding="utf-8", errors="ignore"))

    deps: list[str] = []
    project = data.get("project", {})
    deps.extend(project.get("dependencies", []))

    optional = project.get("optional-dependencies", {})
    for group_deps in optional.values():
        deps.extend(group_deps)

    poetry = data.get("tool", {}).get("poetry", {})
    deps.extend(poetry.get("dependencies", {}).keys())

    for raw in deps:
        if isinstance(raw, str):
            name = _normalize_name(raw)
            if name:
                packages.append({"name": name, "source": "pyproject.toml", "line": None})

    return packages


def parse_environment_yml(path: Path) -> list[dict]:
    packages: list[dict] = []
    data = yaml.safe_load(path.read_text(encoding="utf-8", errors="ignore"))
    if not isinstance(data, dict):
        return packages

    for section in ("dependencies", "pip"):
        items = data.get(section, [])
        if not isinstance(items, list):
            continue
        for item in items:
            if isinstance(item, str):
                name = _normalize_name(item)
                if name:
                    packages.append({"name": name, "source": path.name, "line": None})
    return packages


def parse_setup_py(path: Path) -> list[dict]:
    text = path.read_text(encoding="utf-8", errors="ignore")
    packages: list[dict] = []
    match = re.search(r"install_requires\s*=\s*\[(.*?)\]", text, re.DOTALL)
    if not match:
        return packages
    for raw in re.findall(r"['\"]([^'\"]+)['\"]", match.group(1)):
        name = _normalize_name(raw)
        if name:
            packages.append({"name": name, "source": "setup.py", "line": None})
    return packages


def parse_dockerfile_deps(path: Path) -> list[dict]:
    packages: list[dict] = []
    for i, line in enumerate(path.read_text(encoding="utf-8", errors="ignore").splitlines(), 1):
        lower = line.lower()
        if "pip install" in lower or "conda install" in lower:
            for token in re.findall(r"[\w.-]+", line):
                if token.lower() in AI_FRAMEWORK_PACKAGES or token.lower() in NVIDIA_PACKAGES:
                    packages.append({"name": token.lower(), "source": path.name, "line": i})
    return packages


def categorize_package(name: str) -> str:
    if name in NVIDIA_PACKAGES or name.startswith("nvidia-"):
        return "nvidia"
    if name in AI_FRAMEWORK_PACKAGES:
        return "ai_framework"
    if name in {"cuda", "cudnn", "nccl"}:
        return "nvidia"
    return "general"


def extract_dependencies(repo_path: Path) -> dict:
    all_packages: list[dict] = []
    manifests_found: list[str] = []

    for root, dirs, filenames in os.walk(repo_path):
        dirs[:] = [d for d in dirs if d not in {".git", "node_modules", "venv", ".venv", "__pycache__"}]
        for filename in filenames:
            lower = filename.lower()
            full = Path(root) / filename
            rel = str(full.relative_to(repo_path)).replace("\\", "/")

            try:
                if lower in {"requirements.txt", "requirements-dev.txt", "requirements-prod.txt"}:
                    manifests_found.append(rel)
                    for pkg in parse_requirements_file(full):
                        pkg["manifest"] = rel
                        all_packages.append(pkg)
                elif lower == "pyproject.toml":
                    manifests_found.append(rel)
                    for pkg in parse_pyproject_file(full):
                        pkg["manifest"] = rel
                        all_packages.append(pkg)
                elif lower in {"environment.yml", "environment.yaml"}:
                    manifests_found.append(rel)
                    for pkg in parse_environment_yml(full):
                        pkg["manifest"] = rel
                        all_packages.append(pkg)
                elif lower == "setup.py":
                    manifests_found.append(rel)
                    for pkg in parse_setup_py(full):
                        pkg["manifest"] = rel
                        all_packages.append(pkg)
                elif lower == "dockerfile" or lower.endswith("dockerfile"):
                    for pkg in parse_dockerfile_deps(full):
                        pkg["manifest"] = rel
                        all_packages.append(pkg)
            except OSError:
                continue

    # dedupe by name, keep first source
    seen: set[str] = set()
    unique: list[dict] = []
    for pkg in all_packages:
        if pkg["name"] in seen:
            continue
        seen.add(pkg["name"])
        pkg["category"] = categorize_package(pkg["name"])
        unique.append(pkg)

    frameworks = sorted({
        p["name"] for p in unique
        if p["category"] == "ai_framework" or p["name"] in {"torch", "tensorflow", "transformers"}
    })

    nvidia_packages = [p for p in unique if p["category"] == "nvidia" or p["name"] == "tensorrt"]

    return {
        "manifests_found": sorted(set(manifests_found)),
        "packages": unique,
        "frameworks": frameworks,
        "nvidia_packages": nvidia_packages,
        "package_count": len(unique),
    }