#!/usr/bin/env bash
set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PYTHON_BIN="${PYTHON_BIN:-$SCRIPT_DIR/bin/python}"
HOST="${HOST:-0.0.0.0}"
PORT="${PORT:-8001}"

cd "$SCRIPT_DIR"
exec "$PYTHON_BIN" -m uvicorn sidecar:app --host "$HOST" --port "$PORT"
