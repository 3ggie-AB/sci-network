#!/usr/bin/env python3
"""
Train Isolation Forest dari data ClickHouse SCINetwork.

Install dependency:
    pip install clickhouse-connect pandas scikit-learn joblib

Contoh jalan:
    python main.py --days 7 --limit 50000 --output output/anomalies.csv

Env ClickHouse:
    CLICKHOUSE_HOST=localhost
    CLICKHOUSE_HTTP_PORT=8123
    CLICKHOUSE_USER=default
    CLICKHOUSE_PASSWORD=
    CLICKHOUSE_DBNAME=netmon
"""

from __future__ import annotations

import argparse
import os
import re
import sys
from dataclasses import dataclass
from pathlib import Path
from typing import Any


NUMERIC_FEATURES = [
    "success",
    "duration",
    "latency",
    "packet_loss",
    "jitter",
    "response_time",
    "cpu",
    "memory",
    "bandwidth_in",
    "bandwidth_out",
    "http_status_code",
    "is_timeout",
    "is_error_http",
    "latency_missing",
    "is_http",
    "is_ping",
    "timeout_flag",
    "hour_of_day",
    "day_of_week",
]

CATEGORICAL_FEATURES = [
    "action",
    "status",
]

OUTPUT_COLUMNS = [
    "created_at",
    "id",
    "user_id",
    "device_id",
    "action",
    "target",
    "status",
    "success",
    "duration",
    "latency",
    "packet_loss",
    "jitter",
    "response_time",
    "cpu",
    "memory",
    "bandwidth_in",
    "bandwidth_out",
    "status_code",
    "http_status_code",
    "is_timeout",
    "is_error_http",
    "latency_missing",
    "is_http",
    "is_ping",
    "timeout_flag",
    "anomaly_score",
    "is_anomaly",
]


@dataclass(frozen=True)
class ClickHouseConfig:
    host: str
    port: int
    username: str
    password: str
    database: str
    secure: bool


def import_dependencies() -> dict[str, Any]:
    try:
        import joblib
        import pandas as pd
        from clickhouse_connect import get_client
        from sklearn.compose import ColumnTransformer
        from sklearn.ensemble import IsolationForest
        from sklearn.impute import SimpleImputer
        from sklearn.pipeline import Pipeline
        from sklearn.preprocessing import OneHotEncoder, StandardScaler
    except ImportError as exc:
        print(
            "Dependency belum lengkap. Install dulu:\n"
            "  pip install clickhouse-connect pandas scikit-learn joblib\n\n"
            f"Detail error: {exc}",
            file=sys.stderr,
        )
        raise SystemExit(1) from exc

    return {
        "joblib": joblib,
        "pd": pd,
        "get_client": get_client,
        "ColumnTransformer": ColumnTransformer,
        "IsolationForest": IsolationForest,
        "SimpleImputer": SimpleImputer,
        "Pipeline": Pipeline,
        "OneHotEncoder": OneHotEncoder,
        "StandardScaler": StandardScaler,
    }


def parse_args() -> argparse.Namespace:
    parser = argparse.ArgumentParser(
        description="Train Isolation Forest untuk deteksi anomali network_logs dari ClickHouse."
    )
    parser.add_argument("--days", type=positive_int, default=30, help="Ambil data N hari terakhir.")
    parser.add_argument("--limit", type=positive_int, default=100_000, help="Maksimal row dari ClickHouse.")
    parser.add_argument("--user-id", default="", help="Filter user_id.")
    parser.add_argument("--device-id", default="", help="Filter device_id.")
    parser.add_argument("--action", choices=["ping", "snmp", "http", "interface"], help="Filter action.")
    parser.add_argument(
        "--contamination",
        type=contamination_value,
        default=0.05,
        help="Perkiraan rasio anomali. Pakai float 0-0.5 atau 'auto'.",
    )
    parser.add_argument("--estimators", type=positive_int, default=200, help="Jumlah tree Isolation Forest.")
    parser.add_argument("--random-state", type=int, default=42, help="Seed model.")
    parser.add_argument(
        "--output",
        default="output/anomalies.csv",
        help="Path output CSV/JSON/JSONL untuk hasil anomali.",
    )
    parser.add_argument(
        "--all-output",
        default="",
        help="Opsional: simpan semua hasil scoring, bukan hanya anomali.",
    )
    parser.add_argument(
        "--model-output",
        default="output/isolation_forest.joblib",
        help="Path model joblib saat --save-model aktif.",
    )
    parser.add_argument("--save-model", action="store_true", help="Simpan pipeline model ke file joblib.")
    parser.add_argument("--top", type=positive_int, default=10, help="Jumlah anomali teratas yang ditampilkan.")
    return parser.parse_args()


def positive_int(value: str) -> int:
    parsed = int(value)
    if parsed <= 0:
        raise argparse.ArgumentTypeError("harus lebih besar dari 0")
    return parsed


def contamination_value(value: str) -> str | float:
    if value == "auto":
        return value
    parsed = float(value)
    if parsed <= 0 or parsed > 0.5:
        raise argparse.ArgumentTypeError("harus 'auto' atau angka > 0 sampai 0.5")
    return parsed


def load_clickhouse_config() -> ClickHouseConfig:
    return ClickHouseConfig(
        host=os.getenv("CLICKHOUSE_HOST", "localhost"),
        port=int(os.getenv("CLICKHOUSE_HTTP_PORT", "8123")),
        username=os.getenv("CLICKHOUSE_USER", "default"),
        password=os.getenv("CLICKHOUSE_PASSWORD", ""),
        database=os.getenv("CLICKHOUSE_DBNAME", "netmon"),
        secure=os.getenv("CLICKHOUSE_SECURE", "false").lower() in {"1", "true", "yes"},
    )


def quote_identifier(name: str) -> str:
    if not re.fullmatch(r"[A-Za-z_][A-Za-z0-9_]*", name):
        raise ValueError(f"Nama database/tabel tidak valid: {name!r}")
    return f"`{name}`"


def sql_string(value: str) -> str:
    return "'" + value.replace("\\", "\\\\").replace("'", "\\'") + "'"


def build_query(config: ClickHouseConfig, args: argparse.Namespace) -> str:
    table = f"{quote_identifier(config.database)}.`network_logs`"
    filters = [f"created_at >= now() - INTERVAL {args.days} DAY"]

    if args.user_id:
        filters.append(f"user_id = {sql_string(args.user_id)}")
    if args.device_id:
        filters.append(f"device_id = {sql_string(args.device_id)}")
    if args.action:
        filters.append(f"action = {sql_string(args.action)}")

    where_sql = " AND ".join(filters)
    return f"""
        SELECT
            id,
            user_id,
            device_id,
            action,
            target,
            toUInt8(success) AS success,
            duration,
            latency,
            packet_loss,
            jitter,
            response_time,
            status,
            cpu,
            memory,
            bandwidth_in,
            bandwidth_out,
            JSONExtractInt(result, 'status_code') AS status_code,
            created_at
        FROM {table}
        WHERE {where_sql}
        ORDER BY created_at DESC
        LIMIT {args.limit}
    """


def fetch_network_logs(config: ClickHouseConfig, args: argparse.Namespace, deps: dict[str, Any]) -> Any:
    client = deps["get_client"](
        host=config.host,
        port=config.port,
        username=config.username,
        password=config.password,
        database=config.database,
        secure=config.secure,
    )
    return client.query_df(build_query(config, args))


def prepare_dataframe(df: Any, deps: dict[str, Any]) -> Any:
    pd = deps["pd"]
    df = df.copy()

    df["created_at"] = pd.to_datetime(df["created_at"], errors="coerce")
    df["hour_of_day"] = df["created_at"].dt.hour.fillna(0).astype(int)
    df["day_of_week"] = df["created_at"].dt.dayofweek.fillna(0).astype(int)

    for column in CATEGORICAL_FEATURES:
        if column not in df.columns:
            df[column] = "unknown"
        df[column] = df[column].fillna("unknown").astype(str)

    if "status_code" not in df.columns:
        df["status_code"] = df.get("http_status_code", 0)
    df["status_code"] = pd.to_numeric(df["status_code"], errors="coerce").fillna(0)
    df["http_status_code"] = df["status_code"]

    if "duration" not in df.columns:
        df["duration"] = 0
    df["duration"] = pd.to_numeric(df["duration"], errors="coerce").fillna(0)

    if "latency" not in df.columns:
        df["latency"] = float("nan")
    df["latency"] = pd.to_numeric(df["latency"], errors="coerce")
    df["latency_missing"] = (df["latency"].isna() | (df["latency"] == 0)).astype(int)
    df.loc[df["latency_missing"] == 1, "latency"] = float("nan")

    df["is_http"] = (df["action"] == "http").astype(int)
    df["is_ping"] = (df["action"] == "ping").astype(int)
    df["is_timeout"] = ((df["is_http"] == 1) & (df["status_code"] == 0)).astype(int)
    df["is_error_http"] = ((df["is_http"] == 1) & (df["http_status_code"] >= 400)).astype(int)
    df["timeout_flag"] = (df["duration"] >= 10000).astype(int)

    for column in NUMERIC_FEATURES:
        if column not in df.columns:
            df[column] = 0
        df[column] = pd.to_numeric(df[column], errors="coerce")
        if column != "latency":
            df[column] = df[column].fillna(0)

    return df


def build_model(args: argparse.Namespace, deps: dict[str, Any]) -> Any:
    ColumnTransformer = deps["ColumnTransformer"]
    IsolationForest = deps["IsolationForest"]
    OneHotEncoder = deps["OneHotEncoder"]
    Pipeline = deps["Pipeline"]
    SimpleImputer = deps["SimpleImputer"]
    StandardScaler = deps["StandardScaler"]

    numeric_pipeline = Pipeline(
        steps=[
            ("imputer", SimpleImputer(strategy="median", keep_empty_features=True)),
            ("scaler", StandardScaler()),
        ]
    )
    categorical_pipeline = Pipeline(
        steps=[
            ("imputer", SimpleImputer(strategy="most_frequent")),
            ("onehot", OneHotEncoder(handle_unknown="ignore")),
        ]
    )
    preprocess = ColumnTransformer(
        transformers=[
            ("num", numeric_pipeline, NUMERIC_FEATURES),
            ("cat", categorical_pipeline, CATEGORICAL_FEATURES),
        ]
    )
    detector = IsolationForest(
        n_estimators=args.estimators,
        contamination=args.contamination,
        random_state=args.random_state,
        n_jobs=-1,
    )

    return Pipeline(
        steps=[
            ("preprocess", preprocess),
            ("detector", detector),
        ]
    )


def train_and_score(df: Any, args: argparse.Namespace, deps: dict[str, Any]) -> tuple[Any, Any]:
    model = build_model(args, deps)
    features = df[NUMERIC_FEATURES + CATEGORICAL_FEATURES]

    model.fit(features)
    predictions = model.predict(features)
    decision_scores = model.decision_function(features)

    scored = df.copy()
    scored["anomaly_score"] = -decision_scores
    scored["is_anomaly"] = predictions == -1
    scored = scored.sort_values(["is_anomaly", "anomaly_score"], ascending=[False, False])
    return model, scored


def write_dataframe(df: Any, output: str) -> None:
    path = Path(output)
    if not path.is_absolute():
        path = Path(__file__).resolve().parent / path
    path.parent.mkdir(parents=True, exist_ok=True)

    columns = [column for column in OUTPUT_COLUMNS if column in df.columns]
    serializable = df[columns].copy()

    suffix = path.suffix.lower()
    if suffix == ".json":
        serializable.to_json(path, orient="records", indent=2, date_format="iso")
    elif suffix == ".jsonl":
        serializable.to_json(path, orient="records", lines=True, date_format="iso")
    else:
        serializable.to_csv(path, index=False)

    print(f"Output tersimpan: {path}")


def save_model(model: Any, output: str, deps: dict[str, Any]) -> None:
    path = Path(output)
    if not path.is_absolute():
        path = Path(__file__).resolve().parent / path
    path.parent.mkdir(parents=True, exist_ok=True)
    deps["joblib"].dump(model, path)
    print(f"Model tersimpan: {path}")


def print_summary(scored: Any, top: int) -> None:
    total_rows = len(scored)
    anomaly_rows = int(scored["is_anomaly"].sum())
    ratio = (anomaly_rows / total_rows * 100) if total_rows else 0
    print(f"Rows dianalisis: {total_rows}")
    print(f"Anomali: {anomaly_rows} ({ratio:.2f}%)")

    top_rows = scored[scored["is_anomaly"]].head(top)
    if top_rows.empty:
        print("Tidak ada anomali terdeteksi.")
        return

    print("\nTop anomali:")
    preview_columns = [
        "created_at",
        "action",
        "target",
        "status",
        "duration",
        "latency",
        "packet_loss",
        "jitter",
        "response_time",
        "status_code",
        "is_timeout",
        "is_error_http",
        "latency_missing",
        "timeout_flag",
        "anomaly_score",
    ]
    print(top_rows[[column for column in preview_columns if column in top_rows.columns]].to_string(index=False))


def main() -> int:
    args = parse_args()
    deps = import_dependencies()
    config = load_clickhouse_config()

    print(
        "Ambil data ClickHouse "
        f"{config.host}:{config.port}/{config.database} "
        f"({args.days} hari terakhir, limit {args.limit})"
    )

    df = fetch_network_logs(config, args, deps)
    if df.empty:
        print("Data network_logs kosong untuk filter ini.", file=sys.stderr)
        return 1

    prepared = prepare_dataframe(df, deps)
    model, scored = train_and_score(prepared, args, deps)
    anomalies = scored[scored["is_anomaly"]]

    write_dataframe(anomalies, args.output)
    if args.all_output:
        write_dataframe(scored, args.all_output)
    if args.save_model:
        save_model(model, args.model_output, deps)

    print_summary(scored, args.top)
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
