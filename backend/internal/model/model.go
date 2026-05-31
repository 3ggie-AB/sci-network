package model

import "time"

// ─── Role ────────────────────────────────────────────────────────────────────

type Role string

const (
	RoleAdmin    Role = "admin"
	RoleStaff    Role = "staff"
	RoleKaryawan Role = "karyawan"
	RoleTeknisi  Role = "teknisi"
	RoleAtasan   Role = "atasan"
)

// ─── Permission ──────────────────────────────────────────────────────────────

type Permission string

const (
	PermPing           Permission = "ping:execute"
	PermSNMP           Permission = "snmp:execute"
	PermHTTP           Permission = "http:execute"
	PermDeviceRead     Permission = "device:read"
	PermDeviceManage   Permission = "device:manage"
	PermAlertRead      Permission = "alert:read"
	PermAlertManage    Permission = "alert:manage"
	PermLogManage      Permission = "log:manage"
	PermUserCreate     Permission = "user:create"
	PermUserRead       Permission = "user:read"
	PermUserUpdate     Permission = "user:update"
	PermUserDelete     Permission = "user:delete"
	PermFeedbackCreate Permission = "feedback:create"
	PermFeedbackRead   Permission = "feedback:read"
	PermFeedbackManage Permission = "feedback:manage"
	PermReportRead     Permission = "report:read"
)

// RolePermissions maps each role to its allowed permissions
var RolePermissions = map[Role][]Permission{
	RoleAdmin: {
		PermPing, PermSNMP, PermHTTP,
		PermDeviceRead, PermDeviceManage,
		PermAlertRead, PermAlertManage,
		PermLogManage,
		PermUserCreate, PermUserRead, PermUserUpdate, PermUserDelete,
		PermFeedbackCreate, PermFeedbackRead, PermFeedbackManage,
		PermReportRead,
	},
	RoleAtasan: {
		PermPing, PermSNMP, PermHTTP,
		PermDeviceRead,
		PermAlertRead, PermAlertManage,
		PermUserRead,
		PermFeedbackRead, PermFeedbackManage,
		PermReportRead,
	},
	RoleTeknisi: {
		PermPing, PermSNMP, PermHTTP,
		PermDeviceRead, PermDeviceManage,
		PermAlertRead,
		PermFeedbackCreate, PermFeedbackRead,
	},
	RoleStaff: {
		PermFeedbackCreate, PermFeedbackRead,
	},
	RoleKaryawan: {
		PermFeedbackCreate,
	},
}

func HasPermission(role Role, perm Permission) bool {
	perms, ok := RolePermissions[role]
	if !ok {
		return false
	}
	for _, p := range perms {
		if p == perm {
			return true
		}
	}
	return false
}

// ─── User ─────────────────────────────────────────────────────────────────────

type User struct {
	ID        string    `db:"id"         json:"id"`
	Username  string    `db:"username"   json:"username"`
	Email     string    `db:"email"      json:"email"`
	Password  string    `db:"password"   json:"-"`
	Role      Role      `db:"role"       json:"role"`
	FullName  string    `db:"full_name"  json:"full_name"`
	IsActive  bool      `db:"is_active"  json:"is_active"`
	CreatedAt time.Time `db:"created_at" json:"created_at"`
	UpdatedAt time.Time `db:"updated_at" json:"updated_at"`
}

type CreateUserRequest struct {
	Username string `json:"username" validate:"required,min=3,max=50"`
	Email    string `json:"email"    validate:"required,email"`
	Password string `json:"password" validate:"required,min=6"`
	Role     Role   `json:"role"     validate:"required"`
	FullName string `json:"full_name"`
}

type UpdateUserRequest struct {
	Email    string `json:"email"`
	FullName string `json:"full_name"`
	Role     Role   `json:"role"`
	IsActive *bool  `json:"is_active"`
}

// ─── Auth ─────────────────────────────────────────────────────────────────────

type LoginRequest struct {
	Username string `json:"username" validate:"required"`
	Password string `json:"password" validate:"required"`
}

type LoginResponse struct {
	Token string `json:"token"`
	User  User   `json:"user"`
}

type RegisterRequest struct {
	Username string `json:"username" validate:"required,min=3,max=50"`
	Email    string `json:"email"    validate:"required,email"`
	Password string `json:"password" validate:"required,min=6"`
	FullName string `json:"full_name"`
}

// ─── Feedback / Keluhan ───────────────────────────────────────────────────────

type FeedbackStatus string

const (
	FeedbackStatusOpen       FeedbackStatus = "open"
	FeedbackStatusInProgress FeedbackStatus = "in_progress"
	FeedbackStatusResolved   FeedbackStatus = "resolved"
	FeedbackStatusClosed     FeedbackStatus = "closed"
)

type FeedbackCategory string

const (
	FeedbackCategoryNetwork  FeedbackCategory = "network"
	FeedbackCategoryHardware FeedbackCategory = "hardware"
	FeedbackCategorySoftware FeedbackCategory = "software"
	FeedbackCategoryOther    FeedbackCategory = "other"
)

type Feedback struct {
	ID          string           `db:"id"           json:"id"`
	UserID      string           `db:"user_id"      json:"user_id"`
	Title       string           `db:"title"        json:"title"`
	Description string           `db:"description"  json:"description"`
	Category    FeedbackCategory `db:"category"     json:"category"`
	Status      FeedbackStatus   `db:"status"       json:"status"`
	Priority    int              `db:"priority"     json:"priority"` // 1=low,2=medium,3=high
	AssignedTo  *string          `db:"assigned_to"  json:"assigned_to"`
	Response    *string          `db:"response"     json:"response"`
	CreatedAt   time.Time        `db:"created_at"   json:"created_at"`
	UpdatedAt   time.Time        `db:"updated_at"   json:"updated_at"`

	// Joined fields
	Username       string  `db:"username"         json:"username,omitempty"`
	AssignedToName *string `db:"assigned_to_name" json:"assigned_to_name,omitempty"`
}

type CreateFeedbackRequest struct {
	Title       string           `json:"title"       validate:"required,min=5,max=200"`
	Description string           `json:"description" validate:"required,min=10"`
	Category    FeedbackCategory `json:"category"    validate:"required"`
	Priority    int              `json:"priority"`
}

type UpdateFeedbackRequest struct {
	Status     FeedbackStatus `json:"status"`
	AssignedTo *string        `json:"assigned_to"`
	Response   *string        `json:"response"`
	Priority   *int           `json:"priority"`
}

// ─── Ping ─────────────────────────────────────────────────────────────────────

type PingRequest struct {
	DeviceID string `json:"device_id"`
	Host     string `json:"host"`
	Count    int    `json:"count"`
}

type PingResult struct {
	Host        string  `json:"host"`
	PacketsSent int     `json:"packets_sent"`
	PacketsRecv int     `json:"packets_recv"`
	PacketLoss  float64 `json:"packet_loss"`
	MinRtt      float64 `json:"min_rtt_ms"`
	MaxRtt      float64 `json:"max_rtt_ms"`
	AvgRtt      float64 `json:"avg_rtt_ms"`
	Jitter      float64 `json:"jitter_ms"`
	IsAlive     bool    `json:"is_alive"`
}

// ─── Device / Monitor Target ─────────────────────────────────────────────────

type DeviceType string

const (
	DeviceTypeServer   DeviceType = "server"
	DeviceTypeRouter   DeviceType = "router"
	DeviceTypeMikrotik DeviceType = "mikrotik"
	DeviceTypeSwitch   DeviceType = "switch"
	DeviceTypeGateway  DeviceType = "gateway"
	DeviceTypeOther    DeviceType = "other"
)

type DeviceStatus string

const (
	DeviceStatusUnknown  DeviceStatus = "unknown"
	DeviceStatusHealthy  DeviceStatus = "up"
	DeviceStatusWarning  DeviceStatus = "warning"
	DeviceStatusCritical DeviceStatus = "critical"
	DeviceStatusDown     DeviceStatus = "down"
)

type Device struct {
	ID                     string       `db:"id"                         json:"id"`
	Name                   string       `db:"name"                       json:"name"`
	Host                   string       `db:"host"                       json:"host"`
	Type                   DeviceType   `db:"type"                       json:"type"`
	SNMPVersion            SNMPVersion  `db:"snmp_version"               json:"snmp_version"`
	SNMPCommunity          string       `db:"snmp_community"             json:"snmp_community,omitempty"`
	SNMPPort               uint16       `db:"snmp_port"                  json:"snmp_port"`
	SNMPTimeout            int          `db:"snmp_timeout"               json:"snmp_timeout"`
	HTTPURL                string       `db:"http_url"                   json:"http_url,omitempty"`
	HTTPTimeout            int          `db:"http_timeout"               json:"http_timeout"`
	MonitorEnabled         bool         `db:"monitor_enabled"            json:"monitor_enabled"`
	PingEnabled            bool         `db:"ping_enabled"               json:"ping_enabled"`
	SNMPEnabled            bool         `db:"snmp_enabled"               json:"snmp_enabled"`
	HTTPEnabled            bool         `db:"http_enabled"               json:"http_enabled"`
	CheckIntervalSeconds   int          `db:"check_interval_seconds"     json:"check_interval_seconds"`
	PingIntervalSeconds    int          `db:"ping_interval_seconds"      json:"ping_interval_seconds"`
	SNMPIntervalSeconds    int          `db:"snmp_interval_seconds"      json:"snmp_interval_seconds"`
	HTTPIntervalSeconds    int          `db:"http_interval_seconds"      json:"http_interval_seconds"`
	PacketLossWarning      float64      `db:"packet_loss_warning"        json:"packet_loss_warning"`
	PacketLossCritical     float64      `db:"packet_loss_critical"       json:"packet_loss_critical"`
	LatencyWarningMs       float64      `db:"latency_warning_ms"         json:"latency_warning_ms"`
	LatencyCriticalMs      float64      `db:"latency_critical_ms"        json:"latency_critical_ms"`
	ResponseTimeWarningMs  float64      `db:"response_time_warning_ms"   json:"response_time_warning_ms"`
	ResponseTimeCriticalMs float64      `db:"response_time_critical_ms"  json:"response_time_critical_ms"`
	LastStatus             DeviceStatus `db:"last_status"                json:"last_status"`
	LastCheckedAt          *time.Time   `db:"last_checked_at"            json:"last_checked_at,omitempty"`
	LastPingCheckedAt      *time.Time   `db:"last_ping_checked_at"       json:"last_ping_checked_at,omitempty"`
	LastSNMPCheckedAt      *time.Time   `db:"last_snmp_checked_at"       json:"last_snmp_checked_at,omitempty"`
	LastHTTPCheckedAt      *time.Time   `db:"last_http_checked_at"       json:"last_http_checked_at,omitempty"`
	IsActive               bool         `db:"is_active"                  json:"is_active"`
	CreatedAt              time.Time    `db:"created_at"                 json:"created_at"`
	UpdatedAt              time.Time    `db:"updated_at"                 json:"updated_at"`
}

type CreateDeviceRequest struct {
	Name                   string      `json:"name" validate:"required"`
	Host                   string      `json:"host" validate:"required"`
	Type                   DeviceType  `json:"type"`
	SNMPVersion            SNMPVersion `json:"snmp_version"`
	SNMPCommunity          string      `json:"snmp_community"`
	SNMPPort               uint16      `json:"snmp_port"`
	SNMPTimeout            int         `json:"snmp_timeout"`
	HTTPURL                string      `json:"http_url"`
	HTTPTimeout            int         `json:"http_timeout"`
	MonitorEnabled         *bool       `json:"monitor_enabled"`
	PingEnabled            *bool       `json:"ping_enabled"`
	SNMPEnabled            *bool       `json:"snmp_enabled"`
	HTTPEnabled            *bool       `json:"http_enabled"`
	CheckIntervalSeconds   int         `json:"check_interval_seconds"`
	PingIntervalSeconds    int         `json:"ping_interval_seconds"`
	SNMPIntervalSeconds    int         `json:"snmp_interval_seconds"`
	HTTPIntervalSeconds    int         `json:"http_interval_seconds"`
	PacketLossWarning      float64     `json:"packet_loss_warning"`
	PacketLossCritical     float64     `json:"packet_loss_critical"`
	LatencyWarningMs       float64     `json:"latency_warning_ms"`
	LatencyCriticalMs      float64     `json:"latency_critical_ms"`
	ResponseTimeWarningMs  float64     `json:"response_time_warning_ms"`
	ResponseTimeCriticalMs float64     `json:"response_time_critical_ms"`
}

type UpdateDeviceRequest struct {
	Name                   string      `json:"name"`
	Host                   string      `json:"host"`
	Type                   DeviceType  `json:"type"`
	SNMPVersion            SNMPVersion `json:"snmp_version"`
	SNMPCommunity          *string     `json:"snmp_community"`
	SNMPPort               *uint16     `json:"snmp_port"`
	SNMPTimeout            *int        `json:"snmp_timeout"`
	HTTPURL                *string     `json:"http_url"`
	HTTPTimeout            *int        `json:"http_timeout"`
	MonitorEnabled         *bool       `json:"monitor_enabled"`
	PingEnabled            *bool       `json:"ping_enabled"`
	SNMPEnabled            *bool       `json:"snmp_enabled"`
	HTTPEnabled            *bool       `json:"http_enabled"`
	CheckIntervalSeconds   *int        `json:"check_interval_seconds"`
	PingIntervalSeconds    *int        `json:"ping_interval_seconds"`
	SNMPIntervalSeconds    *int        `json:"snmp_interval_seconds"`
	HTTPIntervalSeconds    *int        `json:"http_interval_seconds"`
	PacketLossWarning      *float64    `json:"packet_loss_warning"`
	PacketLossCritical     *float64    `json:"packet_loss_critical"`
	LatencyWarningMs       *float64    `json:"latency_warning_ms"`
	LatencyCriticalMs      *float64    `json:"latency_critical_ms"`
	ResponseTimeWarningMs  *float64    `json:"response_time_warning_ms"`
	ResponseTimeCriticalMs *float64    `json:"response_time_critical_ms"`
	IsActive               *bool       `json:"is_active"`
}

// ─── SNMP ─────────────────────────────────────────────────────────────────────

type SNMPVersion string

const (
	SNMPv1  SNMPVersion = "v1"
	SNMPv2c SNMPVersion = "v2c"
	SNMPv3  SNMPVersion = "v3"
)

type SNMPRequest struct {
	DeviceID  string      `json:"device_id"`
	Host      string      `json:"host"      validate:"required"`
	Community string      `json:"community"`
	Version   SNMPVersion `json:"version"`
	OIDs      []string    `json:"oids"      validate:"required,min=1"`
	Port      uint16      `json:"port"`
	Timeout   int         `json:"timeout"`
}

type SNMPResult struct {
	Host    string            `json:"host"`
	OIDData map[string]string `json:"oid_data"`
	Error   string            `json:"error,omitempty"`
}

// ─── HTTP GET ────────────────────────────────────────────────────────────────

type HTTPGetRequest struct {
	DeviceID string            `json:"device_id"`
	URL      string            `json:"url"     validate:"required"`
	Headers  map[string]string `json:"headers"`
	Timeout  int               `json:"timeout"`
}

type HTTPGetResult struct {
	URL           string            `json:"url"`
	StatusCode    int               `json:"status_code"`
	Status        string            `json:"status"`
	ContentType   string            `json:"content_type,omitempty"`
	Headers       map[string]string `json:"headers,omitempty"`
	Body          string            `json:"body,omitempty"`
	BodyTruncated bool              `json:"body_truncated"`
	Duration      int64             `json:"duration_ms"`
	IsUp          bool              `json:"is_up"`
	Error         string            `json:"error,omitempty"`
}

// ─── Local Interface Monitor ─────────────────────────────────────────────────

type LocalInterfaceStatus struct {
	Interface    string    `json:"interface"`
	Type         string    `json:"type"`
	Status       string    `json:"status"`
	Connected    *bool     `json:"connected"`
	IsUp         *bool     `json:"is_up"`
	Carrier      *bool     `json:"carrier"`
	OperState    *string   `json:"operstate"`
	MTU          *int      `json:"mtu"`
	HardwareAddr *string   `json:"hardware_addr"`
	Reason       *string   `json:"reason"`
	CheckedAt    time.Time `json:"checked_at"`
}

// ─── Alerts ───────────────────────────────────────────────────────────────────

type AlertSeverity string

const (
	AlertSeverityInfo     AlertSeverity = "info"
	AlertSeverityWarning  AlertSeverity = "warning"
	AlertSeverityCritical AlertSeverity = "critical"
)

type AlertStatus string

const (
	AlertStatusOpen         AlertStatus = "open"
	AlertStatusAcknowledged AlertStatus = "acknowledged"
	AlertStatusResolved     AlertStatus = "resolved"
)

type Alert struct {
	ID             string        `db:"id"              json:"id"`
	DeviceID       string        `db:"device_id"       json:"device_id"`
	DeviceName     string        `db:"device_name"     json:"device_name,omitempty"`
	Severity       AlertSeverity `db:"severity"        json:"severity"`
	Status         AlertStatus   `db:"status"          json:"status"`
	Metric         string        `db:"metric"          json:"metric"`
	ThresholdValue float64       `db:"threshold_value" json:"threshold_value"`
	ActualValue    float64       `db:"actual_value"    json:"actual_value"`
	Message        string        `db:"message"         json:"message"`
	Notes          *string       `db:"notes"           json:"notes,omitempty"`
	CreatedAt      time.Time     `db:"created_at"      json:"created_at"`
	UpdatedAt      time.Time     `db:"updated_at"      json:"updated_at"`
	AcknowledgedAt *time.Time    `db:"acknowledged_at" json:"acknowledged_at,omitempty"`
	ResolvedAt     *time.Time    `db:"resolved_at"     json:"resolved_at,omitempty"`
}

type UpdateAlertNotesRequest struct {
	Notes string `json:"notes"`
}

// ─── Network Log (ClickHouse) ─────────────────────────────────────────────────

type NetworkLog struct {
	ID           string    `db:"id"            json:"id"`
	UserID       string    `db:"user_id"       json:"user_id"`
	DeviceID     string    `db:"device_id"     json:"device_id,omitempty"`
	Action       string    `db:"action"        json:"action"` // ping / snmp / http
	Target       string    `db:"target"        json:"target"`
	Result       string    `db:"result"        json:"result"` // JSON
	Success      bool      `db:"success"       json:"success"`
	Duration     int64     `db:"duration"      json:"duration_ms"`
	Latency      float64   `db:"latency"       json:"latency_ms"`
	PacketLoss   float64   `db:"packet_loss"   json:"packet_loss"`
	Jitter       float64   `db:"jitter"        json:"jitter_ms"`
	ResponseTime int64     `db:"response_time" json:"response_time_ms"`
	Status       string    `db:"status"        json:"status"`
	CPU          float64   `db:"cpu"           json:"cpu"`
	Memory       float64   `db:"memory"        json:"memory"`
	BandwidthIn  float64   `db:"bandwidth_in"  json:"bandwidth_in"`
	BandwidthOut float64   `db:"bandwidth_out" json:"bandwidth_out"`
	CreatedAt    time.Time `db:"created_at"    json:"timestamp"`
}

type MonitorSchedulerStatus struct {
	Enabled         bool       `json:"enabled"`
	Running         bool       `json:"running"`
	IntervalSeconds int        `json:"interval_seconds"`
	LastRunAt       *time.Time `json:"last_run_at,omitempty"`
	LastError       string     `json:"last_error,omitempty"`
}
