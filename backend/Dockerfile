# ── Stage 1: Builder ────────────────────────────────────────────────────────
FROM golang:1.22-alpine AS builder

RUN apk add --no-cache git ca-certificates iputils

WORKDIR /app

COPY go.mod go.sum ./
RUN go mod download

COPY . .
RUN CGO_ENABLED=0 GOOS=linux go build -ldflags="-s -w" -o /app/bin/netmon ./cmd/main.go

# ── Stage 2: Runtime ─────────────────────────────────────────────────────────
FROM alpine:3.19

RUN apk add --no-cache \
    ca-certificates \
    iputils \
    net-snmp-tools \
    tzdata

ENV TZ=Asia/Jakarta

WORKDIR /app

COPY --from=builder /app/bin/netmon .
COPY --from=builder /app/.env.example .env

EXPOSE 3000

# NET_RAW capability needed for ICMP ping
USER root

CMD ["./netmon"]
