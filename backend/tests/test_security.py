"""Tests for security header analysis module."""
import pytest
from app.recon.security_module import run_security


class TestSecurityModule:

    def test_all_headers_present(self):
        headers = {
            "Strict-Transport-Security": "max-age=31536000; includeSubDomains",
            "Content-Security-Policy": "default-src 'self'",
            "X-Frame-Options": "DENY",
            "X-Content-Type-Options": "nosniff",
            "Referrer-Policy": "strict-origin-when-cross-origin",
            "Permissions-Policy": "geolocation=()",
        }
        result = run_security(headers)
        assert result.present_count == 6
        assert result.missing_count == 0
        assert result.coverage_percent == 100.0

    def test_all_headers_missing(self):
        headers = {"Content-Type": "text/html"}
        result = run_security(headers)
        assert result.present_count == 0
        assert result.missing_count == 6
        assert result.coverage_percent == 0.0

    def test_partial_headers(self):
        headers = {
            "Strict-Transport-Security": "max-age=31536000",
            "X-Content-Type-Options": "nosniff",
        }
        result = run_security(headers)
        assert result.present_count == 2
        assert result.missing_count == 4

    def test_case_insensitive_header_matching(self):
        """Headers should be matched case-insensitively."""
        headers = {
            "strict-transport-security": "max-age=31536000",
            "x-content-type-options": "nosniff",
        }
        result = run_security(headers)
        assert result.present_count == 2

    def test_server_header_is_informational(self):
        headers = {
            "Server": "nginx/1.18.0",
        }
        result = run_security(headers)
        info_headers = [h for h in result.headers if h.status == "INFORMATIONAL"]
        assert any(h.name == "Server" for h in info_headers)
        assert result.informational_count >= 1

    def test_x_powered_by_is_informational(self):
        headers = {
            "X-Powered-By": "PHP/8.0",
        }
        result = run_security(headers)
        info_headers = [h for h in result.headers if h.status == "INFORMATIONAL"]
        assert any(h.name == "X-Powered-By" for h in info_headers)

    def test_missing_header_has_recommendation(self):
        headers = {}
        result = run_security(headers)
        missing = [h for h in result.headers if h.status == "MISSING"]
        for h in missing:
            assert h.recommendation is not None
            assert h.impact is not None

    def test_present_header_stores_value(self):
        headers = {
            "Strict-Transport-Security": "max-age=31536000",
        }
        result = run_security(headers)
        hsts = next((h for h in result.headers if h.name == "Strict-Transport-Security"), None)
        assert hsts is not None
        assert hsts.value == "max-age=31536000"
        assert hsts.status == "PRESENT"

    def test_empty_headers(self):
        result = run_security({})
        assert result is not None
        assert result.present_count == 0
        assert result.coverage_percent == 0.0

    def test_headers_list_not_empty(self):
        result = run_security({})
        assert result.headers is not None
        assert len(result.headers) > 0
