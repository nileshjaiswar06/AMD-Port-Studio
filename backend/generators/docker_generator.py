def generate_rocm_dockerfile(findings: dict, repo_name: str) -> str:
    deps = findings["dependencies"]
    frameworks = deps.get("frameworks", [])
    uses_torch = "torch" in frameworks or findings["cuda"]["summary"]["uses_torch_cuda"]
    cu_count = findings["cuda"]["summary"]["cu_file_count"]

    pip_install = "torch torchvision --index-url https://download.pytorch.org/whl/rocm6.2" if uses_torch else ""

    return f"""# AMD Port Studio — generated ROCm Dockerfile
# Repository: {repo_name.replace("_", "/")}
# Custom CUDA files detected: {cu_count}

FROM rocm/pytorch:latest

WORKDIR /app

ENV HSA_OVERRIDE_GFX_VERSION=10.3.0
ENV PYTORCH_ROCM_ARCH=gfx1030

COPY requirements.txt* pyproject.toml* ./

RUN pip install --no-cache-dir -r requirements.txt 2>/dev/null || true \\
    && pip install --no-cache-dir {pip_install} 2>/dev/null || true

COPY . .

# Validate GPU visibility inside container:
#   docker run --device=/dev/kfd --device=/dev/dri --group-add video ...
CMD ["python", "main.py"]
"""