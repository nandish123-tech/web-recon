"""
Reconnaissance engine — orchestrates all reconnaissance modules.

Runs modules concurrently using ThreadPoolExecutor where safe.
Each module failure is isolated and recorded; the scan continues.
"""
import uuid
import json
import time
import traceback
from concurrent.futures import ThreadPoolExecutor, as_completed, Future
from datetime import datetime, timezone
from typing import Dict, Optional, Callable

from app.recon.validator import validate_and_normalize
from app.recon.whois_module import run_whois
from app.recon.dns_module import run_dns
from app.recon.ip_module import run_ip
from app.recon.http_module import run_http
from app.recon.ssl_module import run_ssl
from app.recon.webfiles_module import run_webfiles
from app.recon.security_module import run_security
from app.database.models import save_scan, update_scan_status
from app.core.config import settings
from app.utils.logger import get_logger

logger = get_logger(__name__)

# In-memory scan state (for fast progress polling)
_scan_registry: Dict[str, dict] = {}


def _make_empty_modules() -> dict:
    return {
        "whois": "pending",
        "dns": "pending",
        "ip": "pending",
        "http": "pending",
        "ssl": "pending",
        "web_files": "pending",
        "security": "pending",
    }


def _module_count() -> int:
    return len(_make_empty_modules())


def get_scan_state(scan_id: str) -> Optional[dict]:
    """Retrieve in-memory scan state."""
    return _scan_registry.get(scan_id)


def _update_state(scan_id: str, **kwargs) -> None:
    """Update in-memory state and persist to SQLite."""
    if scan_id in _scan_registry:
        _scan_registry[scan_id].update(kwargs)

    state = _scan_registry.get(scan_id, {})
    update_scan_status(
        scan_id=scan_id,
        status=state.get("status", "running"),
        progress=state.get("progress", 0),
        current_module=state.get("current_module"),
        modules=state.get("modules"),
        errors=state.get("errors", []),
        results=state.get("results"),
        started_at=state.get("started_at"),
        completed_at=state.get("completed_at"),
        duration_seconds=state.get("duration_seconds"),
        observation_count=state.get("observation_count", 0),
    )


def _set_module_status(scan_id: str, module: str, status: str) -> None:
    """Update a single module's status."""
    if scan_id in _scan_registry:
        _scan_registry[scan_id]["modules"][module] = status
        if status == "running":
            _scan_registry[scan_id]["current_module"] = module

    # Recalculate progress
    modules = _scan_registry[scan_id]["modules"]
    completed = sum(1 for s in modules.values() if s in ("completed", "failed"))
    progress = int((completed / _module_count()) * 100)
    _scan_registry[scan_id]["progress"] = progress

    _update_state(scan_id)


def _record_error(scan_id: str, module: str, error_type: str, message: str) -> None:
    """Record a module error."""
    if scan_id in _scan_registry:
        _scan_registry[scan_id]["errors"].append({
            "module": module,
            "error_type": error_type,
            "message": message,
            "timestamp": datetime.utcnow().isoformat(),
        })


def _run_module_safe(scan_id: str, module_name: str, fn: Callable, *args) -> Optional[dict]:
    """
    Execute a reconnaissance module safely.

    Catches all exceptions, records errors, and continues the scan.
    """
    _set_module_status(scan_id, module_name, "running")
    logger.info(f"[{scan_id}] Starting module: {module_name}")
    try:
        result = fn(*args)
        _set_module_status(scan_id, module_name, "completed")
        logger.info(f"[{scan_id}] Module completed: {module_name}")
        return result.model_dump() if hasattr(result, "model_dump") else result
    except Exception as e:
        logger.error(f"[{scan_id}] Module failed: {module_name} — {e}")
        logger.debug(traceback.format_exc())
        _record_error(scan_id, module_name, type(e).__name__, str(e))
        _set_module_status(scan_id, module_name, "failed")
        return None


def _run_scan_background(scan_id: str, domain: str, base_url: str) -> None:
    """
    Execute all reconnaissance modules for a scan.

    Modules that can run concurrently do so via ThreadPoolExecutor.
    Modules with dependencies (security requires HTTP headers) run sequentially.
    """
    state = _scan_registry[scan_id]
    state["started_at"] = datetime.utcnow().isoformat()
    state["status"] = "running"
    _update_state(scan_id)

    results: dict = {}
    start_time = time.monotonic()

    # Stage 1: Run WHOIS, DNS, IP, and HTTP concurrently
    concurrent_modules = {
        "whois": (run_whois, domain),
        "dns": (run_dns, domain),
        "ip": (run_ip, domain),
        "http": (run_http, base_url, settings.request_timeout),
    }

    with ThreadPoolExecutor(max_workers=4, thread_name_prefix="recon") as executor:
        futures: Dict[str, Future] = {}
        for name, (fn, *args) in concurrent_modules.items():
            _set_module_status(scan_id, name, "running")
            futures[name] = executor.submit(_run_module_safe, scan_id, name, fn, *args)

        for name, future in futures.items():
            try:
                results[name] = future.result(timeout=60)
            except Exception as e:
                logger.error(f"[{scan_id}] Future failed for {name}: {e}")
                _record_error(scan_id, name, "FutureError", str(e))
                _set_module_status(scan_id, name, "failed")
                results[name] = None

    # Stage 2: SSL/TLS (runs independently but after HTTP to know if HTTPS is active)
    results["ssl"] = _run_module_safe(scan_id, "ssl", run_ssl, domain, 443, settings.request_timeout)

    # Stage 3: Web files (robots.txt, sitemap.xml)
    results["web_files"] = _run_module_safe(
        scan_id, "web_files", run_webfiles, base_url, settings.request_timeout
    )

    # Stage 4: Security analysis (requires HTTP headers)
    http_result = results.get("http")
    if http_result and http_result.get("headers"):
        results["security"] = _run_module_safe(
            scan_id, "security", run_security, http_result["headers"]
        )
    else:
        _set_module_status(scan_id, "security", "skipped")
        results["security"] = None

    # Finalize scan
    elapsed = time.monotonic() - start_time
    has_errors = bool(state.get("errors"))
    final_status = "completed_with_errors" if has_errors else "completed"

    # Count security observations
    obs_count = 0
    if results.get("security") and results["security"].get("headers"):
        obs_count = len(results["security"]["headers"])

    state.update({
        "status": final_status,
        "progress": 100,
        "current_module": None,
        "results": results,
        "completed_at": datetime.utcnow().isoformat(),
        "duration_seconds": round(elapsed, 2),
        "observation_count": obs_count,
    })
    _update_state(scan_id)
    logger.info(f"[{scan_id}] Scan completed in {elapsed:.2f}s — status: {final_status}")


def create_scan(target: str) -> str:
    """
    Create and start a new reconnaissance scan.

    Args:
        target: The user-provided target domain or URL

    Returns:
        scan_id: Unique identifier for the scan

    Raises:
        TargetValidationError: If the target is invalid
    """
    domain, base_url = validate_and_normalize(target)
    scan_id = str(uuid.uuid4())

    # Initialize state
    _scan_registry[scan_id] = {
        "scan_id": scan_id,
        "target": domain,
        "base_url": base_url,
        "status": "queued",
        "progress": 0,
        "current_module": None,
        "modules": _make_empty_modules(),
        "errors": [],
        "results": None,
        "created_at": datetime.utcnow().isoformat(),
        "started_at": None,
        "completed_at": None,
        "duration_seconds": None,
        "observation_count": 0,
    }

    # Persist to SQLite
    save_scan(scan_id, domain)

    # Start scan in background thread
    executor = ThreadPoolExecutor(max_workers=1, thread_name_prefix=f"scan-{scan_id[:8]}")
    executor.submit(_run_scan_background, scan_id, domain, base_url)
    executor.shutdown(wait=False)

    logger.info(f"[{scan_id}] Scan queued for target: {domain} ({base_url})")
    return scan_id, domain
