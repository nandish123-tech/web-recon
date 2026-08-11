"""Tests for API endpoints."""
import pytest
from fastapi.testclient import TestClient
from unittest.mock import patch
from app.main import app

client = TestClient(app)


class TestHealthEndpoint:
    def test_health_returns_200(self):
        response = client.get("/api/health")
        assert response.status_code == 200

    def test_health_returns_ok(self):
        response = client.get("/api/health")
        data = response.json()
        assert data["status"] == "ok"

    def test_health_returns_service_name(self):
        response = client.get("/api/health")
        data = response.json()
        assert "service" in data
        assert "ReconScope" in data["service"]

    def test_health_returns_timestamp(self):
        response = client.get("/api/health")
        data = response.json()
        assert "timestamp" in data


class TestScansEndpoint:
    def test_list_scans_returns_200(self):
        response = client.get("/api/scans")
        assert response.status_code == 200
        assert isinstance(response.json(), list)

    def test_create_scan_with_invalid_target_returns_422(self):
        response = client.post("/api/scans", json={"target": "localhost"})
        assert response.status_code == 422

    def test_create_scan_with_empty_target_returns_422(self):
        response = client.post("/api/scans", json={"target": ""})
        assert response.status_code == 422

    def test_get_nonexistent_scan_returns_404(self):
        response = client.get("/api/scans/nonexistent-scan-id")
        assert response.status_code == 404

    def test_delete_nonexistent_scan_returns_404(self):
        response = client.delete("/api/scans/nonexistent-scan-id")
        assert response.status_code == 404

    @patch("app.api.scans.create_scan")
    def test_create_scan_valid_target(self, mock_create):
        mock_create.return_value = ("test-scan-id-123", "example.com")
        response = client.post("/api/scans", json={"target": "example.com"})
        assert response.status_code == 201
        data = response.json()
        assert data["scan_id"] == "test-scan-id-123"
        assert data["target"] == "example.com"
        assert data["status"] == "queued"

    @patch("app.api.scans.create_scan")
    def test_create_scan_with_url(self, mock_create):
        mock_create.return_value = ("scan-456", "example.com")
        response = client.post("/api/scans", json={"target": "https://example.com"})
        assert response.status_code == 201

    def test_create_scan_private_ip_rejected(self):
        response = client.post("/api/scans", json={"target": "192.168.1.1"})
        assert response.status_code == 422
