"""HTML and PDF report generator using Jinja2 templates."""

import os
from datetime import datetime
from typing import Any, Dict

from jinja2 import Environment, FileSystemLoader, select_autoescape
from playwright.sync_api import sync_playwright
from starlette.concurrency import run_in_threadpool

from app.utils.logger import get_logger


logger = get_logger(__name__)

TEMPLATE_DIR = os.path.join(os.path.dirname(__file__), "templates")


def _get_env() -> Environment:
    """Create Jinja2 environment with templates directory."""
    return Environment(
        loader=FileSystemLoader(TEMPLATE_DIR),
        autoescape=select_autoescape(["html"]),
    )


def _get_context(scan_data: Dict[str, Any]) -> Dict[str, Any]:
    """Extract context dictionary for Jinja templates."""
    results = scan_data.get("results", {}) or {}

    return {
        "scan_id": scan_data.get("scan_id", ""),
        "target": scan_data.get("target", ""),
        "status": scan_data.get("status", ""),
        "progress": scan_data.get("progress", 0),
        "created_at": scan_data.get("created_at", ""),
        "completed_at": scan_data.get("completed_at", ""),
        "duration_seconds": scan_data.get("duration_seconds"),
        "modules": scan_data.get("modules", {}),
        "errors": scan_data.get("errors", []),
        "generated_at": datetime.utcnow().strftime("%Y-%m-%d %H:%M:%S UTC"),
        "whois": results.get("whois"),
        "dns": results.get("dns"),
        "ip": results.get("ip"),
        "http": results.get("http"),
        "ssl": results.get("ssl"),
        "web_files": results.get("web_files"),
        "security": results.get("security"),
    }


def generate_html_report(scan_data: Dict[str, Any]) -> str:
    """Generate an HTML reconnaissance report from scan data."""
    env = _get_env()
    template = env.get_template("report.html.j2")

    return template.render(**_get_context(scan_data))


def _generate_pdf_sync(html_content: str) -> bytes:
    """
    Generate a PDF synchronously using Playwright.

    Running synchronous Playwright in a thread avoids Windows asyncio
    subprocess limitations when called from an async FastAPI endpoint.
    """
    with sync_playwright() as p:
        browser = p.chromium.launch(headless=True)

        try:
            page = browser.new_page()

            page.set_content(
                html_content,
                wait_until="networkidle",
            )

            pdf_bytes = page.pdf(
                format="A4",
                print_background=True,
                margin={
                    "top": "0cm",
                    "bottom": "0cm",
                    "left": "0cm",
                    "right": "0cm",
                },
            )

            return pdf_bytes

        finally:
            browser.close()


async def generate_pdf_report(scan_data: Dict[str, Any]) -> bytes:
    """
    Generate a PDF reconnaissance report from scan data.

    Uses the pdf_report.html.j2 template and runs Playwright's
    synchronous API in a thread pool to avoid Windows asyncio
    subprocess limitations.
    """
    env = _get_env()
    template = env.get_template("pdf_report.html.j2")

    html_content = template.render(**_get_context(scan_data))

    pdf_bytes = await run_in_threadpool(
        _generate_pdf_sync,
        html_content,
    )

    return pdf_bytes