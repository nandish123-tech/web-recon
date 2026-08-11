"""Pydantic schemas for scan request and response models."""
from pydantic import BaseModel, Field, field_validator
from typing import Dict, List, Optional, Any
from datetime import datetime
from enum import Enum


class ScanStatus(str, Enum):
    QUEUED = "queued"
    RUNNING = "running"
    COMPLETED = "completed"
    COMPLETED_WITH_ERRORS = "completed_with_errors"
    FAILED = "failed"


class ModuleStatus(str, Enum):
    PENDING = "pending"
    RUNNING = "running"
    COMPLETED = "completed"
    FAILED = "failed"
    SKIPPED = "skipped"


class ScanRequest(BaseModel):
    target: str = Field(..., description="Target domain or URL to scan", min_length=1, max_length=255)


class ScanCreateResponse(BaseModel):
    scan_id: str
    status: ScanStatus
    target: str
    created_at: datetime


class ModuleError(BaseModel):
    module: str
    error_type: str
    message: str
    timestamp: datetime


class WhoisResult(BaseModel):
    domain: Optional[str] = None
    registrar: Optional[str] = None
    creation_date: Optional[str] = None
    updated_date: Optional[str] = None
    expiration_date: Optional[str] = None
    name_servers: Optional[List[str]] = None
    status: Optional[List[str]] = None
    emails: Optional[List[str]] = None
    raw: Optional[str] = None
    available: bool = True


class DnsResult(BaseModel):
    A: Optional[List[str]] = None
    AAAA: Optional[List[str]] = None
    MX: Optional[List[str]] = None
    NS: Optional[List[str]] = None
    TXT: Optional[List[str]] = None
    CNAME: Optional[List[str]] = None
    total_records: int = 0


class IpResult(BaseModel):
    ipv4: Optional[str] = None
    ipv6: Optional[str] = None
    asn: Optional[str] = None
    asn_description: Optional[str] = None
    org: Optional[str] = None
    country: Optional[str] = None
    country_code: Optional[str] = None
    region: Optional[str] = None
    city: Optional[str] = None
    isp: Optional[str] = None
    network: Optional[str] = None


class RedirectHop(BaseModel):
    url: str
    status_code: int


class HttpResult(BaseModel):
    status_code: Optional[int] = None
    status_text: Optional[str] = None
    final_url: Optional[str] = None
    redirect_chain: Optional[List[RedirectHop]] = None
    response_time_ms: Optional[float] = None
    http_version: Optional[str] = None
    server: Optional[str] = None
    content_type: Optional[str] = None
    x_powered_by: Optional[str] = None
    content_length: Optional[int] = None
    headers: Optional[Dict[str, str]] = None


class SslResult(BaseModel):
    status: str = "UNAVAILABLE"  # VALID, EXPIRING_SOON, EXPIRED, UNAVAILABLE
    common_name: Optional[str] = None
    subject: Optional[Dict[str, str]] = None
    issuer: Optional[Dict[str, str]] = None
    issuer_cn: Optional[str] = None
    not_before: Optional[str] = None
    not_after: Optional[str] = None
    days_remaining: Optional[int] = None
    san: Optional[List[str]] = None
    tls_version: Optional[str] = None
    serial_number: Optional[str] = None


class WebFilesResult(BaseModel):
    robots_txt_status: Optional[int] = None
    robots_txt_available: bool = False
    robots_txt_content: Optional[str] = None
    sitemap_xml_status: Optional[int] = None
    sitemap_xml_available: bool = False
    sitemap_xml_content: Optional[str] = None
    sitemap_urls: Optional[List[str]] = None


class SecurityHeader(BaseModel):
    name: str
    value: Optional[str] = None
    status: str  # PRESENT, MISSING, INFORMATIONAL
    observation: Optional[str] = None
    impact: Optional[str] = None
    recommendation: Optional[str] = None


class SecurityResult(BaseModel):
    headers: Optional[List[SecurityHeader]] = None
    present_count: int = 0
    missing_count: int = 0
    informational_count: int = 0
    coverage_percent: float = 0.0


class ScanModules(BaseModel):
    whois: ModuleStatus = ModuleStatus.PENDING
    dns: ModuleStatus = ModuleStatus.PENDING
    ip: ModuleStatus = ModuleStatus.PENDING
    http: ModuleStatus = ModuleStatus.PENDING
    ssl: ModuleStatus = ModuleStatus.PENDING
    web_files: ModuleStatus = ModuleStatus.PENDING
    security: ModuleStatus = ModuleStatus.PENDING


class ScanResults(BaseModel):
    whois: Optional[WhoisResult] = None
    dns: Optional[DnsResult] = None
    ip: Optional[IpResult] = None
    http: Optional[HttpResult] = None
    ssl: Optional[SslResult] = None
    web_files: Optional[WebFilesResult] = None
    security: Optional[SecurityResult] = None


class ScanResponse(BaseModel):
    scan_id: str
    target: str
    status: ScanStatus
    progress: int = 0
    current_module: Optional[str] = None
    modules: ScanModules
    errors: List[ModuleError] = []
    created_at: datetime
    started_at: Optional[datetime] = None
    completed_at: Optional[datetime] = None
    duration_seconds: Optional[float] = None
    results: Optional[ScanResults] = None


class ScanListItem(BaseModel):
    scan_id: str
    target: str
    status: ScanStatus
    created_at: datetime
    completed_at: Optional[datetime] = None
    duration_seconds: Optional[float] = None
    observation_count: int = 0
