package handler

import (
	"strings"

	"github.com/gofiber/fiber/v2"
	"github.com/yourorg/netmon/internal/auth"
	"github.com/yourorg/netmon/internal/model"
	"github.com/yourorg/netmon/internal/repository"
	"github.com/yourorg/netmon/internal/service/monitor"
)

// POST /api/network/ping
func Ping(c *fiber.Ctx) error {
	claims := c.Locals("claims").(*auth.Claims)

	var req model.PingRequest
	if err := c.BodyParser(&req); err != nil {
		return c.Status(fiber.StatusBadRequest).JSON(fiber.Map{
			"error": "Format request tidak valid",
		})
	}
	if req.DeviceID == "" && req.Host == "" {
		return c.Status(fiber.StatusBadRequest).JSON(fiber.Map{
			"error": "Host atau device_id wajib diisi",
		})
	}

	var result *model.PingResult
	var err error
	if req.DeviceID != "" {
		device, getErr := repository.GetDeviceByID(req.DeviceID)
		if getErr != nil {
			return c.Status(fiber.StatusNotFound).JSON(fiber.Map{"error": getErr.Error()})
		}
		result, err = monitor.ExecutePingForDevice(claims.UserID, *device)
	} else {
		result, err = monitor.ExecutePing(claims.UserID, req)
	}
	if err != nil {
		return c.Status(fiber.StatusBadRequest).JSON(fiber.Map{
			"error": err.Error(),
		})
	}

	return c.JSON(fiber.Map{
		"message": "Ping selesai",
		"data":    result,
	})
}

// POST /api/network/snmp
func SNMPGet(c *fiber.Ctx) error {
	claims := c.Locals("claims").(*auth.Claims)

	var req model.SNMPRequest
	if err := c.BodyParser(&req); err != nil {
		return c.Status(fiber.StatusBadRequest).JSON(fiber.Map{
			"error": "Format request tidak valid",
		})
	}
	if req.DeviceID == "" && req.Host == "" {
		return c.Status(fiber.StatusBadRequest).JSON(fiber.Map{
			"error": "Host atau device_id wajib diisi",
		})
	}
	if req.DeviceID == "" && len(req.OIDs) == 0 {
		return c.Status(fiber.StatusBadRequest).JSON(fiber.Map{
			"error": "Minimal satu OID wajib diisi",
		})
	}

	var result *model.SNMPResult
	var err error
	if req.DeviceID != "" {
		device, getErr := repository.GetDeviceByID(req.DeviceID)
		if getErr != nil {
			return c.Status(fiber.StatusNotFound).JSON(fiber.Map{"error": getErr.Error()})
		}
		result, err = monitor.ExecuteSNMPForDevice(claims.UserID, *device)
	} else {
		result, err = monitor.ExecuteSNMP(claims.UserID, req)
	}
	if err != nil {
		return c.Status(fiber.StatusInternalServerError).JSON(fiber.Map{
			"error": err.Error(),
		})
	}

	return c.JSON(fiber.Map{
		"message": "SNMP GET selesai",
		"data":    result,
	})
}

// POST /api/network/http-get
func HTTPGet(c *fiber.Ctx) error {
	claims := c.Locals("claims").(*auth.Claims)

	var req model.HTTPGetRequest
	if err := c.BodyParser(&req); err != nil {
		return c.Status(fiber.StatusBadRequest).JSON(fiber.Map{
			"error": "Format request tidak valid",
		})
	}
	if req.DeviceID == "" && req.URL == "" {
		return c.Status(fiber.StatusBadRequest).JSON(fiber.Map{
			"error": "URL atau device_id wajib diisi",
		})
	}

	var result *model.HTTPGetResult
	var err error
	if req.DeviceID != "" {
		device, getErr := repository.GetDeviceByID(req.DeviceID)
		if getErr != nil {
			return c.Status(fiber.StatusNotFound).JSON(fiber.Map{"error": getErr.Error()})
		}
		result, err = monitor.ExecuteHTTPGetForDevice(claims.UserID, *device)
	} else {
		result, err = monitor.ExecuteHTTPGet(claims.UserID, req)
	}
	if err != nil {
		return c.Status(fiber.StatusBadRequest).JSON(fiber.Map{
			"error": err.Error(),
		})
	}

	return c.JSON(fiber.Map{
		"message": "HTTP GET selesai",
		"data":    result,
	})
}

// GET /api/network/snmp/oids  - common OID reference
func SNMPOIDs(c *fiber.Ctx) error {
	return c.JSON(fiber.Map{
		"message": "Daftar OID umum",
		"data":    monitor.CommonOIDs(),
	})
}

// GET /api/network/logs
func NetworkLogs(c *fiber.Ctx) error {
	claims := c.Locals("claims").(*auth.Claims)

	page := c.QueryInt("page", 1)
	limit := c.QueryInt("limit", 50)
	action := c.Query("action", "")
	deviceID := c.Query("device_id", "")
	status := c.Query("status", "")
	search := c.Query("q", c.Query("search", ""))

	// Teknisi & staff bisa lihat semua; karyawan hanya miliknya
	userID := ""
	if claims.Role == model.RoleKaryawan || claims.Role == model.RoleStaff {
		userID = claims.UserID
	}

	logs, total, err := repository.ListNetworkLogs(repository.NetworkLogFilter{
		UserID:   userID,
		DeviceID: deviceID,
		Action:   action,
		Status:   status,
		Search:   search,
		Page:     page,
		Limit:    limit,
	})
	if err != nil {
		return c.Status(fiber.StatusInternalServerError).JSON(fiber.Map{
			"error": "Gagal mengambil log jaringan",
		})
	}

	return c.JSON(fiber.Map{
		"data": logs,
		"meta": fiber.Map{
			"total": total,
			"page":  page,
			"limit": limit,
			"pages": (total + int64(limit) - 1) / int64(limit),
		},
	})
}

// DELETE /api/network/logs
func ClearNetworkLogs(c *fiber.Ctx) error {
	if err := repository.ClearNetworkLogs(); err != nil {
		return c.Status(fiber.StatusInternalServerError).JSON(fiber.Map{
			"error": "Gagal menghapus log jaringan",
		})
	}

	return c.JSON(fiber.Map{"message": "Log jaringan berhasil dikosongkan"})
}

// GET /api/network/monitor-targets
func MonitorTargets(c *fiber.Ctx) error {
	devices, err := repository.ListMonitorTargets()
	if err != nil {
		return c.Status(fiber.StatusInternalServerError).JSON(fiber.Map{
			"error": "Gagal mengambil monitor target",
		})
	}
	return c.JSON(fiber.Map{"data": devices})
}

// GET /api/network/scheduler/status
func MonitorSchedulerStatus(c *fiber.Ctx) error {
	return c.JSON(fiber.Map{"data": monitor.DefaultSchedulerStatus()})
}

// GET /api/network/stats  (atasan, admin)
func NetworkStats(c *fiber.Ctx) error {
	stats, err := repository.GetNetworkStats()
	if err != nil {
		return c.Status(fiber.StatusInternalServerError).JSON(fiber.Map{
			"error": "Gagal mengambil statistik jaringan",
		})
	}
	return c.JSON(fiber.Map{"data": stats})
}

// GET /api/network/device-history
func NetworkDeviceHistory(c *fiber.Ctx) error {
	points, err := repository.GetNetworkDeviceHistory(
		c.Query("device_id", ""),
		c.Query("range", "24h"),
	)
	if err != nil {
		return c.Status(fiber.StatusInternalServerError).JSON(fiber.Map{
			"error": "Gagal mengambil histori device",
		})
	}

	return c.JSON(fiber.Map{"data": points})
}

// GET /api/network/interfaces
func NetworkInterfaces(c *fiber.Ctx) error {
	statuses, err := monitor.ListLocalInterfaces(interfaceNamesFromQuery(c))
	if err != nil {
		return c.Status(fiber.StatusInternalServerError).JSON(fiber.Map{
			"error": "Gagal membaca interface lokal",
		})
	}

	return c.JSON(fiber.Map{"data": statuses})
}

// GET /api/network/interfaces/:name
func NetworkInterface(c *fiber.Ctx) error {
	status := monitor.ReadLocalInterface(c.Params("name"))
	if status.IsUp == nil && status.Reason != nil {
		return c.JSON(fiber.Map{
			"data":   nil,
			"reason": *status.Reason,
		})
	}
	return c.JSON(fiber.Map{"data": status})
}

// POST /api/network/interfaces/check
func CheckNetworkInterfaces(c *fiber.Ctx) error {
	claims := c.Locals("claims").(*auth.Claims)
	statuses, err := monitor.MonitorLocalInterfaces(claims.UserID, interfaceNamesFromQuery(c))
	if err != nil {
		return c.Status(fiber.StatusInternalServerError).JSON(fiber.Map{
			"error": "Gagal menyimpan log interface lokal",
		})
	}

	return c.JSON(fiber.Map{
		"message": "Interface lokal selesai dicek",
		"data":    statuses,
	})
}

func interfaceNamesFromQuery(c *fiber.Ctx) []string {
	raw := c.Query("interfaces", c.Query("names", ""))
	if raw == "" {
		raw = c.Query("interface", "")
	}
	if raw == "" {
		return nil
	}
	parts := strings.Split(raw, ",")
	names := make([]string, 0, len(parts))
	for _, part := range parts {
		part = strings.TrimSpace(part)
		if part != "" {
			names = append(names, part)
		}
	}
	return names
}
