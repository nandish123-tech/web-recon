"""HTTP reconnaissance module."""
import time
import requests
from requests.exceptions import RequestException
from typing import Optional, List
from app.schemas.scan import HttpResult, RedirectHop
from app.utils.logger import get_logger

logger = get_logger(__name__)

USER_AGENT = "Mozilla/5.0 (compatible; ReconScope/1.0; +https://github.com/recon-scope)"


def _get_http_version(response: requests.Response) -> Optional[str]:
    """Extract HTTP version from response."""
    try:
        raw = response.raw
        if hasattr(raw, "version"):
            v = raw.version
            if v == 11:
                return "HTTP/1.1"
            elif v == 10:
                return "HTTP/1.0"
            elif v == 20:
                return "HTTP/2"
        return None
    except Exception:
        return None


def run_http(base_url: str, timeout: int = 15) -> HttpResult:
    """
    Perform HTTP reconnaissance against a URL.

    Args:
        base_url: The base URL to request
        timeout: Request timeout in seconds

    Returns:
        HttpResult with response details
    """
    logger.info(f"Running HTTP reconnaissance for: {base_url}")

    session = requests.Session()
    session.max_redirects = 10
    headers = {"User-Agent": USER_AGENT}

    start_time = time.monotonic()
    try:
        response = session.get(
            base_url,
            headers=headers,
            timeout=timeout,
            allow_redirects=True,
        )
        elapsed_ms = (time.monotonic() - start_time) * 1000

        # Build redirect chain
        redirect_chain: List[RedirectHop] = []
        for r in response.history:
            redirect_chain.append(RedirectHop(url=r.url, status_code=r.status_code))

        # Collect headers (lowercase keys)
        resp_headers = dict(response.headers)

        # Extract key headers
        server = response.headers.get("Server")
        content_type = response.headers.get("Content-Type")
        x_powered_by = response.headers.get("X-Powered-By")
        content_length_str = response.headers.get("Content-Length")
        content_length = int(content_length_str) if content_length_str and content_length_str.isdigit() else None

        status_text = f"{response.status_code} {response.reason}" if response.reason else str(response.status_code)

        return HttpResult(
            status_code=response.status_code,
            status_text=status_text,
            final_url=response.url,
            redirect_chain=redirect_chain if redirect_chain else None,
            response_time_ms=round(elapsed_ms, 2),
            http_version=_get_http_version(response),
            server=server,
            content_type=content_type,
            x_powered_by=x_powered_by,
            content_length=content_length,
            headers=resp_headers,
        )

    except requests.exceptions.SSLError as e:
        logger.warning(f"SSL error for {base_url}: {e}")
        # Try HTTP fallback
        if base_url.startswith("https://"):
            http_url = base_url.replace("https://", "http://", 1)
            try:
                response = session.get(http_url, headers=headers, timeout=timeout, allow_redirects=True)
                elapsed_ms = (time.monotonic() - start_time) * 1000
                return HttpResult(
                    status_code=response.status_code,
                    status_text=f"{response.status_code} {response.reason}",
                    final_url=response.url,
                    response_time_ms=round(elapsed_ms, 2),
                    headers=dict(response.headers),
                    server=response.headers.get("Server"),
                    content_type=response.headers.get("Content-Type"),
                )
            except Exception:
                pass
        raise
    except RequestException as e:
        logger.warning(f"HTTP request failed for {base_url}: {e}")
        raise
