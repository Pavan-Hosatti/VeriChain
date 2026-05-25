#!/usr/bin/env bash
set -euo pipefail

# Set GEMINI_API_KEY in your environment before running.
# This script intentionally does NOT hardcode secrets.

if [ -z "${GEMINI_API_KEY:-}" ]; then
  echo "[WARN] GEMINI_API_KEY is not set; Gemini Vision layer will be skipped."
fi

if [ -d "venv" ]; then
  # shellcheck disable=SC1091
  source venv/bin/activate
fi

uvicorn main:app --port 8000 --host 0.0.0.0
