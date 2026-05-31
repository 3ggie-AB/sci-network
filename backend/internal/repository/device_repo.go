package repository

import (
	"database/sql"
	"errors"
	"fmt"
	"os"
	"time"

	"github.com/google/uuid"
	"github.com/yourorg/netmon/internal/model"
)

const LocalAgentDeviceID = "00000000-0000-0000-0000-000000000001"

type DeviceFilter struct {
	Type           string
	MonitorEnabled *bool
	IsActive       *bool
	Page           int
	Limit          int
}

func CreateDevice(req model.CreateDeviceRequest) (*model.Device, error) {
	device := normalizeNewDevice(req)
	device.ID = uuid.New().String()
	device.CreatedAt = time.Now()
	device.UpdatedAt = device.CreatedAt

	_, err := MySQL.Exec(`
		INSERT INTO devices (
			id, name, host, type, snmp_version, snmp_community, snmp_port, snmp_timeout,
			http_url, http_timeout, monitor_enabled, ping_enabled, snmp_enabled, http_enabled,
			check_interval_seconds, ping_interval_seconds, snmp_interval_seconds, http_interval_seconds,
			packet_loss_warning, packet_loss_critical,
			latency_warning_ms, latency_critical_ms, response_time_warning_ms,
			response_time_critical_ms, last_status, is_active, created_at, updated_at
		)
		VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
		device.ID, device.Name, device.Host, device.Type, device.SNMPVersion, device.SNMPCommunity,
		device.SNMPPort, device.SNMPTimeout, device.HTTPURL, device.HTTPTimeout,
		device.MonitorEnabled, device.PingEnabled, device.SNMPEnabled, device.HTTPEnabled,
		device.CheckIntervalSeconds, device.PingIntervalSeconds, device.SNMPIntervalSeconds, device.HTTPIntervalSeconds,
		device.PacketLossWarning, device.PacketLossCritical,
		device.LatencyWarningMs, device.LatencyCriticalMs, device.ResponseTimeWarningMs,
		device.ResponseTimeCriticalMs, device.LastStatus, device.IsActive,
		device.CreatedAt, device.UpdatedAt,
	)
	if err != nil {
		return nil, err
	}
	return device, nil
}

func GetDeviceByID(id string) (*model.Device, error) {
	device := &model.Device{}
	err := MySQL.Get(device, `SELECT * FROM devices WHERE id = ? AND is_active = 1`, id)
	if err != nil {
		if errors.Is(err, sql.ErrNoRows) {
			return nil, fmt.Errorf("device not found")
		}
		return nil, err
	}
	return device, nil
}

func ListDevices(f DeviceFilter) ([]model.Device, int, error) {
	if f.Page < 1 {
		f.Page = 1
	}
	if f.Limit < 1 || f.Limit > 100 {
		f.Limit = 20
	}

	query := `SELECT * FROM devices WHERE 1=1`
	countQuery := `SELECT COUNT(*) FROM devices WHERE 1=1`
	args := []interface{}{}

	if f.Type != "" {
		query += ` AND type = ?`
		countQuery += ` AND type = ?`
		args = append(args, f.Type)
	}
	if f.MonitorEnabled != nil {
		query += ` AND monitor_enabled = ?`
		countQuery += ` AND monitor_enabled = ?`
		args = append(args, *f.MonitorEnabled)
	}
	if f.IsActive != nil {
		query += ` AND is_active = ?`
		countQuery += ` AND is_active = ?`
		args = append(args, *f.IsActive)
	} else {
		query += ` AND is_active = 1`
		countQuery += ` AND is_active = 1`
	}

	var total int
	if err := MySQL.Get(&total, countQuery, args...); err != nil {
		return nil, 0, err
	}

	offset := (f.Page - 1) * f.Limit
	query += ` ORDER BY name ASC LIMIT ? OFFSET ?`
	args = append(args, f.Limit, offset)

	var devices []model.Device
	err := MySQL.Select(&devices, query, args...)
	return devices, total, err
}

func ListMonitorTargets() ([]model.Device, error) {
	var devices []model.Device
	err := MySQL.Select(&devices, `
		SELECT * FROM devices
		WHERE is_active = 1 AND monitor_enabled = 1
		ORDER BY name ASC`)
	return devices, err
}

func UpdateDevice(id string, req model.UpdateDeviceRequest) (*model.Device, error) {
	setClauses := []string{"updated_at = ?"}
	args := []interface{}{time.Now()}

	if req.Name != "" {
		setClauses = append(setClauses, "name = ?")
		args = append(args, req.Name)
	}
	if req.Host != "" {
		setClauses = append(setClauses, "host = ?")
		args = append(args, req.Host)
	}
	if req.Type != "" {
		setClauses = append(setClauses, "type = ?")
		args = append(args, normalizeDeviceType(req.Type))
	}
	if req.SNMPVersion != "" {
		setClauses = append(setClauses, "snmp_version = ?")
		args = append(args, normalizeSNMPVersion(req.SNMPVersion))
	}
	if req.SNMPCommunity != nil {
		setClauses = append(setClauses, "snmp_community = ?")
		args = append(args, *req.SNMPCommunity)
	}
	if req.SNMPPort != nil {
		setClauses = append(setClauses, "snmp_port = ?")
		args = append(args, normalizeSNMPPort(*req.SNMPPort))
	}
	if req.SNMPTimeout != nil {
		setClauses = append(setClauses, "snmp_timeout = ?")
		args = append(args, normalizePositiveInt(*req.SNMPTimeout, 5))
	}
	if req.HTTPURL != nil {
		setClauses = append(setClauses, "http_url = ?")
		args = append(args, *req.HTTPURL)
	}
	if req.HTTPTimeout != nil {
		setClauses = append(setClauses, "http_timeout = ?")
		args = append(args, normalizePositiveInt(*req.HTTPTimeout, 10))
	}
	if req.MonitorEnabled != nil {
		setClauses = append(setClauses, "monitor_enabled = ?")
		args = append(args, *req.MonitorEnabled)
	}
	if req.PingEnabled != nil {
		setClauses = append(setClauses, "ping_enabled = ?")
		args = append(args, *req.PingEnabled)
	}
	if req.SNMPEnabled != nil {
		setClauses = append(setClauses, "snmp_enabled = ?")
		args = append(args, *req.SNMPEnabled)
	}
	if req.HTTPEnabled != nil {
		setClauses = append(setClauses, "http_enabled = ?")
		args = append(args, *req.HTTPEnabled)
	}
	if req.CheckIntervalSeconds != nil {
		value := normalizePositiveInt(*req.CheckIntervalSeconds, 60)
		setClauses = append(setClauses, "check_interval_seconds = ?")
		args = append(args, value)
		if req.PingIntervalSeconds == nil {
			setClauses = append(setClauses, "ping_interval_seconds = ?")
			args = append(args, value)
		}
		if req.SNMPIntervalSeconds == nil {
			setClauses = append(setClauses, "snmp_interval_seconds = ?")
			args = append(args, value)
		}
		if req.HTTPIntervalSeconds == nil {
			setClauses = append(setClauses, "http_interval_seconds = ?")
			args = append(args, value)
		}
	}
	if req.PingIntervalSeconds != nil {
		setClauses = append(setClauses, "ping_interval_seconds = ?")
		args = append(args, normalizePositiveInt(*req.PingIntervalSeconds, 60))
	}
	if req.SNMPIntervalSeconds != nil {
		setClauses = append(setClauses, "snmp_interval_seconds = ?")
		args = append(args, normalizePositiveInt(*req.SNMPIntervalSeconds, 60))
	}
	if req.HTTPIntervalSeconds != nil {
		setClauses = append(setClauses, "http_interval_seconds = ?")
		args = append(args, normalizePositiveInt(*req.HTTPIntervalSeconds, 60))
	}
	if req.PacketLossWarning != nil {
		setClauses = append(setClauses, "packet_loss_warning = ?")
		args = append(args, *req.PacketLossWarning)
	}
	if req.PacketLossCritical != nil {
		setClauses = append(setClauses, "packet_loss_critical = ?")
		args = append(args, *req.PacketLossCritical)
	}
	if req.LatencyWarningMs != nil {
		setClauses = append(setClauses, "latency_warning_ms = ?")
		args = append(args, *req.LatencyWarningMs)
	}
	if req.LatencyCriticalMs != nil {
		setClauses = append(setClauses, "latency_critical_ms = ?")
		args = append(args, *req.LatencyCriticalMs)
	}
	if req.ResponseTimeWarningMs != nil {
		setClauses = append(setClauses, "response_time_warning_ms = ?")
		args = append(args, *req.ResponseTimeWarningMs)
	}
	if req.ResponseTimeCriticalMs != nil {
		setClauses = append(setClauses, "response_time_critical_ms = ?")
		args = append(args, *req.ResponseTimeCriticalMs)
	}
	if req.IsActive != nil {
		setClauses = append(setClauses, "is_active = ?")
		args = append(args, *req.IsActive)
	}

	query := fmt.Sprintf(`UPDATE devices SET %s WHERE id = ?`, joinStrings(setClauses, ", "))
	args = append(args, id)

	if _, err := MySQL.Exec(query, args...); err != nil {
		return nil, err
	}
	return GetDeviceByID(id)
}

func DeleteDevice(id string) error {
	_, err := MySQL.Exec(`UPDATE devices SET is_active = 0, updated_at = ? WHERE id = ?`, time.Now(), id)
	return err
}

func EnsureLocalAgentDevice() (*model.Device, error) {
	hostname, err := os.Hostname()
	if err != nil || hostname == "" {
		hostname = "localhost"
	}
	now := time.Now()

	_, err = MySQL.Exec(`
		INSERT INTO devices (
			id, name, host, type, snmp_version, snmp_community, snmp_port, snmp_timeout,
			http_url, http_timeout, monitor_enabled, ping_enabled, snmp_enabled, http_enabled,
			check_interval_seconds, ping_interval_seconds, snmp_interval_seconds, http_interval_seconds,
			packet_loss_warning, packet_loss_critical,
			latency_warning_ms, latency_critical_ms, response_time_warning_ms,
			response_time_critical_ms, last_status, is_active, created_at, updated_at
		)
		VALUES (?, ?, ?, 'server', 'v2c', 'public', 161, 5, '', 10, 0, 0, 0, 0, 60, 60, 60, 60, 5, 20, 150, 500, 1000, 3000, 'unknown', 0, ?, ?)
		ON DUPLICATE KEY UPDATE
			name = VALUES(name),
			host = VALUES(host),
			monitor_enabled = 0,
			ping_enabled = 0,
			snmp_enabled = 0,
			http_enabled = 0,
			is_active = 0,
			updated_at = VALUES(updated_at)`,
		LocalAgentDeviceID, "SCINetwork Local Agent", hostname, now, now,
	)
	if err != nil {
		return nil, err
	}

	device := &model.Device{}
	if err := MySQL.Get(device, `SELECT * FROM devices WHERE id = ?`, LocalAgentDeviceID); err != nil {
		return nil, err
	}
	return device, nil
}

func UpdateDeviceLastCheck(id string, status model.DeviceStatus) error {
	_, err := MySQL.Exec(`
		UPDATE devices
		SET last_status = ?, last_checked_at = ?, updated_at = ?
		WHERE id = ?`,
		status, time.Now(), time.Now(), id,
	)
	return err
}

func UpdateDeviceProbeChecks(id string, status model.DeviceStatus, probes []string) error {
	now := time.Now()
	setClauses := []string{"last_status = ?", "last_checked_at = ?", "updated_at = ?"}
	args := []interface{}{status, now, now}

	for _, probe := range probes {
		switch probe {
		case "ping":
			setClauses = append(setClauses, "last_ping_checked_at = ?")
			args = append(args, now)
		case "snmp":
			setClauses = append(setClauses, "last_snmp_checked_at = ?")
			args = append(args, now)
		case "http":
			setClauses = append(setClauses, "last_http_checked_at = ?")
			args = append(args, now)
		}
	}

	query := fmt.Sprintf(`UPDATE devices SET %s WHERE id = ?`, joinStrings(setClauses, ", "))
	args = append(args, id)
	_, err := MySQL.Exec(query, args...)
	return err
}

func normalizeNewDevice(req model.CreateDeviceRequest) *model.Device {
	monitorEnabled := true
	if req.MonitorEnabled != nil {
		monitorEnabled = *req.MonitorEnabled
	}
	pingEnabled := true
	if req.PingEnabled != nil {
		pingEnabled = *req.PingEnabled
	}
	snmpEnabled := false
	if req.SNMPEnabled != nil {
		snmpEnabled = *req.SNMPEnabled
	}
	httpEnabled := false
	if req.HTTPEnabled != nil {
		httpEnabled = *req.HTTPEnabled
	}
	checkInterval := normalizePositiveInt(req.CheckIntervalSeconds, 60)

	return &model.Device{
		Name:                   req.Name,
		Host:                   req.Host,
		Type:                   normalizeDeviceType(req.Type),
		SNMPVersion:            normalizeSNMPVersion(req.SNMPVersion),
		SNMPCommunity:          defaultString(req.SNMPCommunity, "public"),
		SNMPPort:               normalizeSNMPPort(req.SNMPPort),
		SNMPTimeout:            normalizePositiveInt(req.SNMPTimeout, 5),
		HTTPURL:                req.HTTPURL,
		HTTPTimeout:            normalizePositiveInt(req.HTTPTimeout, 10),
		MonitorEnabled:         monitorEnabled,
		PingEnabled:            pingEnabled,
		SNMPEnabled:            snmpEnabled,
		HTTPEnabled:            httpEnabled,
		CheckIntervalSeconds:   checkInterval,
		PingIntervalSeconds:    normalizePositiveInt(req.PingIntervalSeconds, checkInterval),
		SNMPIntervalSeconds:    normalizePositiveInt(req.SNMPIntervalSeconds, checkInterval),
		HTTPIntervalSeconds:    normalizePositiveInt(req.HTTPIntervalSeconds, checkInterval),
		PacketLossWarning:      defaultFloat(req.PacketLossWarning, 5),
		PacketLossCritical:     defaultFloat(req.PacketLossCritical, 20),
		LatencyWarningMs:       defaultFloat(req.LatencyWarningMs, 150),
		LatencyCriticalMs:      defaultFloat(req.LatencyCriticalMs, 500),
		ResponseTimeWarningMs:  defaultFloat(req.ResponseTimeWarningMs, 1000),
		ResponseTimeCriticalMs: defaultFloat(req.ResponseTimeCriticalMs, 3000),
		LastStatus:             model.DeviceStatusUnknown,
		IsActive:               true,
	}
}

func normalizeDeviceType(deviceType model.DeviceType) model.DeviceType {
	switch deviceType {
	case model.DeviceTypeServer, model.DeviceTypeRouter, model.DeviceTypeMikrotik,
		model.DeviceTypeSwitch, model.DeviceTypeGateway, model.DeviceTypeOther:
		return deviceType
	default:
		return model.DeviceTypeOther
	}
}

func normalizeSNMPVersion(version model.SNMPVersion) model.SNMPVersion {
	switch version {
	case model.SNMPv1, model.SNMPv2c, model.SNMPv3:
		return version
	default:
		return model.SNMPv2c
	}
}

func normalizeSNMPPort(port uint16) uint16 {
	if port == 0 {
		return 161
	}
	return port
}

func normalizePositiveInt(value, fallback int) int {
	if value <= 0 {
		return fallback
	}
	return value
}

func defaultString(value, fallback string) string {
	if value == "" {
		return fallback
	}
	return value
}

func defaultFloat(value, fallback float64) float64 {
	if value <= 0 {
		return fallback
	}
	return value
}
