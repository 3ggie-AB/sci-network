#!/usr/bin/env python3
"""
HTTP sidecar untuk real-time inference Isolation Forest.

Endpoint:
    GET  /health
    GET  /model
    POST /score
    POST /score/batch

Contoh:
    curl -X POST http://localhost:8001/score \
      -H 'Content-Type: application/json' \
      -d '{"action":"http","status":"up","success":true,"duration":230,"status_code":200}'
"""

from __future__ import annotations

import os
import threading
from datetime import datetime, timezone
from pathlib import Path
from typing import Any

import joblib
import pandas as pd
from fastapi import Body, FastAPI, HTTPException
from fastapi.responses import JSONResponse

from main import CATEGORICAL_FEATURES, NUMERIC_FEATURES, prepare_dataframe, resolve_path


DEFAULT_MODEL_PATH = "models/latest"
DEFAULT_MODEL_FALLBACK = "models/model_latest.joblib"
DEFAULT_METADATA_PATH = "models/model_latest.json"


def env_int(name: str, default: int) -> int:
    raw = os.getenv(name, "")
    if not raw:
        return default
    try:
        return int(raw)
    except ValueError:
        return default


def resolve_model_path() -> Path:
    configured = resolve_path(os.getenv("MODEL_PATH", DEFAULT_MODEL_PATH))
    if configured.exists():
        return configured

    fallback = resolve_path(os.getenv("MODEL_FALLBACK_PATH", DEFAULT_MODEL_FALLBACK))
    if fallback.exists():
        return fallback

    return configured


def model_fingerprint(path: Path) -> tuple[str, int, int]:
    resolved = path.resolve()
    stat = resolved.stat()
    return str(resolved), stat.st_mtime_ns, stat.st_size


def normalize_record(record: dict[str, Any]) -> dict[str, Any]:
    now = datetime.now(timezone.utc).isoformat()
    normalized = dict(record)

    normalized.setdefault("created_at", now)
    normalized.setdefault("action", "unknown")
    normalized.setdefault("status", "unknown")
    normalized.setdefault("success", 0)
    normalized.setdefault("duration", 0)
    normalized.setdefault("latency", 0)
    normalized.setdefault("packet_loss", 0)
    normalized.setdefault("jitter", 0)
    normalized.setdefault("response_time", normalized.get("duration", 0))
    normalized.setdefault("cpu", 0)
    normalized.setdefault("memory", 0)
    normalized.setdefault("bandwidth_in", 0)
    normalized.setdefault("bandwidth_out", 0)

    if "status_code" not in normalized:
        normalized["status_code"] = normalized.get("http_status_code", 0)
    if "http_status_code" not in normalized:
        normalized["http_status_code"] = normalized.get("status_code", 0)

    if isinstance(normalized.get("success"), bool):
        normalized["success"] = int(normalized["success"])

    return normalized


def to_native(value: Any) -> Any:
    if hasattr(value, "item"):
        return value.item()
    if pd.isna(value):
        return None
    return value


class ModelStore:
    def __init__(self) -> None:
        self.model: Any | None = None
        self.path: Path | None = None
        self.fingerprint: tuple[str, int, int] | None = None
        self.loaded_at: str | None = None
        self.lock = threading.Lock()

    def ensure_loaded(self) -> Any:
        path = resolve_model_path()
        if not path.exists():
            raise FileNotFoundError(f"model tidak ditemukan: {path}")

        fingerprint = model_fingerprint(path)
        if self.model is not None and fingerprint == self.fingerprint:
            return self.model

        with self.lock:
            fingerprint = model_fingerprint(path)
            if self.model is not None and fingerprint == self.fingerprint:
                return self.model

            self.model = joblib.load(path)
            self.path = path.resolve()
            self.fingerprint = fingerprint
            self.loaded_at = datetime.now(timezone.utc).isoformat()
            return self.model

    def metadata(self) -> dict[str, Any]:
        return {
            "model_path": str(self.path) if self.path else None,
            "loaded_at": self.loaded_at,
            "fingerprint": self.fingerprint,
        }


store = ModelStore()
app = FastAPI(title="SCINetwork ML Sidecar", version="1.0.0")


@app.get("/health")
def health() -> JSONResponse:
    try:
        store.ensure_loaded()
        return JSONResponse({"ok": True, **store.metadata()})
    except Exception as exc:
        return JSONResponse({"ok": False, "error": str(exc)}, status_code=503)


@app.get("/model")
def model_info() -> dict[str, Any]:
    try:
        store.ensure_loaded()
    except Exception as exc:
        raise HTTPException(status_code=503, detail=str(exc)) from exc

    metadata_path = resolve_path(os.getenv("MODEL_METADATA_PATH", DEFAULT_METADATA_PATH))
    response = store.metadata()
    response["features"] = {
        "numeric": NUMERIC_FEATURES,
        "categorical": CATEGORICAL_FEATURES,
    }
    response["metadata_path"] = str(metadata_path) if metadata_path.exists() else None
    return response


@app.post("/score")
def score(payload: dict[str, Any]) -> dict[str, Any]:
    results = score_records([payload])
    return results[0]


@app.post("/score/batch")
def score_batch(payload: Any = Body(...)) -> dict[str, Any]:
    if isinstance(payload, dict):
        records = payload.get("items") or payload.get("records")
    else:
        records = payload

    if not isinstance(records, list):
        raise HTTPException(status_code=400, detail="payload harus list atau object dengan key items/records")

    return {"items": score_records(records)}


def score_records(records: list[dict[str, Any]]) -> list[dict[str, Any]]:
    if not records:
        return []
    if not all(isinstance(record, dict) for record in records):
        raise HTTPException(status_code=400, detail="setiap record harus object JSON")

    try:
        model = store.ensure_loaded()
    except Exception as exc:
        raise HTTPException(status_code=503, detail=str(exc)) from exc

    normalized = [normalize_record(record) for record in records]
    prepared = prepare_dataframe(pd.DataFrame(normalized), {"pd": pd})
    features = prepared[NUMERIC_FEATURES + CATEGORICAL_FEATURES]

    predictions = model.predict(features)
    decision_scores = model.decision_function(features)

    results: list[dict[str, Any]] = []
    for index, record in enumerate(normalized):
        anomaly_score = float(-decision_scores[index])
        prediction = int(predictions[index])
        results.append(
            {
                "is_anomaly": prediction == -1,
                "prediction": prediction,
                "anomaly_score": anomaly_score,
                "decision_score": float(decision_scores[index]),
                "model_path": str(store.path) if store.path else None,
                "model_loaded_at": store.loaded_at,
                "features": {
                    column: to_native(prepared.iloc[index][column])
                    for column in NUMERIC_FEATURES + CATEGORICAL_FEATURES
                    if column in prepared.columns
                },
                "input": record,
            }
        )

    return results


if __name__ == "__main__":
    import uvicorn

    uvicorn.run(
        "sidecar:app",
        host=os.getenv("HOST", "0.0.0.0"),
        port=env_int("PORT", 8001),
        reload=False,
    )
