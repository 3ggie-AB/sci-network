package repository

import (
	"context"
	"fmt"
	"time"

	"github.com/google/uuid"
	"github.com/yourorg/netmon/internal/model"
)

func InsertNetworkLog(userID, action, target, result string, success bool, duration int64) error {
	status := "error"
	if success {
		status = "up"
	}
	return InsertNetworkLogEntry(model.NetworkLog{
		UserID:       userID,
		Action:       action,
		Target:       target,
		Result:       result,
		Success:      success,
		Duration:     duration,
		ResponseTime: duration,
		Status:       status,
	})
}

func InsertNetworkLogEntry(log model.NetworkLog) error {
	ctx := context.Background()
	if log.ID == "" {
		log.ID = uuid.New().String()
	}
	if log.CreatedAt.IsZero() {
		log.CreatedAt = time.Now()
	}
	if log.Status == "" {
		if log.Success {
			log.Status = "up"
		} else {
			log.Status = "error"
		}
	}

	return ClickHouse.Exec(ctx, `
		INSERT INTO network_logs (
			id, user_id, device_id, action, target, result, success, duration,
			latency, packet_loss, jitter, response_time, status, cpu, memory,
			bandwidth_in, bandwidth_out, created_at
		)
		VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
		log.ID,
		log.UserID,
		log.DeviceID,
		log.Action,
		log.Target,
		log.Result,
		log.Success,
		log.Duration,
		log.Latency,
		log.PacketLoss,
		log.Jitter,
		log.ResponseTime,
		log.Status,
		log.CPU,
		log.Memory,
		log.BandwidthIn,
		log.BandwidthOut,
		log.CreatedAt,
	)
}

type NetworkLogFilter struct {
	UserID    string
	DeviceID  string
	Action    string
	Status    string
	StartTime *time.Time
	EndTime   *time.Time
	Page      int
	Limit     int
}

type NetworkLogStats struct {
	TotalChecks       int64   `json:"total_checks"`
	TotalPings        int64   `json:"total_pings"`
	TotalSNMP         int64   `json:"total_snmp"`
	TotalHTTP         int64   `json:"total_http"`
	TotalInterfaces   int64   `json:"total_interfaces"`
	Availability      float64 `json:"availability"`
	PacketLossAvg     float64 `json:"packet_loss_avg"`
	LatencyAvgMs      float64 `json:"latency_avg_ms"`
	JitterAvgMs       float64 `json:"jitter_avg_ms"`
	ResponseTimeAvgMs float64 `json:"response_time_avg_ms"`
	Uptime            float64 `json:"uptime"`
	SuccessRate       float64 `json:"success_rate"`
	AvgDurationMs     float64 `json:"avg_duration_ms"`
}

type NetworkDeviceHistoryPoint struct {
	Bucket            time.Time `json:"bucket"`
	TotalChecks       int64     `json:"total_checks"`
	PingChecks        int64     `json:"ping_checks"`
	SNMPChecks        int64     `json:"snmp_checks"`
	HTTPChecks        int64     `json:"http_checks"`
	Availability      float64   `json:"availability"`
	LatencyAvgMs      float64   `json:"latency_avg_ms"`
	PacketLossAvg     float64   `json:"packet_loss_avg"`
	ResponseTimeAvgMs float64   `json:"response_time_avg_ms"`
	Incidents         int64     `json:"incidents"`
}

func ListNetworkLogs(f NetworkLogFilter) ([]model.NetworkLog, error) {
	ctx := context.Background()
	if f.Page < 1 {
		f.Page = 1
	}
	if f.Limit < 1 || f.Limit > 100 {
		f.Limit = 50
	}
	offset := (f.Page - 1) * f.Limit

	query := `
		SELECT
			id, user_id, device_id, action, target, result, success, duration,
			latency, packet_loss, jitter, response_time, status, cpu, memory,
			bandwidth_in, bandwidth_out, created_at
		FROM network_logs
		WHERE 1=1`
	args := []interface{}{}

	if f.UserID != "" {
		query += ` AND user_id = ?`
		args = append(args, f.UserID)
	}
	if f.DeviceID != "" {
		query += ` AND device_id = ?`
		args = append(args, f.DeviceID)
	}
	if f.Action != "" {
		query += ` AND action = ?`
		args = append(args, f.Action)
	}
	if f.Status != "" {
		query += ` AND status = ?`
		args = append(args, f.Status)
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
		if err := rows.Scan(
			&l.ID, &l.UserID, &l.DeviceID, &l.Action, &l.Target, &l.Result, &l.Success, &l.Duration,
			&l.Latency, &l.PacketLoss, &l.Jitter, &l.ResponseTime, &l.Status, &l.CPU, &l.Memory,
			&l.BandwidthIn, &l.BandwidthOut, &l.CreatedAt,
		); err != nil {
			return nil, err
		}
		logs = append(logs, l)
	}
	return logs, nil
}

func ClearNetworkLogs() error {
	ctx := context.Background()
	return ClickHouse.Exec(ctx, `TRUNCATE TABLE network_logs`)
}

func GetNetworkStats() (*NetworkLogStats, error) {
	ctx := context.Background()
	stats := &NetworkLogStats{}

	row := ClickHouse.QueryRow(ctx, `
		SELECT
			toInt64(count()) AS total_checks,
			toInt64(countIf(action = 'ping')) AS total_pings,
			toInt64(countIf(action = 'snmp')) AS total_snmp,
			toInt64(countIf(action = 'http')) AS total_http,
			toInt64(countIf(action = 'interface')) AS total_interfaces,
			if(
				count() = 0,
				0.0,
				round(toFloat64(countIf(success = 1 OR status IN ('up', 'healthy', 'warning'))) / toFloat64(count()) * 100, 2)
			) AS availability,
			if(countIf(action = 'ping') = 0, 0.0, round(avgIf(packet_loss, action = 'ping'), 2)) AS packet_loss_avg,
			if(countIf(latency > 0) = 0, 0.0, round(avgIf(latency, latency > 0), 2)) AS latency_avg,
			if(countIf(jitter > 0) = 0, 0.0, round(avgIf(jitter, jitter > 0), 2)) AS jitter_avg,
			if(countIf(response_time > 0) = 0, 0.0, round(avgIf(response_time, response_time > 0), 2)) AS response_time_avg,
			if(
				count() = 0,
				0.0,
				round(toFloat64(countIf(status IN ('up', 'healthy', 'warning'))) / toFloat64(count()) * 100, 2)
			) AS uptime,
			if(count() = 0, 0.0, round(toFloat64(countIf(success = 1)) / toFloat64(count()) * 100, 2)) AS success_rate,
			if(count() = 0, 0.0, round(avg(duration), 2)) AS avg_duration
		FROM network_logs`)

	err := row.Scan(
		&stats.TotalChecks,
		&stats.TotalPings,
		&stats.TotalSNMP,
		&stats.TotalHTTP,
		&stats.TotalInterfaces,
		&stats.Availability,
		&stats.PacketLossAvg,
		&stats.LatencyAvgMs,
		&stats.JitterAvgMs,
		&stats.ResponseTimeAvgMs,
		&stats.Uptime,
		&stats.SuccessRate,
		&stats.AvgDurationMs,
	)
	return stats, err
}

func GetNetworkDeviceHistory(deviceID, rangeName string) ([]NetworkDeviceHistoryPoint, error) {
	ctx := context.Background()
	bucket, window := historySQLWindow(rangeName)

	query := fmt.Sprintf(`
		SELECT
			toStartOfInterval(created_at, %s) AS bucket,
			toInt64(count()) AS total_checks,
			toInt64(countIf(action = 'ping')) AS ping_checks,
			toInt64(countIf(action = 'snmp')) AS snmp_checks,
			toInt64(countIf(action = 'http')) AS http_checks,
			if(
				count() = 0,
				0.0,
				round(toFloat64(countIf(success = 1 OR status IN ('up', 'healthy', 'warning'))) / toFloat64(count()) * 100, 2)
			) AS availability,
			if(countIf(latency > 0) = 0, 0.0, round(avgIf(latency, latency > 0), 2)) AS latency_avg,
			if(countIf(action = 'ping') = 0, 0.0, round(avgIf(packet_loss, action = 'ping'), 2)) AS packet_loss_avg,
			if(countIf(response_time > 0) = 0, 0.0, round(avgIf(response_time, response_time > 0), 2)) AS response_time_avg,
			toInt64(countIf(success = 0 OR status IN ('critical', 'down'))) AS incidents
		FROM network_logs
		WHERE created_at >= now() - %s`, bucket, window)
	args := []interface{}{}
	if deviceID != "" {
		query += ` AND device_id = ?`
		args = append(args, deviceID)
	}
	query += ` GROUP BY bucket ORDER BY bucket ASC`

	rows, err := ClickHouse.Query(ctx, query, args...)
	if err != nil {
		return nil, err
	}
	defer rows.Close()

	points := []NetworkDeviceHistoryPoint{}
	for rows.Next() {
		var p NetworkDeviceHistoryPoint
		if err := rows.Scan(
			&p.Bucket,
			&p.TotalChecks,
			&p.PingChecks,
			&p.SNMPChecks,
			&p.HTTPChecks,
			&p.Availability,
			&p.LatencyAvgMs,
			&p.PacketLossAvg,
			&p.ResponseTimeAvgMs,
			&p.Incidents,
		); err != nil {
			return nil, err
		}
		points = append(points, p)
	}
	return points, rows.Err()
}

func historySQLWindow(rangeName string) (bucket string, window string) {
	switch rangeName {
	case "1h":
		return "INTERVAL 5 MINUTE", "INTERVAL 1 HOUR"
	case "6h":
		return "INTERVAL 15 MINUTE", "INTERVAL 6 HOUR"
	case "7d":
		return "INTERVAL 6 HOUR", "INTERVAL 7 DAY"
	case "30d":
		return "INTERVAL 1 DAY", "INTERVAL 30 DAY"
	default:
		return "INTERVAL 1 HOUR", "INTERVAL 24 HOUR"
	}
}
