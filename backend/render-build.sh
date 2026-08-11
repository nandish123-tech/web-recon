#!/usr/bin/env bash
# Exit on error
set -o errexit

# Install Python dependencies
pip install -r requirements.txt

# Install Playwright browser and system dependencies for PDF generation
playwright install chromium --with-deps
