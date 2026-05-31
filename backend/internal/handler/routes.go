package handler

import (
	"github.com/gofiber/fiber/v2"
	"github.com/yourorg/netmon/internal/middleware"
	"github.com/yourorg/netmon/internal/model"
)

func SetupRoutes(app *fiber.App) {
	api := app.Group("/api")

	// ─── Health ──────────────────────────────────────────────────────────────
	api.Get("/health", func(c *fiber.Ctx) error {
		return c.JSON(fiber.Map{
			"status":  "ok",
			"service": "NetMon API",
		})
	})

	// ─── Auth (public) ────────────────────────────────────────────────────────
	authGroup := api.Group("/auth")
	authGroup.Post("/login", Login)
	authGroup.Post("/register", Register)

	// ─── Protected routes ─────────────────────────────────────────────────────
	protected := api.Use(middleware.JWTProtected())

	// Profile (semua role)
	protected.Get("/auth/me", Me)

	// ─── User Management (admin only) ─────────────────────────────────────────
	users := protected.Group("/users")
	users.Get("/roles", GetRoles) // semua bisa lihat daftar role
	users.Get("/",
		middleware.RequirePermission(model.PermUserRead),
		ListUsers,
	)
	users.Get("/:id",
		middleware.RequirePermission(model.PermUserRead),
		GetUser,
	)
	users.Post("/",
		middleware.RequirePermission(model.PermUserCreate),
		CreateUser,
	)
	users.Put("/:id",
		middleware.RequirePermission(model.PermUserUpdate),
		UpdateUser,
	)
	users.Delete("/:id",
		middleware.RequirePermission(model.PermUserDelete),
		DeleteUser,
	)

	// ─── Feedback / Keluhan ───────────────────────────────────────────────────
	fb := protected.Group("/feedbacks")
	fb.Post("/",
		middleware.RequirePermission(model.PermFeedbackCreate),
		CreateFeedback,
	)
	fb.Get("/",
		middleware.RequirePermission(model.PermFeedbackRead),
		ListFeedbacks,
	)
	fb.Get("/:id",
		middleware.RequirePermission(model.PermFeedbackRead),
		GetFeedback,
	)
	fb.Put("/:id",
		middleware.RequirePermission(model.PermFeedbackRead), // semua yg bisa read, bisa update (logic di handler)
		UpdateFeedback,
	)
	fb.Delete("/:id",
		middleware.RequirePermission(model.PermFeedbackManage),
		DeleteFeedback,
	)

	// ─── Device Management / Monitor Targets ─────────────────────────────────
	devices := protected.Group("/devices")
	devices.Get("/",
		middleware.RequirePermission(model.PermDeviceRead),
		ListDevices,
	)
	devices.Get("/:id",
		middleware.RequirePermission(model.PermDeviceRead),
		GetDevice,
	)
	devices.Post("/",
		middleware.RequirePermission(model.PermDeviceManage),
		CreateDevice,
	)
	devices.Put("/:id",
		middleware.RequirePermission(model.PermDeviceManage),
		UpdateDevice,
	)
	devices.Delete("/:id",
		middleware.RequirePermission(model.PermDeviceManage),
		DeleteDevice,
	)

	// ─── Alerting ─────────────────────────────────────────────────────────────
	alerts := protected.Group("/alerts")
	alerts.Get("/",
		middleware.RequirePermission(model.PermAlertRead),
		ListAlerts,
	)
	alerts.Get("/:id",
		middleware.RequirePermission(model.PermAlertRead),
		GetAlert,
	)
	alerts.Post("/:id/ack",
		middleware.RequirePermission(model.PermAlertManage),
		AcknowledgeAlert,
	)
	alerts.Post("/:id/resolve",
		middleware.RequirePermission(model.PermAlertManage),
		ResolveAlert,
	)
	alerts.Put("/:id/notes",
		middleware.RequirePermission(model.PermAlertManage),
		UpdateAlertNotes,
	)
	alerts.Delete("/:id",
		middleware.RequirePermission(model.PermAlertManage),
		DeleteAlert,
	)

	// ─── Network Tools ────────────────────────────────────────────────────────
	net := protected.Group("/network")
	net.Post("/ping",
		middleware.RequirePermission(model.PermPing),
		Ping,
	)
	net.Post("/snmp",
		middleware.RequirePermission(model.PermSNMP),
		SNMPGet,
	)
	net.Post("/http-get",
		middleware.RequirePermission(model.PermHTTP),
		HTTPGet,
	)
	net.Get("/snmp/oids",
		middleware.RequirePermission(model.PermSNMP),
		SNMPOIDs,
	)
	net.Get("/logs",
		middleware.RequirePermission(model.PermPing),
		NetworkLogs,
	)
	net.Delete("/logs",
		middleware.RequirePermission(model.PermLogManage),
		ClearNetworkLogs,
	)
	net.Get("/monitor-targets",
		middleware.RequirePermission(model.PermDeviceRead),
		MonitorTargets,
	)
	net.Get("/scheduler/status",
		middleware.RequirePermission(model.PermReportRead),
		MonitorSchedulerStatus,
	)
	net.Get("/stats",
		middleware.RequirePermission(model.PermReportRead),
		NetworkStats,
	)
	net.Get("/device-history",
		middleware.RequirePermission(model.PermReportRead),
		NetworkDeviceHistory,
	)
	net.Get("/interfaces",
		middleware.RequirePermission(model.PermReportRead),
		NetworkInterfaces,
	)
	net.Post("/interfaces/check",
		middleware.RequirePermission(model.PermReportRead),
		CheckNetworkInterfaces,
	)
	net.Get("/interfaces/:name",
		middleware.RequirePermission(model.PermReportRead),
		NetworkInterface,
	)
}
