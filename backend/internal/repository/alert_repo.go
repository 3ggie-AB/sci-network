package repository

import (
	"database/sql"
	"errors"
	"fmt"
	"time"

	"github.com/google/uuid"
	"github.com/yourorg/netmon/internal/model"
)

type AlertFilter struct {
	DeviceID string
	Severity string
	Status   string
	Page     int
	Limit    int
}

func CreateAlert(alert model.Alert) (*model.Alert, error) {
	now := time.Now()
	if alert.ID == "" {
		alert.ID = uuid.New().String()
	}
	if alert.Status == "" {
		alert.Status = model.AlertStatusOpen
	}
	alert.CreatedAt = now
	alert.UpdatedAt = now

	_, err := MySQL.Exec(`
		INSERT INTO alerts (
			id, device_id, severity, status, metric, threshold_value, actual_value,
			message, created_at, updated_at
		)
		VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
		alert.ID, alert.DeviceID, alert.Severity, alert.Status, alert.Metric,
		alert.ThresholdValue, alert.ActualValue, alert.Message, alert.CreatedAt, alert.UpdatedAt,
	)
	if err != nil {
		return nil, err
	}
	return &alert, nil
}

func UpsertOpenAlert(alert model.Alert) (*model.Alert, bool, error) {
	existing := &model.Alert{}
	err := MySQL.Get(existing, `
		SELECT
			a.*, d.name AS device_name
		FROM alerts a
		LEFT JOIN devices d ON d.id = a.device_id
		WHERE a.device_id = ? AND a.metric = ? AND a.status IN ('open', 'acknowledged')
		ORDER BY a.created_at DESC
		LIMIT 1`,
		alert.DeviceID, alert.Metric,
	)
	if err != nil && !errors.Is(err, sql.ErrNoRows) {
		return nil, false, err
	}
	if errors.Is(err, sql.ErrNoRows) {
		created, err := CreateAlert(alert)
		return created, true, err
	}

	_, err = MySQL.Exec(`
		UPDATE alerts
		SET severity = ?, threshold_value = ?, actual_value = ?, message = ?, updated_at = ?
		WHERE id = ?`,
		alert.Severity, alert.ThresholdValue, alert.ActualValue, alert.Message, time.Now(), existing.ID,
	)
	if err != nil {
		return nil, false, err
	}
	updated, err := GetAlertByID(existing.ID)
	return updated, false, err
}

func ResolveOpenAlert(deviceID, metric string) error {
	now := time.Now()
	_, err := MySQL.Exec(`
		UPDATE alerts
		SET status = 'resolved', resolved_at = ?, updated_at = ?
		WHERE device_id = ? AND metric = ? AND status IN ('open', 'acknowledged')`,
		now, now, deviceID, metric,
	)
	return err
}

func GetAlertByID(id string) (*model.Alert, error) {
	alert := &model.Alert{}
	err := MySQL.Get(alert, `
		SELECT
			a.*, d.name AS device_name
		FROM alerts a
		LEFT JOIN devices d ON d.id = a.device_id
		WHERE a.id = ?`,
		id,
	)
	if err != nil {
		if errors.Is(err, sql.ErrNoRows) {
			return nil, fmt.Errorf("alert not found")
		}
		return nil, err
	}
	return alert, nil
}

func ListAlerts(f AlertFilter) ([]model.Alert, int, error) {
	if f.Page < 1 {
		f.Page = 1
	}
	if f.Limit < 1 || f.Limit > 100 {
		f.Limit = 20
	}

	query := `
		SELECT
			a.*, d.name AS device_name
		FROM alerts a
		LEFT JOIN devices d ON d.id = a.device_id
		WHERE 1=1`
	countQuery := `SELECT COUNT(*) FROM alerts a WHERE 1=1`
	args := []interface{}{}

	if f.DeviceID != "" {
		query += ` AND a.device_id = ?`
		countQuery += ` AND a.device_id = ?`
		args = append(args, f.DeviceID)
	}
	if f.Severity != "" {
		query += ` AND a.severity = ?`
		countQuery += ` AND a.severity = ?`
		args = append(args, f.Severity)
	}
	if f.Status != "" {
		query += ` AND a.status = ?`
		countQuery += ` AND a.status = ?`
		args = append(args, f.Status)
	}

	var total int
	if err := MySQL.Get(&total, countQuery, args...); err != nil {
		return nil, 0, err
	}

	offset := (f.Page - 1) * f.Limit
	query += ` ORDER BY a.created_at DESC LIMIT ? OFFSET ?`
	args = append(args, f.Limit, offset)

	var alerts []model.Alert
	err := MySQL.Select(&alerts, query, args...)
	return alerts, total, err
}

func AcknowledgeAlert(id string) (*model.Alert, error) {
	now := time.Now()
	_, err := MySQL.Exec(`
		UPDATE alerts
		SET status = 'acknowledged', acknowledged_at = ?, updated_at = ?
		WHERE id = ? AND status = 'open'`,
		now, now, id,
	)
	if err != nil {
		return nil, err
	}
	return GetAlertByID(id)
}

func ResolveAlert(id string) (*model.Alert, error) {
	now := time.Now()
	_, err := MySQL.Exec(`
		UPDATE alerts
		SET status = 'resolved', resolved_at = ?, updated_at = ?
		WHERE id = ? AND status IN ('open', 'acknowledged')`,
		now, now, id,
	)
	if err != nil {
		return nil, err
	}
	return GetAlertByID(id)
}

func UpdateAlertNotes(id, notes string) (*model.Alert, error) {
	_, err := MySQL.Exec(`
		UPDATE alerts
		SET notes = ?, updated_at = ?
		WHERE id = ?`,
		notes, time.Now(), id,
	)
	if err != nil {
		return nil, err
	}
	return GetAlertByID(id)
}

func DeleteAlert(id string) error {
	result, err := MySQL.Exec(`DELETE FROM alerts WHERE id = ?`, id)
	if err != nil {
		return err
	}
	affected, err := result.RowsAffected()
	if err != nil {
		return err
	}
	if affected == 0 {
		return fmt.Errorf("alert not found")
	}
	return nil
}
