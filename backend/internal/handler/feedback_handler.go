package handler

import (
	"strconv"

	"github.com/gofiber/fiber/v2"
	"github.com/yourorg/netmon/internal/auth"
	"github.com/yourorg/netmon/internal/model"
	"github.com/yourorg/netmon/internal/repository"
)

// POST /api/feedbacks
func CreateFeedback(c *fiber.Ctx) error {
	claims := c.Locals("claims").(*auth.Claims)

	var req model.CreateFeedbackRequest
	if err := c.BodyParser(&req); err != nil {
		return c.Status(fiber.StatusBadRequest).JSON(fiber.Map{
			"error": "Format request tidak valid",
		})
	}
	if req.Title == "" || req.Description == "" {
		return c.Status(fiber.StatusBadRequest).JSON(fiber.Map{
			"error": "Judul dan deskripsi wajib diisi",
		})
	}

	validCats := map[model.FeedbackCategory]bool{
		model.FeedbackCategoryNetwork:  true,
		model.FeedbackCategoryHardware: true,
		model.FeedbackCategorySoftware: true,
		model.FeedbackCategoryOther:    true,
	}
	if !validCats[req.Category] {
		req.Category = model.FeedbackCategoryOther
	}

	fb, err := repository.CreateFeedback(claims.UserID, req)
	if err != nil {
		return c.Status(fiber.StatusInternalServerError).JSON(fiber.Map{
			"error": "Gagal membuat laporan",
		})
	}

	return c.Status(fiber.StatusCreated).JSON(fiber.Map{
		"message": "Laporan berhasil dikirim",
		"data":    fb,
	})
}

// GET /api/feedbacks
func ListFeedbacks(c *fiber.Ctx) error {
	claims := c.Locals("claims").(*auth.Claims)

	page, _ := strconv.Atoi(c.Query("page", "1"))
	limit, _ := strconv.Atoi(c.Query("limit", "20"))
	status := c.Query("status", "")
	category := c.Query("category", "")

	if page < 1 {
		page = 1
	}
	if limit < 1 || limit > 100 {
		limit = 20
	}

	fbs, total, err := repository.ListFeedbacks(page, limit, claims.UserID, claims.Role, status, category)
	if err != nil {
		return c.Status(fiber.StatusInternalServerError).JSON(fiber.Map{
			"error": "Gagal mengambil data laporan",
		})
	}

	return c.JSON(fiber.Map{
		"data": fbs,
		"meta": fiber.Map{
			"total": total,
			"page":  page,
			"limit": limit,
			"pages": (total + limit - 1) / limit,
		},
	})
}

// GET /api/feedbacks/:id
func GetFeedback(c *fiber.Ctx) error {
	claims := c.Locals("claims").(*auth.Claims)
	id := c.Params("id")

	fb, err := repository.GetFeedbackByID(id)
	if err != nil {
		return c.Status(fiber.StatusNotFound).JSON(fiber.Map{
			"error": err.Error(),
		})
	}

	// Karyawan hanya bisa lihat miliknya sendiri
	if claims.Role == model.RoleKaryawan && fb.UserID != claims.UserID {
		return c.Status(fiber.StatusForbidden).JSON(fiber.Map{
			"error": "Akses ditolak",
		})
	}

	return c.JSON(fiber.Map{"data": fb})
}

// PUT /api/feedbacks/:id  (teknisi, staff, atasan, admin)
func UpdateFeedback(c *fiber.Ctx) error {
	claims := c.Locals("claims").(*auth.Claims)
	id := c.Params("id")

	fb, err := repository.GetFeedbackByID(id)
	if err != nil {
		return c.Status(fiber.StatusNotFound).JSON(fiber.Map{
			"error": err.Error(),
		})
	}

	var req model.UpdateFeedbackRequest
	if err := c.BodyParser(&req); err != nil {
		return c.Status(fiber.StatusBadRequest).JSON(fiber.Map{
			"error": "Format request tidak valid",
		})
	}

	// Karyawan hanya bisa update miliknya sendiri dan hanya boleh menutup
	if claims.Role == model.RoleKaryawan {
		if fb.UserID != claims.UserID {
			return c.Status(fiber.StatusForbidden).JSON(fiber.Map{
				"error": "Anda hanya dapat mengupdate laporan sendiri",
			})
		}
		// karyawan hanya boleh menutup laporan sendiri
		req = model.UpdateFeedbackRequest{Status: model.FeedbackStatusClosed}
	}

	updated, err := repository.UpdateFeedback(id, req)
	if err != nil {
		return c.Status(fiber.StatusInternalServerError).JSON(fiber.Map{
			"error": "Gagal mengupdate laporan",
		})
	}

	return c.JSON(fiber.Map{
		"message": "Laporan berhasil diupdate",
		"data":    updated,
	})
}

// DELETE /api/feedbacks/:id  (admin only)
func DeleteFeedback(c *fiber.Ctx) error {
	id := c.Params("id")

	if _, err := repository.GetFeedbackByID(id); err != nil {
		return c.Status(fiber.StatusNotFound).JSON(fiber.Map{
			"error": "Laporan tidak ditemukan",
		})
	}

	if err := repository.DeleteFeedback(id); err != nil {
		return c.Status(fiber.StatusInternalServerError).JSON(fiber.Map{
			"error": "Gagal menghapus laporan",
		})
	}

	return c.JSON(fiber.Map{"message": "Laporan berhasil dihapus"})
}
