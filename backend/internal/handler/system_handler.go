package handler

import (
	"github.com/gofiber/fiber/v2"
	"github.com/yourorg/netmon/internal/repository"
)

// GET /api/system/storage
func SystemStorage(c *fiber.Ctx) error {
	return c.JSON(fiber.Map{"data": repository.GetStorageOverview()})
}
