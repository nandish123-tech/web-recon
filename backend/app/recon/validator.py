"""Target validation and normalization."""
import re
from urllib.parse import urlparse
from app.core.exceptions import TargetValidationError

# Allowed URL schemes for reconnaissance
ALLOWED_SCHEMES = {"http", "https"}

# Blocked private/loopback ranges and localhost
BLOCKED_PATTERNS = [
    r"^localhost$",
    r"^127\.\d+\.\d+\.\d+$",
    r"^10\.\d+\.\d+\.\d+$",
    r"^192\.168\.\d+\.\d+$",
    r"^172\.(1[6-9]|2[0-9]|3[0-1])\.\d+\.\d+$",
    r"^::1$",
    r"^0\.0\.0\.0$",
]


def validate_and_normalize(target: str) -> tuple[str, str]:
    """
    Validate and normalize a target domain or URL.

    Args:
        target: Raw user input (domain or URL)

    Returns:
        Tuple of (normalized_domain, base_url)

    Raises:
        TargetValidationError: If the target is invalid
    """
    target = target.strip()

    if not target:
        raise TargetValidationError("Target cannot be empty")

    # Reject shell metacharacters and path traversal
    dangerous_chars = set("; & | ` $ ( ) { } [ ] < > \\n \\r \\t".split())
    for char in dangerous_chars:
        if char in target:
            raise TargetValidationError(f"Target contains invalid character: {char}")

    if ".." in target or target.startswith("/"):
        raise TargetValidationError("Target must be a domain or URL, not a path")

    # Reject explicitly non-http/https schemes before adding default
    if "://" in target:
        scheme = target.split("://")[0].lower()
        if scheme not in ALLOWED_SCHEMES:
            raise TargetValidationError(
                f"URL scheme '{scheme}' is not allowed. Only http and https are supported."
            )

    # Add scheme if missing
    if not target.startswith(("http://", "https://")):
        target = "https://" + target

    # Parse and validate URL
    try:
        parsed = urlparse(target)
    except Exception as e:
        raise TargetValidationError(f"Invalid URL: {e}")

    if parsed.scheme not in ALLOWED_SCHEMES:
        raise TargetValidationError(
            f"URL scheme '{parsed.scheme}' is not allowed. Use http or https."
        )

    hostname = parsed.hostname
    if not hostname:
        raise TargetValidationError("Could not extract hostname from target")

    # Reject IP-based private ranges and localhost
    for pattern in BLOCKED_PATTERNS:
        if re.match(pattern, hostname, re.IGNORECASE):
            raise TargetValidationError(
                f"Target '{hostname}' is a private/loopback address and cannot be scanned"
            )

    # Basic hostname validation
    if not re.match(r"^[a-zA-Z0-9][a-zA-Z0-9\-\.]{0,253}[a-zA-Z0-9]$", hostname):
        if not re.match(r"^[a-zA-Z]{2,}$", hostname):  # allow single-label like 'localhost' (already blocked)
            raise TargetValidationError(f"Invalid hostname: {hostname}")

    # Build clean base URL
    base_url = f"{parsed.scheme}://{hostname}"
    if parsed.port:
        base_url += f":{parsed.port}"

    return hostname, base_url
