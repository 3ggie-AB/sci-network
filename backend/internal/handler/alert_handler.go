package handler

import (
	"github.com/gofiber/fiber/v2"
	"github.com/yourorg/netmon/internal/model"
	"github.com/yourorg/netmon/internal/repository"
)

// GET /api/alerts
func ListAlerts(c *fiber.Ctx) error {
	page := c.QueryInt("page", 1)
	limit := c.QueryInt("limit", 20)
	if page < 1 {
		page = 1
	}
	if limit < 1 || limit > 100 {
		limit = 20
	}

	alerts, total, err := repository.ListAlerts(repository.AlertFilter{
		DeviceID: c.Query("device_id", ""),
		Severity: c.Query("severity", ""),
		Status:   c.Query("status", ""),
		Page:     page,
		Limit:    limit,
	})
	if err != nil {
		return c.Status(fiber.StatusInternalServerError).JSON(fiber.Map{
			"error": "Gagal mengambil alert",
		})
	}

	return c.JSON(fiber.Map{
		"data": alerts,
		"meta": fiber.Map{
			"total": total,
			"page":  page,
			"limit": limit,
			"pages": (total + limit - 1) / limit,
		},
	})
}

// GET /api/alerts/:id
func GetAlert(c *fiber.Ctx) error {
	alert, err := repository.GetAlertByID(c.Params("id"))
	if err != nil {
		return c.Status(fiber.StatusNotFound).JSON(fiber.Map{
			"error": err.Error(),
		})
	}
	return c.JSON(fiber.Map{"data": alert})
}

// POST /api/alerts/:id/ack
func AcknowledgeAlert(c *fiber.Ctx) error {
	alert, err := repository.AcknowledgeAlert(c.Params("id"))
	if err != nil {
		return c.Status(fiber.StatusInternalServerError).JSON(fiber.Map{
			"error": "Gagal acknowledge alert",
		})
	}
	return c.JSON(fiber.Map{
		"message": "Alert berhasil di-acknowledge",
		"data":    alert,
	})
}

// POST /api/alerts/:id/resolve
func ResolveAlert(c *fiber.Ctx) error {
	alert, err := repository.ResolveAlert(c.Params("id"))
	if err != nil {
		return c.Status(fiber.StatusInternalServerError).JSON(fiber.Map{
			"error": "Gagal resolve alert",
		})
	}
	return c.JSON(fiber.Map{
		"message": "Alert berhasil di-resolve",
		"data":    alert,
	})
}

// PUT /api/alerts/:id/notes
func UpdateAlertNotes(c *fiber.Ctx) error {
	var req model.UpdateAlertNotesRequest
	if err := c.BodyParser(&req); err != nil {
		return c.Status(fiber.StatusBadRequest).JSON(fiber.Map{
			"error": "Format request tidak valid",
		})
	}

	alert, err := repository.UpdateAlertNotes(c.Params("id"), req.Notes)
	if err != nil {
		return c.Status(fiber.StatusInternalServerError).JSON(fiber.Map{
			"error": "Gagal update catatan alert",
		})
	}

	return c.JSON(fiber.Map{
		"message": "Catatan alert berhasil disimpan",
		"data":    alert,
	})
}

// DELETE /api/alerts/:id
func DeleteAlert(c *fiber.Ctx) error {
	if err := repository.DeleteAlert(c.Params("id")); err != nil {
		return c.Status(fiber.StatusInternalServerError).JSON(fiber.Map{
			"error": "Gagal menghapus alert",
		})
	}

	return c.JSON(fiber.Map{"message": "Alert berhasil dihapus"})
}
