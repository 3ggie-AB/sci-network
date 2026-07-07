package repository

import (
	"context"
	"fmt"
	"log"
	"time"

	clickhouse "github.com/ClickHouse/clickhouse-go/v2"
	"github.com/ClickHouse/clickhouse-go/v2/lib/driver"
	_ "github.com/go-sql-driver/mysql"
	"github.com/jmoiron/sqlx"
	"github.com/yourorg/netmon/config"
)

var MySQL *sqlx.DB
var ClickHouse driver.Conn

// InitMySQL initializes MySQL connection
func InitMySQL() {
	cfg := config.App
	if err := ensureMySQLDatabase(cfg); err != nil {
		log.Fatalf("[MYSQL] Failed to create database: %v", err)
	}

	db, err := sqlx.Connect("mysql", mysqlDSN(cfg, cfg.MySQLDBName))
	if err != nil {
		log.Fatalf("[MYSQL] Failed to connect: %v", err)
	}

	db.SetMaxOpenConns(25)
	db.SetMaxIdleConns(10)
	db.SetConnMaxLifetime(5 * time.Minute)

	if err = db.Ping(); err != nil {
		log.Fatalf("[MYSQL] Ping failed: %v", err)
	}
	if err = ensureMySQLSchemaPatches(db, cfg); err != nil {
		log.Fatalf("[MYSQL] Schema patch failed: %v", err)
	}

	MySQL = db
	log.Println("[MYSQL] Connected successfully")
}

// InitClickHouse initializes ClickHouse connection
func InitClickHouse() {
	cfg := config.App
	if err := ensureClickHouseDatabase(cfg); err != nil {
		log.Fatalf("[CLICKHOUSE] Failed to create database: %v", err)
	}

	conn, err := clickhouse.Open(clickHouseOptions(cfg, cfg.ClickHouseDBName))
	if err != nil {
		log.Fatalf("[CLICKHOUSE] Failed to connect: %v", err)
	}

	ctx, cancel := context.WithTimeout(context.Background(), 5*time.Second)
	defer cancel()

	if err = conn.Ping(ctx); err != nil {
		log.Fatalf("[CLICKHOUSE] Ping failed: %v", err)
	}
	if err = ensureClickHouseSchema(ctx, conn); err != nil {
		log.Fatalf("[CLICKHOUSE] Schema patch failed: %v", err)
	}

	ClickHouse = conn
	log.Println("[CLICKHOUSE] Connected successfully")
}

func ensureMySQLDatabase(cfg *config.Config) error {
	dbName, err := quoteDatabaseName(cfg.MySQLDBName)
	if err != nil {
		return err
	}

	db, err := sqlx.Connect("mysql", mysqlDSN(cfg, ""))
	if err != nil {
		return err
	}
	defer db.Close()

	_, err = db.Exec(fmt.Sprintf(
		"CREATE DATABASE IF NOT EXISTS %s CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci",
		dbName,
	))
	return err
}

func ensureClickHouseDatabase(cfg *config.Config) error {
	dbName, err := quoteDatabaseName(cfg.ClickHouseDBName)
	if err != nil {
		return err
	}

	conn, err := clickhouse.Open(clickHouseOptions(cfg, "default"))
	if err != nil {
		return err
	}
	defer conn.Close()

	ctx, cancel := context.WithTimeout(context.Background(), 5*time.Second)
	defer cancel()

	if err = conn.Ping(ctx); err != nil {
		return err
	}

	return conn.Exec(ctx, fmt.Sprintf("CREATE DATABASE IF NOT EXISTS %s", dbName))
}

func ensureClickHouseSchema(ctx context.Context, conn driver.Conn) error {
	statements := []string{
		`CREATE TABLE IF NOT EXISTS network_logs (
			id String,
			user_id String,
			device_id String DEFAULT '',
			action LowCardinality(String),
			target String,
			result String,
			success UInt8,
			duration Int64,
			latency Float64 DEFAULT 0,
			packet_loss Float64 DEFAULT 0,
			jitter Float64 DEFAULT 0,
			response_time Int64 DEFAULT 0,
			status LowCardinality(String) DEFAULT 'unknown',
			cpu Float64 DEFAULT 0,
			memory Float64 DEFAULT 0,
			bandwidth_in Float64 DEFAULT 0,
			bandwidth_out Float64 DEFAULT 0,
			created_at DateTime DEFAULT now()
		)
		ENGINE = MergeTree()
		PARTITION BY toYYYYMM(created_at)
		ORDER BY (created_at, user_id, device_id, action)
		TTL created_at + INTERVAL 6 MONTH
		SETTINGS index_granularity = 8192`,
		`ALTER TABLE network_logs ADD COLUMN IF NOT EXISTS device_id String DEFAULT '' AFTER user_id`,
		`ALTER TABLE network_logs ADD COLUMN IF NOT EXISTS latency Float64 DEFAULT 0 AFTER duration`,
		`ALTER TABLE network_logs ADD COLUMN IF NOT EXISTS packet_loss Float64 DEFAULT 0 AFTER latency`,
		`ALTER TABLE network_logs ADD COLUMN IF NOT EXISTS jitter Float64 DEFAULT 0 AFTER packet_loss`,
		`ALTER TABLE network_logs ADD COLUMN IF NOT EXISTS response_time Int64 DEFAULT 0 AFTER jitter`,
		`ALTER TABLE network_logs ADD COLUMN IF NOT EXISTS status LowCardinality(String) DEFAULT 'unknown' AFTER response_time`,
		`ALTER TABLE network_logs ADD COLUMN IF NOT EXISTS cpu Float64 DEFAULT 0 AFTER status`,
		`ALTER TABLE network_logs ADD COLUMN IF NOT EXISTS memory Float64 DEFAULT 0 AFTER cpu`,
		`ALTER TABLE network_logs ADD COLUMN IF NOT EXISTS bandwidth_in Float64 DEFAULT 0 AFTER memory`,
		`ALTER TABLE network_logs ADD COLUMN IF NOT EXISTS bandwidth_out Float64 DEFAULT 0 AFTER bandwidth_in`,
		`CREATE VIEW IF NOT EXISTS daily_stats AS
		SELECT
			toDate(created_at) AS date,
			user_id,
			device_id,
			action,
			count() AS total_requests,
			countIf(success = 1) AS success_count,
			countIf(success = 0) AS fail_count,
			round(avg(duration), 2) AS avg_duration_ms,
			max(duration) AS max_duration_ms,
			round(avgIf(latency, latency > 0), 2) AS avg_latency_ms,
			round(avgIf(packet_loss, action = 'ping'), 2) AS avg_packet_loss,
			round(avgIf(jitter, jitter > 0), 2) AS avg_jitter_ms,
			round(avgIf(response_time, response_time > 0), 2) AS avg_response_time_ms
		FROM network_logs
		GROUP BY date, user_id, device_id, action`,
		`CREATE VIEW IF NOT EXISTS top_targets AS
		SELECT
			target,
			device_id,
			action,
			count() AS hits,
			round(countIf(success = 1) / count() * 100, 2) AS success_rate_pct,
			round(avg(duration), 2) AS avg_duration_ms,
			round(avgIf(latency, latency > 0), 2) AS avg_latency_ms,
			round(avgIf(packet_loss, action = 'ping'), 2) AS avg_packet_loss,
			anyLast(status) AS last_status
		FROM network_logs
		GROUP BY target, device_id, action
		ORDER BY hits DESC`,
	}

	for _, statement := range statements {
		if err := conn.Exec(ctx, statement); err != nil {
			return err
		}
	}
	return nil
}

func ensureMySQLSchemaPatches(db *sqlx.DB, cfg *config.Config) error {
	if err := ensureMySQLCoreTables(db); err != nil {
		return err
	}
	if err := ensurePushSubscriptionsTable(db); err != nil {
		return err
	}

	hasAlerts, err := mysqlTableExists(db, cfg.MySQLDBName, "alerts")
	if err != nil {
		return err
	}
	if hasAlerts {
		if _, err := addMySQLColumnIfMissing(db, cfg.MySQLDBName, "alerts", "notes", `TEXT NULL AFTER message`); err != nil {
			return err
		}
	}

	hasDevices, err := mysqlTableExists(db, cfg.MySQLDBName, "devices")
	if err != nil {
		return err
	}
	if hasDevices {
		if added, err := addMySQLColumnIfMissing(db, cfg.MySQLDBName, "devices", "ping_interval_seconds", `INT NOT NULL DEFAULT 60 AFTER check_interval_seconds`); err != nil {
			return err
		} else if added {
			if _, err := db.Exec(`UPDATE devices SET ping_interval_seconds = check_interval_seconds`); err != nil {
				return err
			}
		}
		if added, err := addMySQLColumnIfMissing(db, cfg.MySQLDBName, "devices", "snmp_interval_seconds", `INT NOT NULL DEFAULT 60 AFTER ping_interval_seconds`); err != nil {
			return err
		} else if added {
			if _, err := db.Exec(`UPDATE devices SET snmp_interval_seconds = check_interval_seconds`); err != nil {
				return err
			}
		}
		if added, err := addMySQLColumnIfMissing(db, cfg.MySQLDBName, "devices", "http_interval_seconds", `INT NOT NULL DEFAULT 60 AFTER snmp_interval_seconds`); err != nil {
			return err
		} else if added {
			if _, err := db.Exec(`UPDATE devices SET http_interval_seconds = check_interval_seconds`); err != nil {
				return err
			}
		}
		if _, err := addMySQLColumnIfMissing(db, cfg.MySQLDBName, "devices", "last_ping_checked_at", `DATETIME NULL AFTER last_checked_at`); err != nil {
			return err
		}
		if _, err := addMySQLColumnIfMissing(db, cfg.MySQLDBName, "devices", "last_snmp_checked_at", `DATETIME NULL AFTER last_ping_checked_at`); err != nil {
			return err
		}
		if _, err := addMySQLColumnIfMissing(db, cfg.MySQLDBName, "devices", "last_http_checked_at", `DATETIME NULL AFTER last_snmp_checked_at`); err != nil {
			return err
		}
	}
	return nil
}

func ensureMySQLCoreTables(db *sqlx.DB) error {
	statements := []string{
		`CREATE TABLE IF NOT EXISTS users (
			id          VARCHAR(36)  NOT NULL PRIMARY KEY,
			username    VARCHAR(50)  NOT NULL UNIQUE,
			email       VARCHAR(100) NOT NULL UNIQUE,
			password    VARCHAR(255) NOT NULL,
			role        ENUM('admin','staff','karyawan','teknisi','atasan') NOT NULL DEFAULT 'karyawan',
			full_name   VARCHAR(100) NOT NULL DEFAULT '',
			is_active   TINYINT(1)   NOT NULL DEFAULT 1,
			created_at  DATETIME     NOT NULL DEFAULT CURRENT_TIMESTAMP,
			updated_at  DATETIME     NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
			INDEX idx_role      (role),
			INDEX idx_is_active (is_active),
			INDEX idx_email     (email)
		) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci`,

		`CREATE TABLE IF NOT EXISTS feedbacks (
			id           VARCHAR(36)  NOT NULL PRIMARY KEY,
			user_id      VARCHAR(36)  NOT NULL,
			title        VARCHAR(200) NOT NULL,
			description  TEXT         NOT NULL,
			category     ENUM('network','hardware','software','other') NOT NULL DEFAULT 'other',
			status       ENUM('open','in_progress','resolved','closed') NOT NULL DEFAULT 'open',
			priority     TINYINT      NOT NULL DEFAULT 1 COMMENT '1=low, 2=medium, 3=high',
			assigned_to  VARCHAR(36)  NULL,
			response     TEXT         NULL,
			created_at   DATETIME     NOT NULL DEFAULT CURRENT_TIMESTAMP,
			updated_at   DATETIME     NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
			CONSTRAINT fk_fb_user     FOREIGN KEY (user_id)     REFERENCES users(id) ON DELETE CASCADE,
			CONSTRAINT fk_fb_assigned FOREIGN KEY (assigned_to) REFERENCES users(id) ON DELETE SET NULL,
			INDEX idx_status   (status),
			INDEX idx_category (category),
			INDEX idx_user_id  (user_id),
			INDEX idx_priority (priority)
		) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci`,

		`CREATE TABLE IF NOT EXISTS devices (
			id                         VARCHAR(36)  NOT NULL PRIMARY KEY,
			name                       VARCHAR(100) NOT NULL,
			host                       VARCHAR(255) NOT NULL,
			type                       ENUM('server','router','mikrotik','switch','gateway','other') NOT NULL DEFAULT 'other',
			snmp_version               ENUM('v1','v2c','v3') NOT NULL DEFAULT 'v2c',
			snmp_community             VARCHAR(100) NOT NULL DEFAULT 'public',
			snmp_port                  SMALLINT UNSIGNED NOT NULL DEFAULT 161,
			snmp_timeout               INT NOT NULL DEFAULT 5,
			http_url                   VARCHAR(500) NOT NULL DEFAULT '',
			http_timeout               INT NOT NULL DEFAULT 10,
			monitor_enabled            TINYINT(1) NOT NULL DEFAULT 1,
			ping_enabled               TINYINT(1) NOT NULL DEFAULT 1,
			snmp_enabled               TINYINT(1) NOT NULL DEFAULT 0,
			http_enabled               TINYINT(1) NOT NULL DEFAULT 0,
			check_interval_seconds     INT NOT NULL DEFAULT 60,
			ping_interval_seconds      INT NOT NULL DEFAULT 60,
			snmp_interval_seconds      INT NOT NULL DEFAULT 60,
			http_interval_seconds      INT NOT NULL DEFAULT 60,
			packet_loss_warning        DECIMAL(8,2) NOT NULL DEFAULT 5.00,
			packet_loss_critical       DECIMAL(8,2) NOT NULL DEFAULT 20.00,
			latency_warning_ms         DECIMAL(10,2) NOT NULL DEFAULT 150.00,
			latency_critical_ms        DECIMAL(10,2) NOT NULL DEFAULT 500.00,
			response_time_warning_ms   DECIMAL(10,2) NOT NULL DEFAULT 1000.00,
			response_time_critical_ms  DECIMAL(10,2) NOT NULL DEFAULT 3000.00,
			last_status                ENUM('unknown','up','warning','critical','down') NOT NULL DEFAULT 'unknown',
			last_checked_at            DATETIME NULL,
			last_ping_checked_at       DATETIME NULL,
			last_snmp_checked_at       DATETIME NULL,
			last_http_checked_at       DATETIME NULL,
			is_active                  TINYINT(1) NOT NULL DEFAULT 1,
			created_at                 DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
			updated_at                 DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
			INDEX idx_device_host      (host),
			INDEX idx_device_type      (type),
			INDEX idx_monitor_enabled  (monitor_enabled),
			INDEX idx_last_status      (last_status),
			INDEX idx_is_active        (is_active)
		) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci`,

		`CREATE TABLE IF NOT EXISTS alerts (
			id              VARCHAR(36) NOT NULL PRIMARY KEY,
			device_id       VARCHAR(36) NOT NULL,
			severity        ENUM('info','warning','critical') NOT NULL DEFAULT 'warning',
			status          ENUM('open','acknowledged','resolved') NOT NULL DEFAULT 'open',
			metric          VARCHAR(50) NOT NULL,
			threshold_value DECIMAL(12,2) NOT NULL DEFAULT 0,
			actual_value    DECIMAL(12,2) NOT NULL DEFAULT 0,
			message         VARCHAR(500) NOT NULL,
			notes           TEXT NULL,
			created_at      DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
			updated_at      DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
			acknowledged_at DATETIME NULL,
			resolved_at     DATETIME NULL,
			CONSTRAINT fk_alert_device FOREIGN KEY (device_id) REFERENCES devices(id) ON DELETE CASCADE,
			INDEX idx_alert_device  (device_id),
			INDEX idx_alert_status  (status),
			INDEX idx_alert_severity(severity),
			INDEX idx_alert_metric  (metric),
			INDEX idx_alert_created (created_at)
		) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci`,
	}

	for _, statement := range statements {
		if _, err := db.Exec(statement); err != nil {
			return err
		}
	}
	return nil
}

func ensurePushSubscriptionsTable(db *sqlx.DB) error {
	_, err := db.Exec(`
		CREATE TABLE IF NOT EXISTS push_subscriptions (
			id            VARCHAR(36)  NOT NULL PRIMARY KEY,
			user_id       VARCHAR(36)  NOT NULL,
			endpoint      TEXT         NOT NULL,
			endpoint_hash CHAR(64)     NOT NULL,
			p256dh        VARCHAR(255) NOT NULL,
			auth          VARCHAR(255) NOT NULL,
			user_agent    VARCHAR(255) NOT NULL DEFAULT '',
			created_at    DATETIME     NOT NULL DEFAULT CURRENT_TIMESTAMP,
			updated_at    DATETIME     NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
			last_used_at  DATETIME     NULL,
			CONSTRAINT fk_push_user FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
			UNIQUE KEY uniq_push_endpoint_hash (endpoint_hash),
			INDEX idx_push_user (user_id),
			INDEX idx_push_updated (updated_at)
		) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci`,
	)
	return err
}

func addMySQLColumnIfMissing(db *sqlx.DB, schema, table, column, definition string) (bool, error) {
	exists, err := mysqlColumnExists(db, schema, table, column)
	if err != nil {
		return false, err
	}
	if exists {
		return false, nil
	}
	_, err = db.Exec(fmt.Sprintf(`ALTER TABLE %s ADD COLUMN %s %s`, table, column, definition))
	return err == nil, err
}

func mysqlTableExists(db *sqlx.DB, schema, table string) (bool, error) {
	var count int
	err := db.Get(&count, `
		SELECT COUNT(*)
		FROM information_schema.TABLES
		WHERE TABLE_SCHEMA = ? AND TABLE_NAME = ?`,
		schema, table,
	)
	return count > 0, err
}

func mysqlColumnExists(db *sqlx.DB, schema, table, column string) (bool, error) {
	var count int
	err := db.Get(&count, `
		SELECT COUNT(*)
		FROM information_schema.COLUMNS
		WHERE TABLE_SCHEMA = ? AND TABLE_NAME = ? AND COLUMN_NAME = ?`,
		schema, table, column,
	)
	return count > 0, err
}

func mysqlDSN(cfg *config.Config, database string) string {
	return fmt.Sprintf("%s:%s@tcp(%s:%s)/%s?parseTime=true&charset=utf8mb4",
		cfg.MySQLUser, cfg.MySQLPassword,
		cfg.MySQLHost, cfg.MySQLPort,
		database,
	)
}

func clickHouseOptions(cfg *config.Config, database string) *clickhouse.Options {
	return &clickhouse.Options{
		Addr: []string{fmt.Sprintf("%s:%s", cfg.ClickHouseHost, cfg.ClickHousePort)},
		Auth: clickhouse.Auth{
			Database: database,
			Username: cfg.ClickHouseUser,
			Password: cfg.ClickHousePassword,
		},
		DialTimeout:     10 * time.Second,
		MaxOpenConns:    10,
		MaxIdleConns:    5,
		ConnMaxLifetime: 10 * time.Minute,
	}
}

func quoteDatabaseName(name string) (string, error) {
	if name == "" {
		return "", fmt.Errorf("database name cannot be empty")
	}

	for _, ch := range name {
		if ch == '_' || ch >= 'a' && ch <= 'z' || ch >= 'A' && ch <= 'Z' || ch >= '0' && ch <= '9' {
			continue
		}
		return "", fmt.Errorf("database name %q contains unsupported character %q", name, ch)
	}

	return "`" + name + "`", nil
}
