from pathlib import Path

EXTENSION_LANGUAGE_MAP = {
    ".py": "python",
    ".pyw": "python",
    ".ipynb": "jupyter",
    ".cu": "cuda",
    ".cuh": "cuda",
    ".cpp": "cpp",
    ".cc": "cpp",
    ".cxx": "cpp",
    ".h": "cpp",
    ".hpp": "cpp",
    ".c": "c",
    ".js": "javascript",
    ".jsx": "javascript",
    ".ts": "typescript",
    ".tsx": "typescript",
    ".go": "go",
    ".rs": "rust",
    ".java": "java",
    ".kt": "kotlin",
    ".rb": "ruby",
    ".php": "php",
    ".sql": "sql",
    ".sh": "shell",
    ".bash": "shell",
    ".yaml": "yaml",
    ".yml": "yaml",
    ".json": "json",
    ".toml": "toml",
    ".md": "markdown",
    ".dockerfile": "docker",
}

SPECIAL_FILENAMES = {
    "dockerfile": "docker",
    "makefile": "make",
    "cmakelists.txt": "cmake",
}


def detect_language(path: str) -> str:
    name = Path(path).name.lower()
    if name in SPECIAL_FILENAMES:
        return SPECIAL_FILENAMES[name]
    ext = Path(path).suffix.lower()
    return EXTENSION_LANGUAGE_MAP.get(ext, "unknown")