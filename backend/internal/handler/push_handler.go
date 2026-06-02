package handler

import (
	"github.com/gofiber/fiber/v2"
	"github.com/yourorg/netmon/internal/middleware"
	"github.com/yourorg/netmon/internal/model"
	"github.com/yourorg/netmon/internal/repository"
	"github.com/yourorg/netmon/internal/service/push"
)

// GET /api/push/public-key
func GetPushPublicKey(c *fiber.Ctx) error {
	publicKey, err := push.PublicKey()
	if err != nil {
		return c.Status(fiber.StatusInternalServerError).JSON(fiber.Map{
			"error": "Gagal menyiapkan VAPID public key",
		})
	}

	return c.JSON(fiber.Map{
		"data": fiber.Map{
			"public_key": publicKey,
		},
	})
}

// POST /api/push/subscriptions
func SavePushSubscription(c *fiber.Ctx) error {
	claims := middleware.GetClaims(c)
	var req model.PushSubscriptionRequest
	if err := c.BodyParser(&req); err != nil {
		return c.Status(fiber.StatusBadRequest).JSON(fiber.Map{
			"error": "Format request tidak valid",
		})
	}
	if req.Endpoint == "" || req.Keys.P256dh == "" || req.Keys.Auth == "" {
		return c.Status(fiber.StatusBadRequest).JSON(fiber.Map{
			"error": "Push subscription tidak lengkap",
		})
	}

	sub, err := repository.SavePushSubscription(claims.UserID, req, c.Get("User-Agent"))
	if err != nil {
		return c.Status(fiber.StatusInternalServerError).JSON(fiber.Map{
			"error": "Gagal menyimpan push subscription",
		})
	}

	return c.JSON(fiber.Map{
		"message": "Browser notification aktif",
		"data":    sub,
	})
}

// DELETE /api/push/subscriptions
func DeletePushSubscription(c *fiber.Ctx) error {
	claims := middleware.GetClaims(c)
	var req model.DeletePushSubscriptionRequest
	if err := c.BodyParser(&req); err != nil {
		return c.Status(fiber.StatusBadRequest).JSON(fiber.Map{
			"error": "Format request tidak valid",
		})
	}
	if req.Endpoint == "" {
		return c.Status(fiber.StatusBadRequest).JSON(fiber.Map{
			"error": "Endpoint subscription wajib diisi",
		})
	}

	if err := repository.DeletePushSubscription(claims.UserID, req.Endpoint); err != nil {
		return c.Status(fiber.StatusNotFound).JSON(fiber.Map{
			"error": "Push subscription tidak ditemukan",
		})
	}

	return c.JSON(fiber.Map{"message": "Browser notification dinonaktifkan"})
}
