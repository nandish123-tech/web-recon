"""Web files reconnaissance module (robots.txt, sitemap.xml)."""
import requests
import re
from typing import Optional, List
from app.schemas.scan import WebFilesResult
from app.utils.logger import get_logger

logger = get_logger(__name__)

USER_AGENT = "Mozilla/5.0 (compatible; ReconScope/1.0)"


def _fetch_url(url: str, timeout: int = 10) -> tuple[Optional[int], Optional[str]]:
    """Fetch a URL and return (status_code, content)."""
    try:
        resp = requests.get(
            url,
            headers={"User-Agent": USER_AGENT},
            timeout=timeout,
            allow_redirects=True,
        )
        content = resp.text[:20000]  # Limit content size
        return resp.status_code, content
    except Exception as e:
        logger.debug(f"Failed to fetch {url}: {e}")
        return None, None


def _extract_sitemap_urls(content: str) -> List[str]:
    """Extract URLs from sitemap XML content."""
    try:
        urls = re.findall(r'<loc>([^<]+)</loc>', content)
        return urls[:50]  # Limit to 50 URLs
    except Exception:
        return []


def run_webfiles(base_url: str, timeout: int = 10) -> WebFilesResult:
    """
    Fetch and analyze robots.txt and sitemap.xml.

    Args:
        base_url: The base URL of the target
        timeout: Request timeout in seconds

    Returns:
        WebFilesResult with robots.txt and sitemap.xml information
    """
    logger.info(f"Fetching web files for: {base_url}")

    robots_url = f"{base_url}/robots.txt"
    sitemap_url = f"{base_url}/sitemap.xml"

    # Fetch robots.txt
    robots_status, robots_content = _fetch_url(robots_url, timeout)
    robots_available = robots_status == 200 and bool(robots_content)

    # Check if robots.txt content mentions a sitemap
    sitemap_urls = []
    if robots_available and robots_content:
        sitemap_mentions = re.findall(r'(?i)Sitemap:\s*(https?://[^\s]+)', robots_content)
        if sitemap_mentions:
            # Try to fetch the mentioned sitemap
            alt_sitemap_url = sitemap_mentions[0]
            if alt_sitemap_url != sitemap_url:
                alt_status, alt_content = _fetch_url(alt_sitemap_url, timeout)
                if alt_status == 200 and alt_content:
                    sitemap_urls = _extract_sitemap_urls(alt_content)

    # Fetch sitemap.xml
    sitemap_status, sitemap_content = _fetch_url(sitemap_url, timeout)
    sitemap_available = sitemap_status == 200 and bool(sitemap_content)

    if sitemap_available and sitemap_content and not sitemap_urls:
        sitemap_urls = _extract_sitemap_urls(sitemap_content)

    return WebFilesResult(
        robots_txt_status=robots_status,
        robots_txt_available=robots_available,
        robots_txt_content=robots_content if robots_available else None,
        sitemap_xml_status=sitemap_status,
        sitemap_xml_available=sitemap_available,
        sitemap_xml_content=sitemap_content if sitemap_available else None,
        sitemap_urls=sitemap_urls if sitemap_urls else None,
    )
