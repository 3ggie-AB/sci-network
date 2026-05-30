package handler

import (
	"strconv"

	"github.com/gofiber/fiber/v2"
	"github.com/yourorg/netmon/internal/auth"
	"github.com/yourorg/netmon/internal/model"
	"github.com/yourorg/netmon/internal/repository"
)

// GET /api/users
func ListUsers(c *fiber.Ctx) error {
	page, _ := strconv.Atoi(c.Query("page", "1"))
	limit, _ := strconv.Atoi(c.Query("limit", "20"))
	role := c.Query("role", "")

	if page < 1 {
		page = 1
	}
	if limit < 1 || limit > 100 {
		limit = 20
	}

	users, total, err := repository.ListUsers(page, limit, role)
	if err != nil {
		return c.Status(fiber.StatusInternalServerError).JSON(fiber.Map{
			"error": "Gagal mengambil data user",
		})
	}

	return c.JSON(fiber.Map{
		"data": users,
		"meta": fiber.Map{
			"total": total,
			"page":  page,
			"limit": limit,
			"pages": (total + limit - 1) / limit,
		},
	})
}

// GET /api/users/:id
func GetUser(c *fiber.Ctx) error {
	id := c.Params("id")
	user, err := repository.GetUserByID(id)
	if err != nil {
		return c.Status(fiber.StatusNotFound).JSON(fiber.Map{
			"error": err.Error(),
		})
	}
	return c.JSON(fiber.Map{"data": user})
}

// POST /api/users  (admin only)
func CreateUser(c *fiber.Ctx) error {
	var req model.CreateUserRequest
	if err := c.BodyParser(&req); err != nil {
		return c.Status(fiber.StatusBadRequest).JSON(fiber.Map{
			"error": "Format request tidak valid",
		})
	}

	// Validate required fields
	if req.Username == "" || req.Email == "" || req.Password == "" {
		return c.Status(fiber.StatusBadRequest).JSON(fiber.Map{
			"error": "Username, email, dan password wajib diisi",
		})
	}

	// Validate role
	validRoles := map[model.Role]bool{
		model.RoleAdmin:    true,
		model.RoleStaff:    true,
		model.RoleKaryawan: true,
		model.RoleTeknisi:  true,
		model.RoleAtasan:   true,
	}
	if !validRoles[req.Role] {
		return c.Status(fiber.StatusBadRequest).JSON(fiber.Map{
			"error": "Role tidak valid. Pilihan: admin, staff, karyawan, teknisi, atasan",
		})
	}

	exists, _ := repository.UserExistsByUsernameOrEmail(req.Username, req.Email)
	if exists {
		return c.Status(fiber.StatusConflict).JSON(fiber.Map{
			"error": "Username atau email sudah digunakan",
		})
	}

	user, err := repository.CreateUser(req)
	if err != nil {
		return c.Status(fiber.StatusInternalServerError).JSON(fiber.Map{
			"error": "Gagal membuat user",
		})
	}

	return c.Status(fiber.StatusCreated).JSON(fiber.Map{
		"message": "User berhasil dibuat",
		"data":    user,
	})
}

// PUT /api/users/:id  (admin only)
func UpdateUser(c *fiber.Ctx) error {
	id := c.Params("id")

	// Admin tidak bisa edit dirinya sendiri via endpoint ini (gunakan /profile)
	claims := c.Locals("claims").(*auth.Claims)
	if claims.UserID == id && claims.Role != model.RoleAdmin {
		return c.Status(fiber.StatusForbidden).JSON(fiber.Map{
			"error": "Gunakan endpoint /api/profile untuk update data diri sendiri",
		})
	}

	var req model.UpdateUserRequest
	if err := c.BodyParser(&req); err != nil {
		return c.Status(fiber.StatusBadRequest).JSON(fiber.Map{
			"error": "Format request tidak valid",
		})
	}

	// Validate role if provided
	if req.Role != "" {
		validRoles := map[model.Role]bool{
			model.RoleAdmin:    true,
			model.RoleStaff:    true,
			model.RoleKaryawan: true,
			model.RoleTeknisi:  true,
			model.RoleAtasan:   true,
		}
		if !validRoles[req.Role] {
			return c.Status(fiber.StatusBadRequest).JSON(fiber.Map{
				"error": "Role tidak valid",
			})
		}
	}

	user, err := repository.UpdateUser(id, req)
	if err != nil {
		return c.Status(fiber.StatusInternalServerError).JSON(fiber.Map{
			"error": "Gagal update user: " + err.Error(),
		})
	}

	return c.JSON(fiber.Map{
		"message": "User berhasil diupdate",
		"data":    user,
	})
}

// DELETE /api/users/:id  (admin only, soft delete)
func DeleteUser(c *fiber.Ctx) error {
	id := c.Params("id")

	// Prevent self-delete
	claims := c.Locals("claims").(*auth.Claims)
	if claims.UserID == id {
		return c.Status(fiber.StatusBadRequest).JSON(fiber.Map{
			"error": "Tidak dapat menghapus akun sendiri",
		})
	}

	if err := repository.DeleteUser(id); err != nil {
		return c.Status(fiber.StatusInternalServerError).JSON(fiber.Map{
			"error": "Gagal menghapus user",
		})
	}

	return c.JSON(fiber.Map{"message": "User berhasil dinonaktifkan"})
}

// GET /api/users/roles  - list all roles & permissions
func GetRoles(c *fiber.Ctx) error {
	roles := []fiber.Map{}
	for role, perms := range model.RolePermissions {
		permStrs := make([]string, len(perms))
		for i, p := range perms {
			permStrs[i] = string(p)
		}
		roles = append(roles, fiber.Map{
			"role":        role,
			"permissions": permStrs,
		})
	}
	return c.JSON(fiber.Map{"data": roles})
}
