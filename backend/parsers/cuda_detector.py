import os
from pathlib import Path

from parsers.cuda_ast import analyze_python_file


def find_cuda_source_files(repo_path: Path) -> list[dict]:
    cu_files: list[dict] = []
    for root, dirs, filenames in os.walk(repo_path):
        dirs[:] = [d for d in dirs if d not in {".git", "node_modules", "venv", ".venv", "__pycache__"}]
        for name in filenames:
            if name.endswith((".cu", ".cuh")):
                full = Path(root) / name
                rel = str(full.relative_to(repo_path)).replace("\\", "/")
                cu_files.append({
                    "file": rel,
                    "kind": "cuda_source",
                    "line": None,
                    "symbol": Path(name).suffix,
                    "snippet": "CUDA kernel / device source file",
                    "confidence": "high",
                })
    return cu_files


def detect_cuda(repo_path: Path, indexed_files: list[dict] | None = None) -> dict:
    api_hits: list[dict] = []

    python_paths: list[Path] = []
    if indexed_files:
        for f in indexed_files:
            if f.get("language") == "python":
                python_paths.append(repo_path / f["path"])
    else:
        for root, dirs, filenames in os.walk(repo_path):
            dirs[:] = [d for d in dirs if d not in {".git", "node_modules", "venv", ".venv", "__pycache__"}]
            for name in filenames:
                if name.endswith(".py"):
                    python_paths.append(Path(root) / name)

    for py_file in python_paths:
        api_hits.extend(analyze_python_file(repo_path, py_file))

    cu_files = find_cuda_source_files(repo_path)

    symbols = {h["symbol"] for h in api_hits}
    summary = {
        "api_hit_count": len(api_hits),
        "cu_file_count": len(cu_files),
        "python_files_scanned": len(python_paths),
        "uses_torch_cuda": any("torch.cuda" in s or s.endswith(".cuda") for s in symbols),
        "uses_tensorrt": any("tensorrt" in s for s in symbols),
        "uses_cupy": any("cupy" in s for s in symbols),
        "has_cuda_source": len(cu_files) > 0,
    }

    return {
        "summary": summary,
        "api_hits": api_hits[:100],
        "cu_files": cu_files[:100],
    }