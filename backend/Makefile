.PHONY: run build tidy migrate-mysql migrate-ch seed docker-up docker-down

# ── Config ──────────────────────────────────────────────────────────────────────
APP_NAME  = netmon
BUILD_DIR = ./bin

# ── Dev ─────────────────────────────────────────────────────────────────────────
run:
	@echo "▶ Running $(APP_NAME)..."
	@go run .

build:
	@echo "▶ Building $(APP_NAME)..."
	@go build -ldflags="-s -w" -o $(BUILD_DIR)/$(APP_NAME) .
	@echo "✓ Build selesai: $(BUILD_DIR)/$(APP_NAME)"

tidy:
	@go mod tidy

# ── Database ─────────────────────────────────────────────────────────────────────
migrate-mysql:
	@echo "▶ Running MySQL migration..."
	@mysql -h$(MYSQL_HOST) -u$(MYSQL_USER) -p$(MYSQL_PASSWORD) < migrations/mysql.sql
	@echo "✓ MySQL migration selesai"

migrate-ch:
	@echo "▶ Running ClickHouse migration..."
	@clickhouse-client --host=$(CLICKHOUSE_HOST) --multiquery --query="$$(cat migrations/clickhouse.sql)"
	@echo "✓ ClickHouse migration selesai"

# ── Docker ───────────────────────────────────────────────────────────────────────
docker-up:
	@docker-compose up -d

docker-down:
	@docker-compose down

# ── Lint & Test ──────────────────────────────────────────────────────────────────
lint:
	@golangci-lint run ./...

test:
	@go test -v ./...

# ── Help ─────────────────────────────────────────────────────────────────────────
help:
	@echo "Perintah yang tersedia:"
	@echo "  make run           - Jalankan server"
	@echo "  make build         - Build binary"
	@echo "  make tidy          - go mod tidy"
	@echo "  make migrate-mysql - Jalankan migrasi MySQL"
	@echo "  make migrate-ch    - Jalankan migrasi ClickHouse"
	@echo "  make docker-up     - Start Docker services"
	@echo "  make docker-down   - Stop Docker services"
