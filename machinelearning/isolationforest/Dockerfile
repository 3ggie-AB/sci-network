FROM python:3.11-slim

WORKDIR /app

ENV PYTHONDONTWRITEBYTECODE=1 \
    PYTHONUNBUFFERED=1 \
    MODEL_PATH=/app/models/latest \
    MODEL_FALLBACK_PATH=/app/models/model_latest.joblib \
    MODEL_METADATA_PATH=/app/models/model_latest.json

COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

COPY main.py sidecar.py train_daily.sh serve.sh ./

EXPOSE 8001

CMD ["uvicorn", "sidecar:app", "--host", "0.0.0.0", "--port", "8001"]
