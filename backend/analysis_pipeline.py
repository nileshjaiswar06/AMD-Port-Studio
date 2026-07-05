from pathlib import Path
from typing import Callable
import logging

from ai.provider import run_migration_advisor
from compatibility.blockers import build_blockers
from compatibility.engine import build_deterministic_summary, evaluate_compatibility
from compatibility.recommendations import build_recommendations
from confidence.engine import build_confidence
from config import settings
from generators.deploy_guide import generate_deploy_guide
from generators.docker_generator import generate_rocm_dockerfile
from metrics.calculator import compute_metrics
from parsers.cuda_detector import detect_cuda
from parsers.dependencies import extract_dependencies
from parsers.docker_analyzer import analyze_docker_files
from reports.html_report import render_html_report
from scanner.indexer import index_repository

logger = logging.getLogger(__name__)

def _build_migration_status() -> dict:
    return {
        "analysis": True,
        "planning": True,
        "docker": True,
        "migrate": False,
        "validate": False,
        "benchmark": False,
        "productionReady": False,
        "maintain": False,
    }


def _build_explainability(compatibility: dict, findings: dict) -> dict:
    docker = findings["docker"]
    return {
        "compatibility": {
            "score": compatibility["score"],
            "components": compatibility["components"],
            "signals": {
                "cuda": findings["cuda"]["summary"],
                "docker": {
                    "uses_nvidia_docker": docker["uses_nvidia_docker"],
                    "dockerfiles_found": docker.get("dockerfiles_found", []),
                },
            },
        }
    }


def run_analysis_pipeline(
    repo_path: Path,
    slug: str,
    source_url: str,
    source_type: str,
    progress_callback: Callable[[str], None] | None = None,
) -> dict:
    if progress_callback:
        progress_callback("scanning")
    scan = index_repository(repo_path)

    MAX_FILES = 20000
    if scan["file_count"] > MAX_FILES:
        raise ValueError(
            f"Repository too large ({scan['file_count']} files). "
            "Maximum supported repository size is 20,000 files."
        )

    all_files = scan["files"]

    MAX_INDEXED_FILES = 5000
    if len(all_files) > MAX_INDEXED_FILES:
        all_files = all_files[:MAX_INDEXED_FILES]

    scan["files_full"] = all_files

    dependencies = extract_dependencies(repo_path)
    cuda = detect_cuda(repo_path, indexed_files=all_files)
    docker = analyze_docker_files(repo_path)
    findings = {
        "dependencies": dependencies,
        "cuda": cuda,
        "docker": docker,
    }

    if progress_callback:
        progress_callback("analyzing")
    compatibility = evaluate_compatibility(findings)
    confidence = build_confidence(findings, compatibility)
    findings["compatibility"] = {
        "score": compatibility["score"],
        "tier": compatibility["tier"],
        "effort_score": compatibility["effort_score"],
        "components": compatibility["components"],
    }

    blockers = build_blockers(findings, compatibility)
    recommendations = build_recommendations(findings, compatibility, blockers)
    metrics = compute_metrics(findings, compatibility, blockers)

    deterministic_analysis = {
        **compatibility["migration"],
        "summary": build_deterministic_summary(slug, compatibility, findings),
    }

    if progress_callback:
        progress_callback("ai")
    ai_output = run_migration_advisor(
        slug,
        source_url,
        findings,
        findings["compatibility"],
        deterministic_analysis,
    )

    analysis = {**deterministic_analysis}
    ai_used = False
    ai_provider = "deterministic"
    if ai_output:
        ai_used = True
        ai_provider = settings.ai_provider
        analysis["summary"] = ai_output.executiveSummary
        analysis["migrationSteps"] = ai_output.migrationSteps
        if ai_output.recommendedAlternatives:
            analysis["recommendedAlternatives"] = ai_output.recommendedAlternatives
    logger.info("=" * 60)
    logger.info("AMD Port Studio - AI Provider")
    logger.info("Repository  : %s", slug)
    logger.info("Provider    : %s", ai_provider.capitalize())
    logger.info("AI Used     : %s", ai_used)

    if ai_used:
        if ai_provider == "gemini":
            logger.info("Model       : %s", settings.gemini_model)
        elif ai_provider == "fireworks":
            logger.info("Model       : %s", settings.fireworks_model)
    else:
        logger.info("Fallback    : Deterministic summary")

    logger.info("=" * 60)
    if progress_callback:
        progress_callback("generating")
    dockerfile = generate_rocm_dockerfile(findings, slug, repo_path)
    deploy_guide = generate_deploy_guide(findings, slug)
    html_report = render_html_report(
        slug,
        source_url,
        analysis,
        findings,
        dockerfile,
        deploy_guide,
        ai_used,
    )
    artifacts = {
        "dockerfile": dockerfile,
        "deployGuide": deploy_guide,
        "htmlReport": html_report,
        "aiUsed": ai_used,
        "aiProvider": ai_provider,
    }

    migration_status = _build_migration_status()
    explainability = _build_explainability(compatibility, findings)

    scan_for_response = {**scan, "files": all_files[:200]}
    del scan_for_response["files_full"]

    return {
        "status": "success",
        "project_slug": slug,
        "source_type": source_type,
        "source_url": source_url,
        "repository": {
            "name": slug,
            "url": source_url,
            "file_count": scan["file_count"],
            "files_skipped": scan["files_skipped"],
            "languages": scan["languages"],
            "priority_files": scan["priority_files"],
            "files": scan_for_response["files"],
            "sample_files": scan["sample_files"],
        },
        "findings": findings,
        "analysis": analysis,
        "confidence": confidence,
        "artifacts": artifacts,
        "metrics": metrics,
        "blockers": blockers,
        "recommendations": recommendations,
        "migrationStatus": migration_status,
        "explainability": explainability,
        "_db_scan": {**scan, "files": all_files},
    }
