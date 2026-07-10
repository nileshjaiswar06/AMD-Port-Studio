from __future__ import annotations
from typing import Any

STATUS_COLOR = {
    "supported": "#22c55e",
    "partial": "#f59e0b",
    "unsupported": "#ef4444",
    "unknown": "#6b7280",
}

def build_dependency_graph(
    findings: dict[str, Any],
    compatibility: dict[str, Any],
) -> dict[str, list[dict[str, Any]]]:
    """
    Convert scan findings into a graph structure that ReactFlow understands.

    Returns:
    {
        "nodes": [...],
        "edges": [...]
    }
    """

    nodes: list[dict[str, Any]] = []
    edges: list[dict[str, Any]] = []
    added_nodes: set[str] = set()

    x = 0
    y = 0

    def add_node(
        node_id: str,
        label: str,
        status: str = "unknown",
        *,
        alternative: str = "",
        difficulty: str = "Unknown",
        notes: str = "No notes.",
    ):
        nonlocal y
        if node_id in added_nodes:
            return

        color = STATUS_COLOR.get(status, STATUS_COLOR["unknown"])

        nodes.append({
            "id": node_id,
            "type": "dependency",  # match ReactFlow nodeTypes
            "position": {"x": x, "y": y},
           "data":{
"label":label,
"status":status,
"color":STATUS_COLOR.get(status),
"alternative":alternative,
"difficulty":difficulty,
"notes":notes
},
        })

        added_nodes.add(node_id)
        y += 190

    edge_count = 1

    def add_edge(source: str, target: str):
        nonlocal edge_count
        edges.append({
            "id": f"edge-{edge_count}",
            "source": source,
            "target": target,
        })
        edge_count += 1

    # -------------------------------------------------------
    # Root nodes
    # -------------------------------------------------------
    dependency_root = "dependencies"
    framework_root = "frameworks"
    cuda_root = "cuda"
    docker_root = "docker"
    compat_root = "compatibility"

    add_node(framework_root, "Frameworks", "supported")
    add_node(cuda_root, "CUDA", "partial")
    add_node(docker_root, "Docker", "partial")
    add_node(compat_root, "Compatibility", "supported")
    add_node(dependency_root, "Dependencies", "supported")

    add_edge(dependency_root, framework_root)
    add_edge(dependency_root, cuda_root)
    add_edge(dependency_root, docker_root)
    add_edge(dependency_root, compat_root)

    # -------------------------------------------------------
    # Frameworks
    # -------------------------------------------------------
    for framework in findings.get("dependencies", {}).get("frameworks", []):
        framework_id = framework.lower().replace(" ", "-")
        add_node(framework_id, framework, "supported")
        add_edge(framework_root, framework_id)

    # -------------------------------------------------------
    # Compatibility Components (Step 6.4)
    # -------------------------------------------------------
    for component in compatibility.get("components", []):
        node_id = component["id"]
        label = component.get("label") or component.get("name") or node_id
        status = component.get("status", "unknown")

        add_node(
            node_id,
            label,
            status,
            alternative=component.get("alternative", ""),
            difficulty=component.get("difficulty", "Unknown"),
            notes=component.get("notes", "No notes."),
        )

        component_type = component.get("type", "").lower()
        if component_type == "docker":
            add_edge(docker_root, node_id)
        elif component_type == "cuda":
            add_edge(cuda_root, node_id)
        else:
            add_edge(compat_root, node_id)

        alternative = component.get("alternative")
        if alternative:
            alt_id = f"{node_id}-alternative"
            add_node(
                alt_id,
                alternative,
                "supported",
                alternative="",
                difficulty=component.get("difficulty", "Unknown"),
                notes=f"Alternative for {label}.",
            )
            add_edge(node_id, alt_id)

    return {"nodes": nodes, "edges": edges}
