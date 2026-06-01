package repository

import (
	"context"
	"time"

	"github.com/yourorg/netmon/config"
)

type StorageDatabaseInfo struct {
	Name      string `json:"name"`
	Engine    string `json:"engine"`
	Status    string `json:"status"`
	SizeBytes int64  `json:"size_bytes"`
	Tables    int64  `json:"tables"`
	Rows      int64  `json:"rows"`
	Error     string `json:"error,omitempty"`
}

type StorageOverview struct {
	MySQL      StorageDatabaseInfo `json:"mysql"`
	ClickHouse StorageDatabaseInfo `json:"clickhouse"`
	TotalBytes int64               `json:"total_bytes"`
	CheckedAt  time.Time           `json:"checked_at"`
}

func GetStorageOverview() StorageOverview {
	overview := StorageOverview{
		MySQL: StorageDatabaseInfo{
			Name:   config.App.MySQLDBName,
			Engine: "MySQL",
			Status: "unknown",
		},
		ClickHouse: StorageDatabaseInfo{
			Name:   config.App.ClickHouseDBName,
			Engine: "ClickHouse",
			Status: "unknown",
		},
		CheckedAt: time.Now(),
	}

	overview.MySQL = getMySQLStorage(config.App.MySQLDBName)
	overview.ClickHouse = getClickHouseStorage(config.App.ClickHouseDBName)
	overview.TotalBytes = overview.MySQL.SizeBytes + overview.ClickHouse.SizeBytes
	return overview
}

func getMySQLStorage(database string) StorageDatabaseInfo {
	info := StorageDatabaseInfo{
		Name:   database,
		Engine: "MySQL",
		Status: "ok",
	}

	if MySQL == nil {
		info.Status = "error"
		info.Error = "mysql connection is not initialized"
		return info
	}
	if err := MySQL.Ping(); err != nil {
		info.Status = "error"
		info.Error = err.Error()
		return info
	}

	err := MySQL.QueryRow(`
		SELECT
			COUNT(*) AS tables,
			COALESCE(SUM(data_length + index_length), 0) AS size_bytes,
			COALESCE(SUM(table_rows), 0) AS row_count
		FROM information_schema.TABLES
		WHERE table_schema = ?`,
		database,
	).Scan(&info.Tables, &info.SizeBytes, &info.Rows)
	if err != nil {
		info.Status = "error"
		info.Error = err.Error()
	}
	return info
}

func getClickHouseStorage(database string) StorageDatabaseInfo {
	info := StorageDatabaseInfo{
		Name:   database,
		Engine: "ClickHouse",
		Status: "ok",
	}

	if ClickHouse == nil {
		info.Status = "error"
		info.Error = "clickhouse connection is not initialized"
		return info
	}

	ctx, cancel := context.WithTimeout(context.Background(), 5*time.Second)
	defer cancel()

	if err := ClickHouse.Ping(ctx); err != nil {
		info.Status = "error"
		info.Error = err.Error()
		return info
	}

	if err := ClickHouse.QueryRow(ctx, `
		SELECT toInt64(count())
		FROM system.tables
		WHERE database = ?`,
		database,
	).Scan(&info.Tables); err != nil {
		info.Status = "error"
		info.Error = err.Error()
		return info
	}

	if err := ClickHouse.QueryRow(ctx, `
		SELECT
			toInt64(coalesce(sum(bytes_on_disk), 0)),
			toInt64(coalesce(sum(rows), 0))
		FROM system.parts
		WHERE database = ? AND active`,
		database,
	).Scan(&info.SizeBytes, &info.Rows); err != nil {
		info.Status = "error"
		info.Error = err.Error()
	}
	return info
}
