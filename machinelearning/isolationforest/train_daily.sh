#!/usr/bin/env bash
set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PYTHON_BIN="${PYTHON_BIN:-$SCRIPT_DIR/bin/python}"

"$PYTHON_BIN" "$SCRIPT_DIR/main.py" \
  --days "${DAYS:-30}" \
  --limit "${LIMIT:-100000}" \
  --output "${OUTPUT:-output/anomalies.csv}" \
  --models-dir "${MODELS_DIR:-models}" \
  --top "${TOP:-10}"
