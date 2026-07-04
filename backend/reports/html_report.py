from pathlib import Path

from jinja2 import Environment, FileSystemLoader, select_autoescape


def render_html_report(
    repo_name: str,
    repo_url: str,
    analysis: dict,
    findings: dict,
    dockerfile: str,
    deploy_steps: list[str],
    ai_used: bool,
) -> str:
    templates_dir = Path(__file__).parent / "templates"
    env = Environment(
        loader=FileSystemLoader(str(templates_dir)),
        autoescape=select_autoescape(["html", "xml"]),
    )
    template = env.get_template("report.html.j2")
    return template.render(
        repo_name=repo_name.replace("_", "/"),
        repo_url=repo_url,
        analysis=analysis,
        findings=findings,
        dockerfile=dockerfile,
        deploy_steps=deploy_steps,
        ai_used=ai_used,
    )
