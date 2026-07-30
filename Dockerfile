# ── Stage 1: Build Backend (Go Fiber) ──────────────────────────────────────────
FROM golang:1.22-alpine AS backend-builder

RUN apk add --no-cache git ca-certificates iputils

WORKDIR /app/backend

COPY backend/go.mod backend/go.sum ./
RUN go mod download

COPY backend .
RUN CGO_ENABLED=0 GOOS=linux go build -ldflags="-s -w" -o /app/bin/netmon ./main.go

# ── Stage 2: Runtime Image ───────────────────────────────────────────────────
FROM alpine:3.19

RUN apk add --no-cache \
    ca-certificates \
    iputils \
    net-snmp-tools \
    tzdata

ENV TZ=Asia/Jakarta
ENV PUBLIC_DIR=/app/public

WORKDIR /app

COPY --from=backend-builder /app/bin/netmon .
COPY --from=backend-builder /app/backend/.env.example .env
COPY backend/public /app/public

EXPOSE 3535

USER root

CMD ["./netmon"]
