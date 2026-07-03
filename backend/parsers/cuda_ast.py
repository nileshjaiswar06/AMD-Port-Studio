import ast
from dataclasses import asdict, dataclass
from pathlib import Path


@dataclass
class CudaHit:
    file: str
    line: int
    kind: str
    symbol: str
    snippet: str
    confidence: str  # "high" | "medium"


CUDA_IMPORT_MODULES = {
    "torch.cuda", "tensorrt", "cupy", "pycuda", "numba.cuda", "triton",
}

CUDA_ATTRIBUTE_ROOTS = {"torch", "cupy", "tensorrt"}

STRING_CUDA_PATTERNS = ("cuda", "cuda:0", "mps")  # mps = apple, flag as note


class CudaAstVisitor(ast.NodeVisitor):
    def __init__(self, rel_path: str, source_lines: list[str]):
        self.rel_path = rel_path
        self.source_lines = source_lines
        self.hits: list[CudaHit] = []
        self._torch_aliases: set[str] = {"torch"}

    def _snippet(self, line_no: int) -> str:
        if 1 <= line_no <= len(self.source_lines):
            return self.source_lines[line_no - 1].strip()[:120]
        return ""

    def _add(self, line: int, kind: str, symbol: str, confidence: str = "high") -> None:
        self.hits.append(
            CudaHit(
                file=self.rel_path,
                line=line,
                kind=kind,
                symbol=symbol,
                snippet=self._snippet(line),
                confidence=confidence,
            )
        )

    def visit_Import(self, node: ast.Import) -> None:
        for alias in node.names:
            name = alias.asname or alias.name
            if alias.name in CUDA_IMPORT_MODULES or "cuda" in alias.name.lower():
                self._add(node.lineno, "import", alias.name)
            if alias.name == "torch":
                self._torch_aliases.add(name)
        self.generic_visit(node)

    def visit_ImportFrom(self, node: ast.ImportFrom) -> None:
        module = node.module or ""
        if "cuda" in module.lower() or module in CUDA_IMPORT_MODULES:
            for alias in node.names:
                self._add(node.lineno, "import_from", f"{module}.{alias.name}")
        if module == "torch":
            for alias in node.names:
                if alias.name == "cuda":
                    self._add(node.lineno, "import_from", "torch.cuda")
        self.generic_visit(node)

    def visit_Call(self, node: ast.Call) -> None:
        # torch.cuda.is_available(), model.cuda(), tensorrt.*
        func = node.func
        if isinstance(func, ast.Attribute):
            chain = self._attr_chain(func)
            joined = ".".join(chain)
            if "cuda" in joined.lower() or joined.endswith(".cuda"):
                self._add(node.lineno, "call", joined)
        self.generic_visit(node)

    def visit_Assign(self, node: ast.Assign) -> None:
        if isinstance(node.value, ast.Constant) and isinstance(node.value.value, str):
            val = node.value.value.lower()
            if val in STRING_CUDA_PATTERNS or val.startswith("cuda:"):
                conf = "medium" if val == "mps" else "high"
                self._add(node.lineno, "device_string", node.value.value, conf)
        self.generic_visit(node)

    def visit_Compare(self, node: ast.Compare) -> None:
        # device == "cuda"
        for comparator in node.comparators:
            if isinstance(comparator, ast.Constant) and isinstance(comparator.value, str):
                if "cuda" in comparator.value.lower():
                    self._add(node.lineno, "comparison", comparator.value)
        self.generic_visit(node)

    def _attr_chain(self, node: ast.AST) -> list[str]:
        parts: list[str] = []
        current = node
        while isinstance(current, ast.Attribute):
            parts.append(current.attr)
            current = current.value
        if isinstance(current, ast.Name):
            parts.append(current.id)
        return list(reversed(parts))


def analyze_python_file(repo_path: Path, file_path: Path) -> list[dict]:
    rel = str(file_path.relative_to(repo_path)).replace("\\", "/")
    try:
        source = file_path.read_text(encoding="utf-8", errors="ignore")
    except OSError:
        return []

    if not source.strip():
        return []

    try:
        tree = ast.parse(source, filename=rel)
    except SyntaxError:
        return []

    lines = source.splitlines()
    visitor = CudaAstVisitor(rel, lines)
    visitor.visit(tree)
    return [asdict(h) for h in visitor.hits]