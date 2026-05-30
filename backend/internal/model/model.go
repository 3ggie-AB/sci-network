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
	PermPing          Permission = "ping:execute"
	PermSNMP          Permission = "snmp:execute"
	PermUserCreate    Permission = "user:create"
	PermUserRead      Permission = "user:read"
	PermUserUpdate    Permission = "user:update"
	PermUserDelete    Permission = "user:delete"
	PermFeedbackCreate Permission = "feedback:create"
	PermFeedbackRead  Permission = "feedback:read"
	PermFeedbackManage Permission = "feedback:manage"
	PermReportRead    Permission = "report:read"
)

// RolePermissions maps each role to its allowed permissions
var RolePermissions = map[Role][]Permission{
	RoleAdmin: {
		PermPing, PermSNMP,
		PermUserCreate, PermUserRead, PermUserUpdate, PermUserDelete,
		PermFeedbackCreate, PermFeedbackRead, PermFeedbackManage,
		PermReportRead,
	},
	RoleAtasan: {
		PermPing, PermSNMP,
		PermUserRead,
		PermFeedbackRead, PermFeedbackManage,
		PermReportRead,
	},
	RoleTeknisi: {
		PermPing, PermSNMP,
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
	Username        string  `db:"username"         json:"username,omitempty"`
	AssignedToName  *string `db:"assigned_to_name" json:"assigned_to_name,omitempty"`
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
	Host  string `json:"host"  validate:"required"`
	Count int    `json:"count"`
}

type PingResult struct {
	Host        string  `json:"host"`
	PacketsSent int     `json:"packets_sent"`
	PacketsRecv int     `json:"packets_recv"`
	PacketLoss  float64 `json:"packet_loss"`
	MinRtt      float64 `json:"min_rtt_ms"`
	MaxRtt      float64 `json:"max_rtt_ms"`
	AvgRtt      float64 `json:"avg_rtt_ms"`
	IsAlive     bool    `json:"is_alive"`
}

// ─── SNMP ─────────────────────────────────────────────────────────────────────

type SNMPVersion string

const (
	SNMPv1  SNMPVersion = "v1"
	SNMPv2c SNMPVersion = "v2c"
	SNMPv3  SNMPVersion = "v3"
)

type SNMPRequest struct {
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

// ─── Network Log (ClickHouse) ─────────────────────────────────────────────────

type NetworkLog struct {
	ID        string    `db:"id"         json:"id"`
	UserID    string    `db:"user_id"    json:"user_id"`
	Action    string    `db:"action"     json:"action"` // ping / snmp
	Target    string    `db:"target"     json:"target"`
	Result    string    `db:"result"     json:"result"` // JSON
	Success   bool      `db:"success"    json:"success"`
	Duration  int64     `db:"duration"   json:"duration"` // ms
	CreatedAt time.Time `db:"created_at" json:"created_at"`
}
