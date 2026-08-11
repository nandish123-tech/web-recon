"""SSL/TLS certificate reconnaissance module."""
import ssl
import socket
from datetime import datetime, timezone
from typing import Optional, List, Dict
from cryptography import x509
from cryptography.hazmat.backends import default_backend
from cryptography.x509.oid import ExtensionOID, NameOID
from app.schemas.scan import SslResult
from app.utils.logger import get_logger

logger = get_logger(__name__)

EXPIRY_WARNING_DAYS = 30


def _get_name_attr(name: x509.Name, oid) -> Optional[str]:
    """Extract an attribute from an x509 Name."""
    try:
        return name.get_attributes_for_oid(oid)[0].value
    except (IndexError, Exception):
        return None


def _parse_san(cert: x509.Certificate) -> Optional[List[str]]:
    """Extract Subject Alternative Names."""
    try:
        ext = cert.extensions.get_extension_for_oid(ExtensionOID.SUBJECT_ALTERNATIVE_NAME)
        return [str(name.value) for name in ext.value]
    except x509.extensions.ExtensionNotFound:
        return None
    except Exception:
        return None


def run_ssl(hostname: str, port: int = 443, timeout: int = 10) -> SslResult:
    """
    Inspect the SSL/TLS certificate of a host.

    Args:
        hostname: The hostname to connect to
        port: The port to connect to (default 443)
        timeout: Connection timeout

    Returns:
        SslResult with certificate details
    """
    logger.info(f"Running SSL/TLS inspection for: {hostname}:{port}")

    context = ssl.create_default_context()
    try:
        with socket.create_connection((hostname, port), timeout=timeout) as sock:
            with context.wrap_socket(sock, server_hostname=hostname) as ssock:
                tls_version = ssock.version()
                der_cert = ssock.getpeercert(binary_form=True)

        cert = x509.load_der_x509_certificate(der_cert, default_backend())

        now = datetime.now(timezone.utc)
        not_after = cert.not_valid_after_utc
        not_before = cert.not_valid_before_utc
        days_remaining = (not_after - now).days

        # Determine status
        if now > not_after:
            status = "EXPIRED"
        elif days_remaining <= EXPIRY_WARNING_DAYS:
            status = "EXPIRING_SOON"
        else:
            status = "VALID"

        # Extract subject and issuer
        subject_dict = {}
        for attr in cert.subject:
            subject_dict[attr.oid.dotted_string] = attr.value

        issuer_dict = {}
        for attr in cert.issuer:
            issuer_dict[attr.oid.dotted_string] = attr.value

        common_name = _get_name_attr(cert.subject, NameOID.COMMON_NAME)
        issuer_cn = _get_name_attr(cert.issuer, NameOID.COMMON_NAME)
        issuer_org = _get_name_attr(cert.issuer, NameOID.ORGANIZATION_NAME)

        # Serial number
        serial = format(cert.serial_number, 'x').upper()

        return SslResult(
            status=status,
            common_name=common_name,
            subject={"CN": common_name or "", "O": _get_name_attr(cert.subject, NameOID.ORGANIZATION_NAME) or ""},
            issuer={
                "CN": issuer_cn or "",
                "O": issuer_org or "",
            },
            issuer_cn=f"{issuer_org or issuer_cn or 'Unknown'}",
            not_before=not_before.strftime("%Y-%m-%d %H:%M:%S UTC"),
            not_after=not_after.strftime("%Y-%m-%d %H:%M:%S UTC"),
            days_remaining=days_remaining,
            san=_parse_san(cert),
            tls_version=tls_version,
            serial_number=serial,
        )

    except ssl.SSLCertVerificationError as e:
        logger.warning(f"SSL cert verification failed for {hostname}: {e}")
        return SslResult(status="UNAVAILABLE")
    except (socket.timeout, ConnectionRefusedError, OSError) as e:
        logger.warning(f"SSL connection failed for {hostname}:{port}: {e}")
        return SslResult(status="UNAVAILABLE")
    except Exception as e:
        logger.warning(f"SSL inspection failed for {hostname}: {e}")
        return SslResult(status="UNAVAILABLE")
