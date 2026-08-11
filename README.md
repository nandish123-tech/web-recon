# Web Reconnaissance Automation Framework — ReconScope

A production-quality, full-stack web reconnaissance automation platform for authorized security testing.

![ReconScope Dashboard](docs/screenshot-placeholder.png)

---

## ⚠️ Legal Notice

This tool is intended **exclusively** for:
- Security researchers testing systems they own
- Penetration testers with **explicit written authorization**
- Educational and research purposes on authorized targets

**Never** use this tool against systems without explicit written permission. Unauthorized reconnaissance may violate computer crime laws in your jurisdiction.

---

## Features

- **Real-Time Scan Progress** — Live module status updates via efficient polling
- **WHOIS Lookup** — Registrar, creation date, nameservers, expiry
- **DNS Enumeration** — A, AAAA, MX, NS, TXT, CNAME records
- **IP & Geolocation** — ASN, organization, country, region (via RDAP + ip-api.com)
- **HTTP Reconnaissance** — Status, redirects, response timing, headers
- **SSL/TLS Analysis** — Certificate validity, expiry, SANs, TLS version
- **robots.txt & sitemap.xml** — Availability, content, discovered URLs
- **Security Header Analysis** — CSP, HSTS, X-Frame-Options, and more
- **Professional HTML Report** — Downloadable, dark-themed report with all scan data
- **Scan History** — SQLite-backed history with delete and re-view
- **Error Isolation** — Module failures never terminate the full scan
- **No Fake Data** — All results from real network reconnaissance

---

## Architecture

```mermaid
graph TD
    User[Browser] -->|POST /api/scans| FastAPI
    FastAPI -->|background thread| Engine[Recon Engine]
    Engine --> WHOIS[WHOIS Module]
    Engine --> DNS[DNS Module]
    Engine --> IP[IP Module]
    Engine --> HTTP[HTTP Module]
    Engine --> SSL[SSL/TLS Module]
    Engine --> WebFiles[WebFiles Module]
    Engine --> Security[Security Module]
    FastAPI --> SQLite[(SQLite)]
    User -->|GET /api/scans/{id} polling| FastAPI
    FastAPI -->|Jinja2| Report[HTML Report]
```

---

## Technology Stack

| Component | Technology |
|---|---|
| Frontend | React 18, Vite, Tailwind CSS, Lucide React |
| Backend | Python 3.10+, FastAPI, Pydantic v2, Uvicorn |
| DNS | dnspython |
| WHOIS | python-whois |
| SSL/TLS | cryptography (stdlib ssl) |
| HTTP | requests |
| IP/Geo | ip-api.com (free), RDAP |
| Reports | Jinja2 HTML templates |
| Database | SQLite (stdlib) |
| Tests | pytest, pytest-asyncio |

---

## Installation

### Prerequisites

- Python 3.10 or newer
- Node.js 18 or newer
- Git

### Clone & Setup

```bash
git clone <repo-url>
cd web-recon-framework
```

---

## Running Locally

### Backend

**Linux/macOS:**
```bash
cd backend
python -m venv venv
source venv/bin/activate
pip install -r requirements.txt
uvicorn app.main:app --reload --host 0.0.0.0 --port 8000
```

**Windows (PowerShell):**
```powershell
cd backend
python -m venv venv
.\venv\Scripts\Activate.ps1
pip install -r requirements.txt
uvicorn app.main:app --reload --host 0.0.0.0 --port 8000
```

Backend runs at: http://localhost:8000  
API docs: http://localhost:8000/api/docs

### Frontend

```bash
cd frontend
npm install
npm run dev
```

Frontend runs at: http://localhost:5173

---

## API Endpoints

| Method | Endpoint | Description |
|---|---|---|
| `GET` | `/api/health` | Health check |
| `POST` | `/api/scans` | Start new scan |
| `GET` | `/api/scans` | List all scans |
| `GET` | `/api/scans/{id}` | Get scan status + results |
| `GET` | `/api/scans/{id}/results` | Get complete results |
| `GET` | `/api/scans/{id}/report` | Download HTML report |
| `DELETE` | `/api/scans/{id}` | Delete a scan |

### Start a Scan

```bash
curl -X POST http://localhost:8000/api/scans \
  -H "Content-Type: application/json" \
  -d '{"target": "example.com"}'
```

Response:
```json
{
  "scan_id": "abc123...",
  "status": "queued",
  "target": "example.com",
  "created_at": "2026-08-11T08:00:00"
}
```

---

## Reconnaissance Modules

| Module | Data Collected |
|---|---|
| WHOIS | Registrar, dates, nameservers, status |
| DNS | A, AAAA, MX, NS, TXT, CNAME records |
| IP | IPv4, IPv6, ASN, organization, geolocation |
| HTTP | Status, redirects, response time, headers |
| SSL/TLS | Certificate, issuer, validity, SANs, expiry |
| Web Files | robots.txt, sitemap.xml content |
| Security | Header analysis with observations |

---

## Report Generation

When a scan completes, click **HTML Report** to download a professionally formatted HTML report containing:

- Executive Summary
- WHOIS registration data
- DNS records
- IP & network information
- HTTP response details
- TLS certificate information
- robots.txt and sitemap.xml
- Security observations with recommendations
- Scan metadata and limitations

---

## Error Handling

- Each module runs independently — a failure in one **never** terminates others
- All errors are logged server-side with full stack traces
- The frontend shows human-readable error messages, never Python tracebacks
- Request timeouts are enforced on all network calls (default: 15s)
- Scans with partial failures show status `completed_with_errors`

---

## Security Considerations

- All user input is validated before use
- No shell commands are used — only Python libraries
- Private/loopback IP addresses are blocked
- Only `http://` and `https://` schemes are allowed
- Stack traces are never exposed to the API caller
- No API keys stored in frontend code
- SQLite stores only scan metadata, not secrets

---

## Running Tests

```bash
cd backend
.\venv\Scripts\Activate.ps1  # Windows
# source venv/bin/activate   # Linux/macOS
pytest tests/ -v
```

---

## Limitations

- Geolocation data is approximate (based on BGP/ASN routing, not exact)
- WHOIS data may be incomplete for privacy-protected domains
- This is passive reconnaissance — no active exploitation is performed
- Results are a point-in-time snapshot
- Rate limits may apply for ip-api.com (free tier: 45 req/min)

---

## Future Improvements

- [ ] WebSocket support for true real-time updates
- [ ] Subdomain enumeration module
- [ ] Port scanning (with user consent)
- [ ] Certificate transparency log checks
- [ ] PDF report generation
- [ ] Scheduled/recurring scans
- [ ] Multi-target batch scanning
- [ ] Team/collaboration features

---

## Project Structure

```
web-recon-framework/
├── backend/
│   ├── app/
│   │   ├── main.py              ← FastAPI app
│   │   ├── api/                 ← Route handlers
│   │   ├── core/                ← Config, exceptions
│   │   ├── recon/               ← Reconnaissance modules
│   │   ├── reports/             ← HTML report templates
│   │   ├── database/            ← SQLite operations
│   │   ├── schemas/             ← Pydantic models
│   │   └── utils/               ← Logging
│   ├── tests/                   ← pytest test suite
│   └── requirements.txt
├── frontend/
│   ├── src/
│   │   ├── pages/               ← Dashboard, Progress, Results, History
│   │   ├── components/          ← UI components
│   │   ├── services/            ← API client
│   │   └── hooks/               ← useScanPolling
│   └── package.json
└── README.md
```
