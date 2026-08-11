"""IP information and geolocation module (uses RDAP and ip-api.com — no extra libs)."""
import socket
import requests
from typing import Optional
from app.schemas.scan import IpResult
from app.utils.logger import get_logger

logger = get_logger(__name__)

RDAP_URL = "https://rdap.arin.net/registry/ip/{ip}"
IP_API_URL = "http://ip-api.com/json/{ip}?fields=status,country,countryCode,regionName,city,isp,org,as,asname"
TIMEOUT = 8


def _resolve_ipv4(domain: str) -> Optional[str]:
    """Resolve domain to IPv4."""
    try:
        return socket.gethostbyname(domain)
    except Exception:
        return None


def _resolve_ipv6(domain: str) -> Optional[str]:
    """Resolve domain to IPv6."""
    try:
        results = socket.getaddrinfo(domain, None, socket.AF_INET6)
        for result in results:
            addr = result[4][0]
            if addr and not addr.startswith("::") and "%" not in addr:
                return addr
        return None
    except Exception:
        return None


def _get_rdap_info(ip: str) -> dict:
    """Get ASN and network info from ARIN RDAP."""
    try:
        resp = requests.get(RDAP_URL.format(ip=ip), timeout=TIMEOUT)
        if resp.status_code == 200:
            data = resp.json()
            entities = data.get("entities", [])
            org = None
            for entity in entities:
                vcard = entity.get("vcardArray", [])
                if vcard and len(vcard) > 1:
                    for item in vcard[1]:
                        if item[0] == "fn":
                            org = item[3]
                            break
                if org:
                    break
            return {
                "network": data.get("cidr0_cidrs", [{}])[0].get("v4prefix"),
                "org": org or data.get("name"),
                "asn": None,
            }
    except Exception as e:
        logger.debug(f"RDAP lookup failed for {ip}: {e}")
    return {}


def _get_geo_info(ip: str) -> dict:
    """Get approximate geolocation from ip-api.com (free, no key required)."""
    try:
        resp = requests.get(IP_API_URL.format(ip=ip), timeout=TIMEOUT)
        if resp.status_code == 200:
            data = resp.json()
            if data.get("status") == "success":
                asn_raw = data.get("as", "")
                asn_num = asn_raw.split()[0].replace("AS", "") if asn_raw else None
                asn_desc = " ".join(asn_raw.split()[1:]) if asn_raw and len(asn_raw.split()) > 1 else data.get("asname")
                return {
                    "country": data.get("country"),
                    "country_code": data.get("countryCode"),
                    "region": data.get("regionName"),
                    "city": data.get("city"),
                    "isp": data.get("isp"),
                    "org": data.get("org"),
                    "asn": asn_num,
                    "asn_description": asn_desc,
                }
    except Exception as e:
        logger.debug(f"ip-api.com lookup failed for {ip}: {e}")
    return {}


def run_ip(domain: str) -> IpResult:
    """
    Collect IP address and network information for a domain.

    Args:
        domain: The domain to resolve

    Returns:
        IpResult with IP and geolocation data (geolocation is approximate)
    """
    logger.info(f"Running IP lookup for: {domain}")

    ipv4 = _resolve_ipv4(domain)
    ipv6 = _resolve_ipv6(domain)

    geo_info: dict = {}
    rdap_info: dict = {}

    target_ip = ipv4 or ipv6
    if target_ip:
        geo_info = _get_geo_info(target_ip)
        if not geo_info.get("org"):
            rdap_info = _get_rdap_info(target_ip)

    return IpResult(
        ipv4=ipv4,
        ipv6=ipv6,
        asn=geo_info.get("asn"),
        asn_description=geo_info.get("asn_description"),
        org=geo_info.get("org") or rdap_info.get("org"),
        country=geo_info.get("country"),
        country_code=geo_info.get("country_code"),
        region=geo_info.get("region"),
        city=geo_info.get("city"),
        isp=geo_info.get("isp"),
        network=rdap_info.get("network"),
    )
