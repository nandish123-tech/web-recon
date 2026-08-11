"""DNS reconnaissance module."""
import dns.resolver
import dns.exception
from typing import List, Optional
from app.schemas.scan import DnsResult
from app.utils.logger import get_logger

logger = get_logger(__name__)

RECORD_TYPES = ["A", "AAAA", "MX", "NS", "TXT", "CNAME"]


def _query_records(resolver: dns.resolver.Resolver, domain: str, rtype: str) -> Optional[List[str]]:
    """
    Query DNS records of a given type, returning None if unavailable.
    """
    try:
        answers = resolver.resolve(domain, rtype, lifetime=10)
        records = []
        for rdata in answers:
            if rtype == "MX":
                records.append(str(rdata.exchange).rstrip("."))
            elif rtype == "NS":
                records.append(str(rdata.target).rstrip("."))
            elif rtype == "CNAME":
                records.append(str(rdata.target).rstrip("."))
            elif rtype == "TXT":
                records.append(b" ".join(rdata.strings).decode("utf-8", errors="replace"))
            else:
                records.append(str(rdata))
        return records if records else None
    except (dns.resolver.NoAnswer, dns.resolver.NXDOMAIN, dns.resolver.NoNameservers):
        return None
    except Exception as e:
        logger.debug(f"DNS {rtype} query failed for {domain}: {e}")
        return None


def run_dns(domain: str) -> DnsResult:
    """
    Perform DNS enumeration for a domain.

    Args:
        domain: The domain to query

    Returns:
        DnsResult with all available record types
    """
    logger.info(f"Running DNS enumeration for: {domain}")

    resolver = dns.resolver.Resolver()
    resolver.timeout = 5
    resolver.lifetime = 10

    results: dict = {}
    total = 0

    for rtype in RECORD_TYPES:
        records = _query_records(resolver, domain, rtype)
        results[rtype] = records
        if records:
            total += len(records)

    return DnsResult(
        A=results.get("A"),
        AAAA=results.get("AAAA"),
        MX=results.get("MX"),
        NS=results.get("NS"),
        TXT=results.get("TXT"),
        CNAME=results.get("CNAME"),
        total_records=total,
    )
