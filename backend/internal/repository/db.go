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

func ensureMySQLSchemaPatches(db *sqlx.DB, cfg *config.Config) error {
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
