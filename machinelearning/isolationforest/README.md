# Isolation Forest ML Sidecar

Dokumentasi ini menjelaskan alur machine learning SCINetwork untuk deteksi anomali dari data `network_logs` ClickHouse.

## Arsitektur

Python dipakai untuk training dan inference model ML. Go tetap menjadi real-time monitoring engine.

Alur:

1. Go collector menjalankan ping, HTTP, SNMP, dan interface check.
2. Go menyimpan log monitoring ke ClickHouse.
3. Python trainer membaca data historis dari ClickHouse.
4. Python melakukan feature engineering, scaling, encoding, dan training Isolation Forest.
5. Trainer export model harian ke folder `models`.
6. Python sidecar load model terbaru.
7. Go POST metric real-time ke sidecar untuk scoring anomali.
8. Go membuat alert jika sidecar mengembalikan `is_anomaly=true`.

## File Penting

| File | Fungsi |
| --- | --- |
| `main.py` | Trainer Isolation Forest dari ClickHouse |
| `train_daily.sh` | Runner training harian untuk cron/systemd |
| `sidecar.py` | FastAPI inference service |
| `serve.sh` | Runner sidecar lokal |
| `Dockerfile` | Image sidecar untuk Docker Compose |
| `requirements.txt` | Dependency Python |
| `models/` | Output model harian, di-ignore dari git |
| `output/` | Output anomali CSV/JSON, di-ignore dari git |

## Install Dependency

Gunakan venv lokal folder ini:

```bash
machinelearning/isolationforest/bin/python -m pip install -r machinelearning/isolationforest/requirements.txt
```

Atau dari folder ini:

```bash
python -m pip install -r requirements.txt
```

## Environment

Trainer membaca konfigurasi ClickHouse dari environment:

```bash
CLICKHOUSE_HOST=localhost
CLICKHOUSE_HTTP_PORT=8123
CLICKHOUSE_USER=default
CLICKHOUSE_PASSWORD=
CLICKHOUSE_DBNAME=netmon
CLICKHOUSE_SECURE=false
```

Sidecar membaca model dari:

```bash
MODEL_PATH=models/latest
MODEL_FALLBACK_PATH=models/model_latest.joblib
MODEL_METADATA_PATH=models/model_latest.json
HOST=0.0.0.0
PORT=8001
```

## Training Manual

Contoh training 30 hari terakhir:

```bash
machinelearning/isolationforest/bin/python machinelearning/isolationforest/main.py \
  --days 30 \
  --limit 100000 \
  --output output/anomalies.csv \
  --top 10
```

Secara default, trainer akan export model harian.

Output model:

```text
models/model_YYYY-MM-DD.joblib
models/model_YYYY-MM-DD.json
models/model_latest.joblib
models/model_latest.json
models/latest -> model_YYYY-MM-DD.joblib
```

Model `.joblib` berisi full sklearn pipeline:

- numeric imputer
- scaler
- categorical imputer
- one-hot encoder
- Isolation Forest detector

## Training Harian

Runner:

```bash
./machinelearning/isolationforest/train_daily.sh
```

Override parameter:

```bash
DAYS=14 LIMIT=50000 TOP=20 ./machinelearning/isolationforest/train_daily.sh
```

Contoh cron tiap jam 00:00:

```cron
0 0 * * * /run/media/egiahmadbaihaqi/ROC116/sci-network/machinelearning/isolationforest/train_daily.sh
```

## Feature Engineering

Fitur numerik:

```text
success
duration
latency
packet_loss
jitter
response_time
cpu
memory
bandwidth_in
bandwidth_out
http_status_code
is_timeout
is_error_http
latency_missing
is_http
is_ping
timeout_flag
hour_of_day
day_of_week
```

Fitur kategori:

```text
action
status
```

Catatan penting:

- `latency == 0` dianggap missing, lalu diubah menjadi `NaN`.
- `latency_missing=1` memberi tahu model bahwa latency tidak tersedia.
- HTTP timeout ditandai lewat `is_timeout=1` jika `action=http` dan `status_code=0`.
- HTTP error ditandai lewat `is_error_http=1` jika `action=http` dan status code `>=400`.
- Timeout umum ditandai lewat `timeout_flag=1` jika `duration >= 10000`.
- `is_http` dan `is_ping` membantu model membedakan tipe probe.

## Menjalankan Sidecar Lokal

Pastikan model sudah ada di `models/`, lalu jalankan:

```bash
./machinelearning/isolationforest/serve.sh
```

Health check:

```bash
curl http://localhost:8001/health
```

Info model:

```bash
curl http://localhost:8001/model
```

## Endpoint Inference

### POST `/score`

Request:

```bash
curl -X POST http://localhost:8001/score \
  -H 'Content-Type: application/json' \
  -d '{
    "action": "http",
    "status": "critical",
    "success": false,
    "duration": 10000,
    "response_time": 10000,
    "status_code": 0
  }'
```

Response:

```json
{
  "is_anomaly": true,
  "prediction": -1,
  "anomaly_score": 0.11549305337561189,
  "decision_score": -0.11549305337561189,
  "model_path": ".../models/model_2026-06-01.joblib",
  "model_loaded_at": "2026-06-01T06:52:11.767658+00:00",
  "features": {
    "success": 0,
    "duration": 10000,
    "latency": null,
    "packet_loss": 0,
    "jitter": 0,
    "response_time": 10000,
    "http_status_code": 0,
    "is_timeout": 1,
    "is_http": 1,
    "timeout_flag": 1,
    "action": "http",
    "status": "critical"
  }
}
```

### POST `/score/batch`

Request:

```bash
curl -X POST http://localhost:8001/score/batch \
  -H 'Content-Type: application/json' \
  -d '{
    "items": [
      {
        "action": "ping",
        "status": "up",
        "success": true,
        "duration": 30,
        "latency": 20,
        "packet_loss": 0,
        "jitter": 1
      },
      {
        "action": "http",
        "status": "critical",
        "success": false,
        "duration": 10000,
        "response_time": 10000,
        "status_code": 0
      }
    ]
  }'
```

Response shape:

```json
{
  "items": [
    {
      "is_anomaly": false,
      "prediction": 1,
      "anomaly_score": -0.09684875387094072
    },
    {
      "is_anomaly": true,
      "prediction": -1,
      "anomaly_score": 0.11549305337561189
    }
  ]
}
```

## Docker Compose

`backend/docker-compose.yml` sudah punya service:

```yaml
ml-sidecar:
  build:
    context: ../machinelearning/isolationforest
    dockerfile: Dockerfile
  environment:
    MODEL_PATH: /app/models/latest
    MODEL_FALLBACK_PATH: /app/models/model_latest.joblib
    MODEL_METADATA_PATH: /app/models/model_latest.json
  ports:
    - "8001:8001"
  volumes:
    - ../machinelearning/isolationforest/models:/app/models:ro
```

Jalankan:

```bash
docker compose -f backend/docker-compose.yml up -d ml-sidecar
```

App Go mendapatkan URL sidecar dari env:

```bash
ANOMALY_SIDECAR_URL=http://ml-sidecar:8001
```

## Integrasi Go

Go tidak load `.joblib` secara native. Go cukup melakukan HTTP call ke sidecar.

Payload minimal untuk HTTP check:

```json
{
  "action": "http",
  "status": "up",
  "success": true,
  "duration": 230,
  "response_time": 230,
  "status_code": 200
}
```

Payload minimal untuk ping:

```json
{
  "action": "ping",
  "status": "up",
  "success": true,
  "duration": 30,
  "latency": 20,
  "packet_loss": 0,
  "jitter": 1
}
```

Rule alert yang disarankan:

- Jika sidecar error atau timeout, jangan gagalkan monitoring utama.
- Jika `is_anomaly=true`, buat alert metric `ml_anomaly`.
- Gunakan `anomaly_score` sebagai `actual_value`.
- Resolve alert jika beberapa check berikutnya sudah `is_anomaly=false`.

## Operasional

Urutan deploy yang aman:

1. Jalankan trainer minimal sekali sampai folder `models/` berisi model.
2. Start sidecar.
3. Cek `GET /health`.
4. Baru aktifkan Go integration ke `ANOMALY_SIDECAR_URL`.

Jika model baru diexport, sidecar akan reload otomatis saat file target berubah.
