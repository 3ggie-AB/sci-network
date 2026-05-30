package middleware

import (
	"strings"

	"github.com/gofiber/fiber/v2"
	"github.com/yourorg/netmon/internal/auth"
	"github.com/yourorg/netmon/internal/model"
)

const ClaimsKey = "claims"

// JWTProtected validates JWT token and stores claims in context
func JWTProtected() fiber.Handler {
	return func(c *fiber.Ctx) error {
		header := c.Get("Authorization")
		if header == "" {
			return c.Status(fiber.StatusUnauthorized).JSON(fiber.Map{
				"error": "Authorization header diperlukan",
			})
		}

		parts := strings.SplitN(header, " ", 2)
		if len(parts) != 2 || strings.ToLower(parts[0]) != "bearer" {
			return c.Status(fiber.StatusUnauthorized).JSON(fiber.Map{
				"error": "Format token tidak valid, gunakan: Bearer <token>",
			})
		}

		claims, err := auth.ParseToken(parts[1])
		if err != nil {
			return c.Status(fiber.StatusUnauthorized).JSON(fiber.Map{
				"error": "Token tidak valid atau sudah kadaluarsa",
			})
		}

		c.Locals(ClaimsKey, claims)
		return c.Next()
	}
}

// GetClaims extracts claims from fiber context
func GetClaims(c *fiber.Ctx) *auth.Claims {
	return c.Locals(ClaimsKey).(*auth.Claims)
}

// RequirePermission checks RBAC permissions
func RequirePermission(perm model.Permission) fiber.Handler {
	return func(c *fiber.Ctx) error {
		claims := GetClaims(c)
		if claims == nil {
			return c.Status(fiber.StatusUnauthorized).JSON(fiber.Map{
				"error": "Unauthorized",
			})
		}

		if !model.HasPermission(claims.Role, perm) {
			return c.Status(fiber.StatusForbidden).JSON(fiber.Map{
				"error": "Akses ditolak, role Anda tidak memiliki izin untuk aksi ini",
				"required_permission": perm,
				"your_role": claims.Role,
			})
		}

		return c.Next()
	}
}

// RequireRole allows access only for specific roles
func RequireRole(roles ...model.Role) fiber.Handler {
	return func(c *fiber.Ctx) error {
		claims := GetClaims(c)
		if claims == nil {
			return c.Status(fiber.StatusUnauthorized).JSON(fiber.Map{"error": "Unauthorized"})
		}

		for _, r := range roles {
			if claims.Role == r {
				return c.Next()
			}
		}

		return c.Status(fiber.StatusForbidden).JSON(fiber.Map{
			"error": "Akses ditolak",
		})
	}
}
