#!/usr/bin/env bash
# Exit on error
set -o errexit

# Install Python dependencies
pip install -r requirements.txt

# Store Playwright browsers locally so Render caches them properly
export PLAYWRIGHT_BROWSERS_PATH=0

# Install Playwright browser (without --with-deps because Render blocks root access)
playwright install chromium
