# Demo Repositories

Use these repositories as representative test cases when validating AMD Port Studio. They cover different frameworks, CUDA usage patterns, deployment styles, and dependency profiles.

## Recommended Demo Set

### 1. PyTorch image classification project
- Example: https://github.com/pytorch/examples
- Why it helps: clear Python dependency structure, GPU-aware training code, and straightforward ROCm migration signals.
- What to look for: `torch.cuda`, device placement, dataloaders, and training loops.

### 2. Hugging Face Transformers examples
- Example: https://github.com/huggingface/transformers
- Why it helps: common LLM and model-loading patterns that frequently depend on CUDA-enabled acceleration.
- What to look for: framework imports, generation pipelines, and optional GPU code paths.

### 3. ONNX Runtime samples
- Example: https://github.com/microsoft/onnxruntime
- Why it helps: a strong baseline for inference migration guidance and deployment analysis.
- What to look for: inference engines, provider selection, and runtime configuration.

### 4. Stable Diffusion / diffusion-based app
- Example: https://github.com/huggingface/diffusers
- Why it helps: stresses dependency analysis and model-serving recommendations.
- What to look for: model loading, attention optimizations, and accelerator-specific code.

### 5. CUDA sample repository
- Example: https://github.com/NVIDIA/cuda-samples
- Why it helps: exposes raw CUDA APIs and makes compatibility gaps obvious.
- What to look for: kernel launches, memory copies, compilation flags, and runtime assumptions.

### 6. TensorRT-based inference app
- Example: https://github.com/NVIDIA/TensorRT
- Why it helps: useful for showing unsupported NVIDIA-specific components and ROCm alternatives.
- What to look for: TensorRT imports, engine generation, and deployment container settings.

### 7. Containerized PyTorch service
- Example: https://github.com/pytorch/serve
- Why it helps: exercises Docker analysis, runtime packaging, and deployment guidance.
- What to look for: base images, CUDA runtime tags, and environment variables.

## Suggested Demo Order

1. PyTorch examples
2. CUDA samples
3. Containerized PyTorch service
4. TensorRT app

This order works well because it starts with a familiar codebase, then escalates into more clearly NVIDIA-specific workloads.

## Demo Criteria

A good demo repository should have at least one of the following:

- CUDA or GPU-specific imports
- Dockerfiles or container runtime configuration
- Large dependency manifests
- Clear framework usage that can be mapped to ROCm alternatives
- Enough structure for the scanner, compatibility engine, and assistant to produce meaningful output

## Fallback Demo Data

If a live repository is unavailable during a demo, use a pre-baked analysis record based on one of the projects above. That keeps the UI and narration consistent even when network access is unreliable.
