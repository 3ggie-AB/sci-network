package repository

import (
	"context"
	"time"

	"github.com/google/uuid"
	"github.com/yourorg/netmon/internal/model"
)

func InsertNetworkLog(userID, action, target, result string, success bool, duration int64) error {
	ctx := context.Background()
	return ClickHouse.Exec(ctx, `
		INSERT INTO network_logs (id, user_id, action, target, result, success, duration, created_at)
		VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
		uuid.New().String(),
		userID,
		action,
		target,
		result,
		success,
		duration,
		time.Now(),
	)
}

type NetworkLogFilter struct {
	UserID    string
	Action    string
	StartTime *time.Time
	EndTime   *time.Time
	Page      int
	Limit     int
}

type NetworkLogStats struct {
	TotalPings    int64   `json:"total_pings"`
	TotalSNMP     int64   `json:"total_snmp"`
	SuccessRate   float64 `json:"success_rate"`
	AvgDurationMs float64 `json:"avg_duration_ms"`
}

func ListNetworkLogs(f NetworkLogFilter) ([]model.NetworkLog, error) {
	ctx := context.Background()
	offset := (f.Page - 1) * f.Limit

	query := `
		SELECT id, user_id, action, target, result, success, duration, created_at
		FROM network_logs
		WHERE 1=1`
	args := []interface{}{}

	if f.UserID != "" {
		query += ` AND user_id = ?`
		args = append(args, f.UserID)
	}
	if f.Action != "" {
		query += ` AND action = ?`
		args = append(args, f.Action)
	}
	if f.StartTime != nil {
		query += ` AND created_at >= ?`
		args = append(args, *f.StartTime)
	}
	if f.EndTime != nil {
		query += ` AND created_at <= ?`
		args = append(args, *f.EndTime)
	}

	query += ` ORDER BY created_at DESC LIMIT ? OFFSET ?`
	args = append(args, f.Limit, offset)

	rows, err := ClickHouse.Query(ctx, query, args...)
	if err != nil {
		return nil, err
	}
	defer rows.Close()

	var logs []model.NetworkLog
	for rows.Next() {
		var l model.NetworkLog
		if err := rows.Scan(&l.ID, &l.UserID, &l.Action, &l.Target, &l.Result, &l.Success, &l.Duration, &l.CreatedAt); err != nil {
			return nil, err
		}
		logs = append(logs, l)
	}
	return logs, nil
}

func GetNetworkStats() (*NetworkLogStats, error) {
	ctx := context.Background()
	stats := &NetworkLogStats{}

	row := ClickHouse.QueryRow(ctx, `
		SELECT
			countIf(action = 'ping')                       AS total_pings,
			countIf(action = 'snmp')                       AS total_snmp,
			round(countIf(success = true) / count() * 100, 2) AS success_rate,
			round(avg(duration), 2)                        AS avg_duration
		FROM network_logs`)

	err := row.Scan(&stats.TotalPings, &stats.TotalSNMP, &stats.SuccessRate, &stats.AvgDurationMs)
	return stats, err
}
