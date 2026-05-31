# SCINetwork - Network Monitoring API

Sistem monitoring jaringan berbasis Go dengan fitur scheduler monitoring, device management, alerting, Ping/ICMP, SNMP, HTTP GET checker, manajemen user RBAC, dan umpan balik/keluhan.

## 🏗️ Tech Stack

| Komponen   | Teknologi                          |
|------------|-------------------------------------|
| Framework  | Go Fiber v2                         |
| DB Utama   | MySQL 8.0 (user, feedback)          |
| DB Analitik| ClickHouse (log jaringan)           |
| Auth       | JWT (HS256, expire 24 jam)          |
| Monitoring | Scheduler + ICMP Ping + SNMP v1/v2c/v3 + HTTP GET |

---

## 👥 Role & Permission

| Permission          | Admin | Atasan | Teknisi | Staff | Karyawan |
|---------------------|:-----:|:------:|:-------:|:-----:|:--------:|
| ping:execute        | ✅    | ✅     | ✅      | ❌    | ❌       |
| snmp:execute        | ✅    | ✅     | ✅      | ❌    | ❌       |
| http:execute        | ✅    | ✅     | ✅      | ❌    | ❌       |
| device:read         | ✅    | ✅     | ✅      | ❌    | ❌       |
| device:manage       | ✅    | ❌     | ✅      | ❌    | ❌       |
| alert:read          | ✅    | ✅     | ✅      | ❌    | ❌       |
| alert:manage        | ✅    | ✅     | ❌      | ❌    | ❌       |
| log:manage          | ✅    | ❌     | ❌      | ❌    | ❌       |
| user:create         | ✅    | ❌     | ❌      | ❌    | ❌       |
| user:read           | ✅    | ✅     | ❌      | ❌    | ❌       |
| user:update         | ✅    | ❌     | ❌      | ❌    | ❌       |
| user:delete         | ✅    | ❌     | ❌      | ❌    | ❌       |
| feedback:create     | ✅    | ✅     | ✅      | ✅    | ✅       |
| feedback:read       | ✅    | ✅     | ✅      | ✅    | ❌*      |
| feedback:manage     | ✅    | ✅     | ❌      | ❌    | ❌       |
| report:read         | ✅    | ✅     | ❌      | ❌    | ❌       |

*Karyawan hanya bisa lihat feedback miliknya sendiri

---

## 🚀 Cara Menjalankan

### 1. Prasyarat

```bash
# Install Go 1.22+
# Install MySQL 8.0
# Install ClickHouse
```

### 2. Clone & Konfigurasi

```bash
git clone https://github.com/yourorg/netmon
cd netmon
cp .env.example .env
# Edit .env sesuai kebutuhan
```

### 3. Jalankan dengan Docker (Direkomendasikan)

```bash
docker-compose up -d
```

### 4. Atau Jalankan Manual

```bash
# Setup database
make migrate-mysql
make migrate-ch

# Install dependencies
go mod tidy

# Jalankan server
make run
```

---

## 📡 API Endpoints

### Auth

```http
POST /api/auth/login
Content-Type: application/json

{
  "username": "admin",
  "password": "Admin@123!"
}

POST /api/auth/register
{
  "username": "budi",
  "email": "budi@company.com",
  "password": "password123",
  "full_name": "Budi Santoso"
}

GET /api/auth/me
Authorization: Bearer <token>
```

### User Management (Admin Only)

```http
GET    /api/users?page=1&limit=20&role=teknisi
GET    /api/users/:id
POST   /api/users
PUT    /api/users/:id
DELETE /api/users/:id
GET    /api/users/roles
```

### Feedback / Keluhan

```http
POST /api/feedbacks
{
  "title": "Koneksi internet lambat di lantai 3",
  "description": "Sejak pagi koneksi sangat lambat, download max 1Mbps",
  "category": "network",   # network | hardware | software | other
  "priority": 2            # 1=low, 2=medium, 3=high
}

GET  /api/feedbacks?page=1&status=open&category=network
GET  /api/feedbacks/:id
PUT  /api/feedbacks/:id
{
  "status": "in_progress",
  "assigned_to": "<user_id_teknisi>",
  "response": "Sedang diperiksa, ditemukan masalah pada switch"
}
DELETE /api/feedbacks/:id
```

### Device Management / Monitor Target

```http
GET    /api/devices?page=1&type=mikrotik&monitor_enabled=true
GET    /api/devices/:id
POST   /api/devices
PUT    /api/devices/:id
DELETE /api/devices/:id

POST /api/devices
{
  "name": "Router Utama",
  "host": "192.168.1.1",
  "type": "mikrotik",
  "snmp_version": "v2c",
  "monitor_enabled": true,
  "ping_enabled": true,
  "snmp_enabled": true,
  "ping_interval_seconds": 60,
  "snmp_interval_seconds": 300,
  "http_interval_seconds": 120,
  "packet_loss_critical": 20
}
```

### Alerting

```http
GET  /api/alerts?status=open&severity=critical
GET  /api/alerts/:id
POST /api/alerts/:id/ack
POST /api/alerts/:id/resolve
PUT  /api/alerts/:id/notes
DELETE /api/alerts/:id
```

Alert dibuat otomatis oleh scheduler saat threshold seperti `packet_loss`, `latency`, `response_time`, atau availability melewati batas device. Notifikasi Telegram, email, atau webhook/WhatsApp aktif jika env terkait diisi.

### Network Tools

```http
# Ping
POST /api/network/ping
{
  "host": "8.8.8.8",
  "count": 4
}

POST /api/network/ping
{
  "device_id": "<device_id>"
}

# SNMP GET
POST /api/network/snmp
{
  "host": "192.168.1.1",
  "community": "public",
  "version": "v2c",
  "oids": [".1.3.6.1.2.1.1.1.0", ".1.3.6.1.2.1.1.5.0"],
  "port": 161,
  "timeout": 5
}

# HTTP GET API/server
POST /api/network/http-get
{
  "url": "https://api.example.com/health",
  "headers": {
    "Authorization": "Bearer <token>"
  },
  "timeout": 10
}

# Referensi OID umum
GET /api/network/snmp/oids

# Log jaringan
GET /api/network/logs?page=1&limit=50&q=cloudflare&action=http&device_id=<device_id>&status=critical
DELETE /api/network/logs

# Monitor targets & scheduler
GET /api/network/monitor-targets
GET /api/network/scheduler/status

# Local interface agent
GET  /api/network/interfaces
GET  /api/network/interfaces/:name
POST /api/network/interfaces/check

# Statistik (Admin/Atasan)
GET /api/network/stats
GET /api/network/device-history?range=24h&device_id=<device_id>
```

---

## 🔧 Environment Variables

| Variable                    | Default            | Keterangan               |
|-----------------------------|--------------------|--------------------------|
| `APP_PORT`                  | `3000`             | Port server              |
| `APP_ENV`                   | `development`      | Environment              |
| `JWT_SECRET`                | -                  | **Wajib diganti!**       |
| `MYSQL_HOST`                | `localhost`        | Host MySQL               |
| `MYSQL_PORT`                | `3306`             | Port MySQL               |
| `MYSQL_USER`                | `root`             | User MySQL               |
| `MYSQL_PASSWORD`            | -                  | Password MySQL           |
| `MYSQL_DBNAME`              | `netmon`           | Database MySQL           |
| `CLICKHOUSE_HOST`           | `localhost`        | Host ClickHouse          |
| `CLICKHOUSE_PORT`           | `9000`             | Port ClickHouse          |
| `MONITOR_SCHEDULER_ENABLED` | `true`             | Aktifkan scheduler       |
| `MONITOR_INTERVAL_SECONDS`  | `10`               | Resolusi scan scheduler; set <= interval probe terkecil |
| `LOCAL_INTERFACE_MONITOR_ENABLED` | `true`       | Scan Ethernet/WiFi lokal |
| `LOCAL_INTERFACE_NAMES`     | -                  | Opsional, contoh `enp3s0,wlp2s0` |
| `ALERT_WEBHOOK_URL`         | -                  | Webhook WA/custom        |
| `ALERT_TELEGRAM_BOT_TOKEN`  | -                  | Token bot Telegram       |
| `ALERT_TELEGRAM_CHAT_ID`    | -                  | Chat ID Telegram         |
| `ALERT_EMAIL_SMTP_HOST`     | -                  | SMTP host email alert    |
| `ALERT_EMAIL_SMTP_PORT`     | `587`              | SMTP port email alert    |
| `ALERT_EMAIL_USERNAME`      | -                  | SMTP username            |
| `ALERT_EMAIL_PASSWORD`      | -                  | SMTP password            |
| `ALERT_EMAIL_FROM`          | -                  | Sender email             |
| `ALERT_EMAIL_TO`            | -                  | Recipient email          |
| `DEFAULT_ADMIN_USERNAME`    | `admin`            | Username admin default   |
| `DEFAULT_ADMIN_PASSWORD`    | `Admin@123!`       | Password admin default   |
| *(+ default user lainnya)*  |                    |                          |

---

## 📁 Struktur Project

```
netmon/
├── cmd/
│   └── main.go              # Entry point
├── config/
│   └── config.go            # Konfigurasi env
├── internal/
│   ├── auth/
│   │   └── auth.go          # JWT login/register/parse
│   ├── handler/
│   │   ├── auth_handler.go  # Handler login & register
│   │   ├── user_handler.go  # Handler CRUD user
│   │   ├── feedback_handler.go
│   │   ├── network_handler.go
│   │   └── routes.go        # Definisi semua route
│   ├── middleware/
│   │   └── auth_middleware.go # JWT + RBAC middleware
│   ├── model/
│   │   └── model.go         # Struct & konstanta
│   ├── repository/
│   │   ├── db.go            # Koneksi MySQL & ClickHouse
│   │   ├── user_repo.go     # Query user (MySQL)
│   │   ├── feedback_repo.go # Query feedback (MySQL)
│   │   ├── device_repo.go   # Query device/monitor target
│   │   ├── alert_repo.go    # Query alert
│   │   └── network_log_repo.go # Query log (ClickHouse)
│   └── service/
│       ├── monitor/         # Ping/SNMP/HTTP checker + scheduler
│       ├── alert/           # Threshold evaluator + notifier
│       └── seeder.go        # Default user seeder
├── migrations/
│   ├── mysql.sql            # DDL MySQL
│   └── clickhouse.sql       # DDL ClickHouse
├── Dockerfile
├── docker-compose.yml
├── Makefile
├── .env.example
└── go.mod
```

---

## ⚠️ Catatan Penting

1. **ICMP Ping** memerlukan privilege `NET_RAW`. Di Docker sudah dikonfigurasi via `cap_add: NET_RAW`. Di Linux tanpa Docker:
   ```bash
   sudo setcap cap_net_raw+ep ./bin/netmon
   ```

2. **JWT Secret** wajib diganti di production dengan string acak panjang.

3. **Default password** wajib diganti segera setelah deployment pertama.

4. ClickHouse menyimpan log dengan **TTL 6 bulan** dan auto-partisi per bulan untuk performa optimal.
