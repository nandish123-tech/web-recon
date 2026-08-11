"""Security header analysis module."""
from typing import Dict, Optional, List
from app.schemas.scan import SecurityResult, SecurityHeader
from app.utils.logger import get_logger

logger = get_logger(__name__)

# Security headers to check with their metadata
SECURITY_HEADERS = [
    {
        "name": "Strict-Transport-Security",
        "impact": "Without HSTS, browsers may downgrade HTTPS connections to HTTP, potentially exposing data in transit.",
        "recommendation": "Implement HSTS with a max-age of at least 31536000 seconds (one year) and consider including subdomains.",
    },
    {
        "name": "Content-Security-Policy",
        "impact": "The browser may have fewer restrictions against certain classes of content injection.",
        "recommendation": "Consider implementing an appropriate Content Security Policy tailored to your application's requirements.",
    },
    {
        "name": "X-Frame-Options",
        "impact": "The page may be embeddable in iframes on other origins, which could facilitate clickjacking attacks.",
        "recommendation": "Set X-Frame-Options to DENY or SAMEORIGIN, or use the frame-ancestors CSP directive.",
    },
    {
        "name": "X-Content-Type-Options",
        "impact": "Browsers may perform MIME-type sniffing, potentially interpreting files differently than intended.",
        "recommendation": "Set X-Content-Type-Options: nosniff.",
    },
    {
        "name": "Referrer-Policy",
        "impact": "The browser's default referrer behavior may expose URL paths to third-party sites.",
        "recommendation": "Set an appropriate Referrer-Policy such as strict-origin-when-cross-origin.",
    },
    {
        "name": "Permissions-Policy",
        "impact": "Browser features such as geolocation, camera, and microphone may be accessible without explicit restriction.",
        "recommendation": "Define a Permissions-Policy to restrict access to browser features your application does not require.",
    },
]

# Headers that expose server technology (informational)
INFORMATIONAL_HEADERS = [
    {
        "name": "Server",
        "observation": "Server technology information is exposed in the response.",
        "recommendation": "Consider removing or genericizing the Server header to reduce information disclosure.",
    },
    {
        "name": "X-Powered-By",
        "observation": "Backend technology information is exposed via X-Powered-By.",
        "recommendation": "Consider removing the X-Powered-By header to reduce fingerprinting surface.",
    },
]


def _normalize_headers(headers: Dict[str, str]) -> Dict[str, str]:
    """Normalize header names to lowercase for case-insensitive lookup."""
    return {k.lower(): v for k, v in headers.items()}


def run_security(headers: Dict[str, str]) -> SecurityResult:
    """
    Analyze HTTP response headers for security observations.

    Args:
        headers: Dict of HTTP response headers

    Returns:
        SecurityResult with categorized security observations
    """
    logger.info("Running security header analysis")

    normalized = _normalize_headers(headers)
    result_headers: List[SecurityHeader] = []
    present_count = 0
    missing_count = 0
    informational_count = 0

    # Check security headers
    for header_def in SECURITY_HEADERS:
        name = header_def["name"]
        value = normalized.get(name.lower())

        if value:
            result_headers.append(SecurityHeader(
                name=name,
                value=value,
                status="PRESENT",
                observation=f"{name} is present.",
            ))
            present_count += 1
        else:
            result_headers.append(SecurityHeader(
                name=name,
                value=None,
                status="MISSING",
                observation=f"{name} is not present in the response.",
                impact=header_def["impact"],
                recommendation=header_def["recommendation"],
            ))
            missing_count += 1

    # Check informational headers
    for header_def in INFORMATIONAL_HEADERS:
        name = header_def["name"]
        value = normalized.get(name.lower())

        if value:
            result_headers.append(SecurityHeader(
                name=name,
                value=value,
                status="INFORMATIONAL",
                observation=header_def["observation"],
                recommendation=header_def["recommendation"],
            ))
            informational_count += 1

    total_security = len(SECURITY_HEADERS)
    coverage = (present_count / total_security * 100) if total_security > 0 else 0

    return SecurityResult(
        headers=result_headers,
        present_count=present_count,
        missing_count=missing_count,
        informational_count=informational_count,
        coverage_percent=round(coverage, 1),
    )
