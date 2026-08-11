"""Tests for target validation module."""
import pytest
from app.recon.validator import validate_and_normalize
from app.core.exceptions import TargetValidationError


class TestValidateAndNormalize:
    """Test suite for target validation."""

    def test_valid_domain(self):
        domain, url = validate_and_normalize("example.com")
        assert domain == "example.com"
        assert url == "https://example.com"

    def test_valid_https_url(self):
        domain, url = validate_and_normalize("https://example.com")
        assert domain == "example.com"
        assert url == "https://example.com"

    def test_valid_http_url(self):
        domain, url = validate_and_normalize("http://example.com")
        assert domain == "example.com"
        assert url == "http://example.com"

    def test_domain_with_www(self):
        domain, url = validate_and_normalize("www.example.com")
        assert domain == "www.example.com"

    def test_domain_with_subdomain(self):
        domain, url = validate_and_normalize("sub.example.co.uk")
        assert domain == "sub.example.co.uk"

    def test_strips_whitespace(self):
        domain, url = validate_and_normalize("  example.com  ")
        assert domain == "example.com"

    def test_empty_target_raises(self):
        with pytest.raises(TargetValidationError, match="empty"):
            validate_and_normalize("")

    def test_localhost_raises(self):
        with pytest.raises(TargetValidationError):
            validate_and_normalize("localhost")

    def test_loopback_raises(self):
        with pytest.raises(TargetValidationError):
            validate_and_normalize("127.0.0.1")

    def test_private_ip_raises(self):
        with pytest.raises(TargetValidationError):
            validate_and_normalize("192.168.1.1")

    def test_private_10_network_raises(self):
        with pytest.raises(TargetValidationError):
            validate_and_normalize("10.0.0.1")

    def test_shell_semicolon_raises(self):
        with pytest.raises(TargetValidationError):
            validate_and_normalize("example.com; rm -rf /")

    def test_shell_pipe_raises(self):
        with pytest.raises(TargetValidationError):
            validate_and_normalize("example.com | cat /etc/passwd")

    def test_path_traversal_raises(self):
        with pytest.raises(TargetValidationError):
            validate_and_normalize("../etc/passwd")

    def test_ftp_scheme_raises(self):
        with pytest.raises(TargetValidationError):
            validate_and_normalize("ftp://example.com")

    def test_file_scheme_raises(self):
        with pytest.raises(TargetValidationError):
            validate_and_normalize("file:///etc/passwd")
