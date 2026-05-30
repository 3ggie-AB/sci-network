package handler

import (
	"github.com/gofiber/fiber/v2"
	"github.com/yourorg/netmon/internal/auth"
	"github.com/yourorg/netmon/internal/model"
)

// POST /api/auth/login
func Login(c *fiber.Ctx) error {
	var req model.LoginRequest
	if err := c.BodyParser(&req); err != nil {
		return c.Status(fiber.StatusBadRequest).JSON(fiber.Map{
			"error": "Format request tidak valid",
		})
	}
	if req.Username == "" || req.Password == "" {
		return c.Status(fiber.StatusBadRequest).JSON(fiber.Map{
			"error": "Username dan password wajib diisi",
		})
	}

	resp, err := auth.Login(req)
	if err != nil {
		return c.Status(fiber.StatusUnauthorized).JSON(fiber.Map{
			"error": err.Error(),
		})
	}

	return c.JSON(fiber.Map{
		"message": "Login berhasil",
		"data":    resp,
	})
}

// POST /api/auth/register
func Register(c *fiber.Ctx) error {
	var req model.RegisterRequest
	if err := c.BodyParser(&req); err != nil {
		return c.Status(fiber.StatusBadRequest).JSON(fiber.Map{
			"error": "Format request tidak valid",
		})
	}
	if req.Username == "" || req.Email == "" || req.Password == "" {
		return c.Status(fiber.StatusBadRequest).JSON(fiber.Map{
			"error": "Username, email, dan password wajib diisi",
		})
	}
	if len(req.Password) < 6 {
		return c.Status(fiber.StatusBadRequest).JSON(fiber.Map{
			"error": "Password minimal 6 karakter",
		})
	}

	user, err := auth.Register(req)
	if err != nil {
		return c.Status(fiber.StatusConflict).JSON(fiber.Map{
			"error": err.Error(),
		})
	}

	return c.Status(fiber.StatusCreated).JSON(fiber.Map{
		"message": "Registrasi berhasil, akun Anda perlu diaktifkan oleh admin",
		"data":    user,
	})
}

// GET /api/auth/me
func Me(c *fiber.Ctx) error {
	claims := c.Locals("claims").(*auth.Claims)
	return c.JSON(fiber.Map{
		"data": fiber.Map{
			"user_id":  claims.UserID,
			"username": claims.Username,
			"role":     claims.Role,
		},
	})
}
