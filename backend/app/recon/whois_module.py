"""WHOIS reconnaissance module."""
import whois
from datetime import datetime
from typing import Optional, List
from app.schemas.scan import WhoisResult
from app.utils.logger import get_logger

logger = get_logger(__name__)


def _format_date(value) -> Optional[str]:
    """Format a date or list of dates to ISO string."""
    if value is None:
        return None
    if isinstance(value, list):
        value = value[0] if value else None
    if isinstance(value, datetime):
        return value.strftime("%Y-%m-%d %H:%M:%S UTC")
    if isinstance(value, str):
        return value
    return str(value)


def _to_list(value) -> Optional[List[str]]:
    """Normalize a value to a list of strings."""
    if value is None:
        return None
    if isinstance(value, list):
        return [str(v) for v in value if v]
    if isinstance(value, str):
        return [value] if value.strip() else None
    return [str(value)]


def run_whois(domain: str) -> WhoisResult:
    """
    Perform WHOIS lookup for a domain.

    Args:
        domain: The domain to look up

    Returns:
        WhoisResult with parsed information
    """
    logger.info(f"Running WHOIS lookup for: {domain}")

    try:
        w = whois.whois(domain)

        if not w or (not w.domain_name and not w.registrar):
            return WhoisResult(
                available=False,
                domain=domain,
            )

        # Build raw text representation
        raw_parts = []
        for key, val in w.items():
            if val:
                raw_parts.append(f"{key}: {val}")
        raw_text = "\n".join(raw_parts)

        domain_name = w.domain_name
        if isinstance(domain_name, list):
            domain_name = domain_name[0]

        return WhoisResult(
            domain=str(domain_name).lower() if domain_name else domain,
            registrar=w.registrar,
            creation_date=_format_date(w.creation_date),
            updated_date=_format_date(w.updated_date),
            expiration_date=_format_date(w.expiration_date),
            name_servers=_to_list(w.name_servers),
            status=_to_list(w.status),
            emails=_to_list(w.emails),
            raw=raw_text[:5000],  # limit size
            available=True,
        )

    except Exception as e:
        logger.warning(f"WHOIS lookup failed for {domain}: {e}")
        return WhoisResult(
            available=False,
            domain=domain,
        )
