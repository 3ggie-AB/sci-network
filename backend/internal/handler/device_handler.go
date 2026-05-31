package handler

import (
	"strconv"

	"github.com/gofiber/fiber/v2"
	"github.com/yourorg/netmon/internal/model"
	"github.com/yourorg/netmon/internal/repository"
)

// GET /api/devices
func ListDevices(c *fiber.Ctx) error {
	page := c.QueryInt("page", 1)
	limit := c.QueryInt("limit", 20)
	if page < 1 {
		page = 1
	}
	if limit < 1 || limit > 100 {
		limit = 20
	}

	filter := repository.DeviceFilter{
		Type:  c.Query("type", ""),
		Page:  page,
		Limit: limit,
	}
	if raw := c.Query("monitor_enabled", ""); raw != "" {
		value, err := strconv.ParseBool(raw)
		if err == nil {
			filter.MonitorEnabled = &value
		}
	}
	if raw := c.Query("is_active", ""); raw != "" {
		value, err := strconv.ParseBool(raw)
		if err == nil {
			filter.IsActive = &value
		}
	}

	devices, total, err := repository.ListDevices(filter)
	if err != nil {
		return c.Status(fiber.StatusInternalServerError).JSON(fiber.Map{
			"error": "Gagal mengambil data device",
		})
	}

	return c.JSON(fiber.Map{
		"data": devices,
		"meta": fiber.Map{
			"total": total,
			"page":  page,
			"limit": limit,
			"pages": (total + limit - 1) / limit,
		},
	})
}

// GET /api/devices/:id
func GetDevice(c *fiber.Ctx) error {
	device, err := repository.GetDeviceByID(c.Params("id"))
	if err != nil {
		return c.Status(fiber.StatusNotFound).JSON(fiber.Map{
			"error": err.Error(),
		})
	}
	return c.JSON(fiber.Map{"data": device})
}

// POST /api/devices
func CreateDevice(c *fiber.Ctx) error {
	var req model.CreateDeviceRequest
	if err := c.BodyParser(&req); err != nil {
		return c.Status(fiber.StatusBadRequest).JSON(fiber.Map{
			"error": "Format request tidak valid",
		})
	}
	if req.Name == "" || req.Host == "" {
		return c.Status(fiber.StatusBadRequest).JSON(fiber.Map{
			"error": "Name dan host wajib diisi",
		})
	}

	device, err := repository.CreateDevice(req)
	if err != nil {
		return c.Status(fiber.StatusInternalServerError).JSON(fiber.Map{
			"error": "Gagal membuat device",
		})
	}

	return c.Status(fiber.StatusCreated).JSON(fiber.Map{
		"message": "Device berhasil dibuat",
		"data":    device,
	})
}

// PUT /api/devices/:id
func UpdateDevice(c *fiber.Ctx) error {
	var req model.UpdateDeviceRequest
	if err := c.BodyParser(&req); err != nil {
		return c.Status(fiber.StatusBadRequest).JSON(fiber.Map{
			"error": "Format request tidak valid",
		})
	}

	device, err := repository.UpdateDevice(c.Params("id"), req)
	if err != nil {
		return c.Status(fiber.StatusInternalServerError).JSON(fiber.Map{
			"error": "Gagal update device: " + err.Error(),
		})
	}

	return c.JSON(fiber.Map{
		"message": "Device berhasil diupdate",
		"data":    device,
	})
}

// DELETE /api/devices/:id
func DeleteDevice(c *fiber.Ctx) error {
	if err := repository.DeleteDevice(c.Params("id")); err != nil {
		return c.Status(fiber.StatusInternalServerError).JSON(fiber.Map{
			"error": "Gagal menghapus device",
		})
	}

	return c.JSON(fiber.Map{"message": "Device berhasil dinonaktifkan"})
}
