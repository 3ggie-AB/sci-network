package handler

import (
	"github.com/gofiber/fiber/v2"
	"github.com/yourorg/netmon/internal/auth"
	"github.com/yourorg/netmon/internal/model"
	"github.com/yourorg/netmon/internal/repository"
	"github.com/yourorg/netmon/internal/service"
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
	if req.Host == "" {
		return c.Status(fiber.StatusBadRequest).JSON(fiber.Map{
			"error": "Host wajib diisi",
		})
	}

	result, err := service.ExecutePing(claims.UserID, req)
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
	if req.Host == "" {
		return c.Status(fiber.StatusBadRequest).JSON(fiber.Map{
			"error": "Host wajib diisi",
		})
	}
	if len(req.OIDs) == 0 {
		return c.Status(fiber.StatusBadRequest).JSON(fiber.Map{
			"error": "Minimal satu OID wajib diisi",
		})
	}

	result, err := service.ExecuteSNMP(claims.UserID, req)
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
	if req.URL == "" {
		return c.Status(fiber.StatusBadRequest).JSON(fiber.Map{
			"error": "URL wajib diisi",
		})
	}

	result, err := service.ExecuteHTTPGet(claims.UserID, req)
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
		"data":    service.CommonOIDs(),
	})
}

// GET /api/network/logs
func NetworkLogs(c *fiber.Ctx) error {
	claims := c.Locals("claims").(*auth.Claims)

	page := c.QueryInt("page", 1)
	limit := c.QueryInt("limit", 50)
	action := c.Query("action", "")

	// Teknisi & staff bisa lihat semua; karyawan hanya miliknya
	userID := ""
	if claims.Role == model.RoleKaryawan || claims.Role == model.RoleStaff {
		userID = claims.UserID
	}

	logs, err := repository.ListNetworkLogs(repository.NetworkLogFilter{
		UserID: userID,
		Action: action,
		Page:   page,
		Limit:  limit,
	})
	if err != nil {
		return c.Status(fiber.StatusInternalServerError).JSON(fiber.Map{
			"error": "Gagal mengambil log jaringan",
		})
	}

	return c.JSON(fiber.Map{"data": logs})
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
