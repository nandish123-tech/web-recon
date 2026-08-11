"""API endpoints for scan operations."""
import json
from datetime import datetime
from typing import List, Optional
from fastapi import APIRouter, HTTPException, BackgroundTasks, Response
from fastapi.responses import HTMLResponse, FileResponse

from app.schemas.scan import (
    ScanRequest, ScanCreateResponse, ScanResponse, ScanListItem,
    ScanStatus, ModuleStatus, ScanModules, ScanResults, ModuleError
)
from app.recon.engine import create_scan, get_scan_state
from app.database.models import get_scan, list_scans, delete_scan
from app.core.exceptions import TargetValidationError, ScanNotFoundError
from app.reports.generator import generate_html_report
from app.utils.logger import get_logger

logger = get_logger(__name__)
router = APIRouter(prefix="/api/scans", tags=["scans"])


def _db_row_to_response(row: dict) -> ScanResponse:
    """Convert a database row to a ScanResponse model."""
    modules_data = json.loads(row.get("modules_json", "{}"))
    errors_data = json.loads(row.get("errors_json", "[]"))
    results_data = json.loads(row.get("results_json") or "null")

    modules = ScanModules(**{k: ModuleStatus(v) for k, v in modules_data.items()})
    errors = [ModuleError(**e) for e in errors_data]

    results = None
    if results_data:
        try:
            results = ScanResults(**results_data)
        except Exception as e:
            logger.warning(f"Failed to parse results for scan {row['scan_id']}: {e}")

    return ScanResponse(
        scan_id=row["scan_id"],
        target=row["target"],
        status=ScanStatus(row["status"]),
        progress=row.get("progress", 0),
        current_module=row.get("current_module"),
        modules=modules,
        errors=errors,
        created_at=datetime.fromisoformat(row["created_at"]),
        started_at=datetime.fromisoformat(row["started_at"]) if row.get("started_at") else None,
        completed_at=datetime.fromisoformat(row["completed_at"]) if row.get("completed_at") else None,
        duration_seconds=row.get("duration_seconds"),
        results=results,
    )


def _state_to_response(state: dict) -> ScanResponse:
    """Convert in-memory state dict to ScanResponse model."""
    modules_data = state.get("modules", {})
    errors_data = state.get("errors", [])
    results_data = state.get("results")

    modules = ScanModules(**{k: ModuleStatus(v) for k, v in modules_data.items()})
    errors = [ModuleError(**e) for e in errors_data]

    results = None
    if results_data:
        try:
            results = ScanResults(**results_data)
        except Exception as e:
            logger.warning(f"Failed to parse in-memory results: {e}")

    return ScanResponse(
        scan_id=state["scan_id"],
        target=state["target"],
        status=ScanStatus(state["status"]),
        progress=state.get("progress", 0),
        current_module=state.get("current_module"),
        modules=modules,
        errors=errors,
        created_at=datetime.fromisoformat(state["created_at"]),
        started_at=datetime.fromisoformat(state["started_at"]) if state.get("started_at") else None,
        completed_at=datetime.fromisoformat(state["completed_at"]) if state.get("completed_at") else None,
        duration_seconds=state.get("duration_seconds"),
        results=results,
    )


@router.post("", response_model=ScanCreateResponse, status_code=201)
async def start_scan(request: ScanRequest) -> ScanCreateResponse:
    """
    Start a new reconnaissance scan.

    The scan runs in the background. Poll GET /api/scans/{scan_id} for progress.
    """
    try:
        scan_id, domain = create_scan(request.target)
    except TargetValidationError as e:
        raise HTTPException(status_code=422, detail=str(e))
    except Exception as e:
        logger.error(f"Failed to create scan: {e}")
        raise HTTPException(status_code=500, detail="Failed to start scan")

    return ScanCreateResponse(
        scan_id=scan_id,
        status=ScanStatus.QUEUED,
        target=domain,
        created_at=datetime.utcnow(),
    )


@router.get("", response_model=List[ScanListItem])
async def list_all_scans(limit: int = 50, offset: int = 0) -> List[ScanListItem]:
    """List all scans ordered by creation date."""
    rows = list_scans(limit=limit, offset=offset)
    items = []
    for row in rows:
        items.append(ScanListItem(
            scan_id=row["scan_id"],
            target=row["target"],
            status=ScanStatus(row["status"]),
            created_at=datetime.fromisoformat(row["created_at"]),
            completed_at=datetime.fromisoformat(row["completed_at"]) if row.get("completed_at") else None,
            duration_seconds=row.get("duration_seconds"),
            observation_count=row.get("observation_count", 0),
        ))
    return items


@router.get("/{scan_id}", response_model=ScanResponse)
async def get_scan_status(scan_id: str) -> ScanResponse:
    """
    Get the current status and results of a scan.

    Checks in-memory state first (for running scans), falls back to database.
    """
    # Check in-memory state (running scans)
    state = get_scan_state(scan_id)
    if state:
        return _state_to_response(state)

    # Fall back to database
    row = get_scan(scan_id)
    if row is None:
        raise HTTPException(status_code=404, detail=f"Scan '{scan_id}' not found")

    return _db_row_to_response(row)


@router.get("/{scan_id}/results", response_model=ScanResponse)
async def get_scan_results(scan_id: str) -> ScanResponse:
    """Get complete results for a completed scan."""
    return await get_scan_status(scan_id)


@router.get("/{scan_id}/report", response_class=HTMLResponse)
async def download_report(scan_id: str) -> HTMLResponse:
    """Generate and download an HTML reconnaissance report."""
    state = get_scan_state(scan_id)
    if state is None:
        row = get_scan(scan_id)
        if row is None:
            raise HTTPException(status_code=404, detail=f"Scan '{scan_id}' not found")
        results = json.loads(row.get("results_json") or "null")
        scan_data = {**row, "results": results, "modules": json.loads(row.get("modules_json", "{}"))}
    else:
        scan_data = state

    if not scan_data.get("results"):
        raise HTTPException(status_code=400, detail="Scan results are not yet available")

    try:
        html_content = generate_html_report(scan_data)
        return HTMLResponse(
            content=html_content,
            headers={
                "Content-Disposition": f"attachment; filename=recon-{scan_id[:8]}.html"
            },
        )
    except Exception as e:
        logger.error(f"Report generation failed: {e}")
        raise HTTPException(status_code=500, detail="Report generation failed")


@router.get("/{scan_id}/report/pdf")
async def download_pdf_report(scan_id: str) -> Response:
    """Generate and download a professional PDF reconnaissance report."""
    state = get_scan_state(scan_id)
    if state is None:
        row = get_scan(scan_id)
        if row is None:
            raise HTTPException(status_code=404, detail=f"Scan '{scan_id}' not found")
        results = json.loads(row.get("results_json") or "null")
        scan_data = {**row, "results": results, "modules": json.loads(row.get("modules_json", "{}"))}
    else:
        scan_data = state

    if not scan_data.get("results"):
        raise HTTPException(status_code=400, detail="Scan results are not yet available")

    try:
        from app.reports.generator import generate_pdf_report
        pdf_bytes = await generate_pdf_report(scan_data)
        return Response(
            content=pdf_bytes,
            media_type="application/pdf",
            headers={
                "Content-Disposition": f"attachment; filename=recon-{scan_id[:8]}.pdf"
            },
        )
    except Exception as e:
        logger.error(f"PDF generation failed: {e}")
        raise HTTPException(status_code=500, detail="PDF generation failed")


@router.delete("/{scan_id}", status_code=204)
async def remove_scan(scan_id: str) -> None:
    """Delete a scan and its results."""
    deleted = delete_scan(scan_id)
    if not deleted:
        raise HTTPException(status_code=404, detail=f"Scan '{scan_id}' not found")
