package service

import (
	"log"

	"github.com/yourorg/netmon/config"
	"github.com/yourorg/netmon/internal/model"
	"github.com/yourorg/netmon/internal/repository"
)

type defaultUser struct {
	Username string
	Email    string
	Password string
	FullName string
	Role     model.Role
}

// SeedDefaultUsers creates default users on startup if they don't exist
func SeedDefaultUsers() {
	cfg := config.App

	defaults := []defaultUser{
		{
			Username: cfg.DefaultAdminUsername,
			Email:    cfg.DefaultAdminEmail,
			Password: cfg.DefaultAdminPassword,
			FullName: "Administrator",
			Role:     model.RoleAdmin,
		},
		{
			Username: cfg.DefaultAtasanUsername,
			Email:    cfg.DefaultAtasanEmail,
			Password: cfg.DefaultAtasanPassword,
			FullName: "Atasan",
			Role:     model.RoleAtasan,
		},
		{
			Username: cfg.DefaultTeknisiUsername,
			Email:    cfg.DefaultTeknisiEmail,
			Password: cfg.DefaultTeknisiPassword,
			FullName: "Teknisi IT",
			Role:     model.RoleTeknisi,
		},
		{
			Username: cfg.DefaultStaffUsername,
			Email:    cfg.DefaultStaffEmail,
			Password: cfg.DefaultStaffPassword,
			FullName: "Staff",
			Role:     model.RoleStaff,
		},
		{
			Username: cfg.DefaultKaryawanUsername,
			Email:    cfg.DefaultKaryawanEmail,
			Password: cfg.DefaultKaryawanPassword,
			FullName: "Karyawan",
			Role:     model.RoleKaryawan,
		},
	}

	log.Println("[SEEDER] Memeriksa default users...")
	created := 0

	for _, du := range defaults {
		exists, err := repository.UserExistsByUsernameOrEmail(du.Username, du.Email)
		if err != nil {
			log.Printf("[SEEDER] Error cek user %s: %v", du.Username, err)
			continue
		}
		if exists {
			log.Printf("[SEEDER] User '%s' sudah ada, skip", du.Username)
			continue
		}

		_, err = repository.CreateUser(model.CreateUserRequest{
			Username: du.Username,
			Email:    du.Email,
			Password: du.Password,
			FullName: du.FullName,
			Role:     du.Role,
		})
		if err != nil {
			log.Printf("[SEEDER] Gagal membuat user '%s': %v", du.Username, err)
			continue
		}

		log.Printf("[SEEDER] ✓ User '%s' [%s] berhasil dibuat", du.Username, du.Role)
		created++
	}

	if created > 0 {
		log.Printf("[SEEDER] %d default user berhasil dibuat", created)
	} else {
		log.Println("[SEEDER] Semua default user sudah ada")
	}
}
