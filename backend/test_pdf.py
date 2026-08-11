import asyncio
import os
import sys

# Add backend to path
sys.path.append(os.path.dirname(os.path.abspath(__file__)))

from app.reports.generator import generate_pdf_report

async def test():
    scan_data = {
        "scan_id": "test_123",
        "target": "example.com",
        "status": "completed",
        "duration_seconds": 1.23,
        "results": {
            "whois": {"available": True, "registrar": "Test Registrar"},
            "dns": {"total_records": 1, "A": ["127.0.0.1"]},
            "ip": {"ipv4": "127.0.0.1"},
            "http": {"status_code": 200, "final_url": "http://example.com"},
            "ssl": {"status": "UNAVAILABLE"},
            "security": {"coverage_percent": 100, "headers": []},
            "web_files": {}
        }
    }
    
    try:
        pdf_bytes = await generate_pdf_report(scan_data)
        print("Success! PDF size:", len(pdf_bytes))
    except Exception as e:
        print("Error generating PDF:", repr(e))
        import traceback
        traceback.print_exc()

if __name__ == "__main__":
    asyncio.run(test())
