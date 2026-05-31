package main

import (
	"context"
	"fmt"
	"log"
	"os"
	"os/signal"
	"syscall"
	"time"

	"github.com/gofiber/fiber/v2"
	"github.com/gofiber/fiber/v2/middleware/cors"
	"github.com/gofiber/fiber/v2/middleware/limiter"
	"github.com/gofiber/fiber/v2/middleware/logger"
	"github.com/gofiber/fiber/v2/middleware/recover"
	"github.com/yourorg/netmon/config"
	"github.com/yourorg/netmon/internal/handler"
	"github.com/yourorg/netmon/internal/repository"
	"github.com/yourorg/netmon/internal/service"
	"github.com/yourorg/netmon/internal/service/monitor"
)

func main() {
	// ── 1. Load Config ────────────────────────────────────────────────────────
	config.Load()
	cfg := config.App

	log.Printf("╔══════════════════════════════════════╗")
	log.Printf("║       SCINetwork API Starting        ║")
	log.Printf("║          Env: %-22s ║", cfg.AppEnv)
	log.Printf("╚══════════════════════════════════════╝")

	// ── 2. Init Database ──────────────────────────────────────────────────────
	repository.InitMySQL()
	repository.InitClickHouse()

	// ── 3. Seed Default Users ─────────────────────────────────────────────────
	service.SeedDefaultUsers()

	// ── 4. Start Monitoring Scheduler ─────────────────────────────────────────
	schedulerCtx, cancelScheduler := context.WithCancel(context.Background())
	scheduler := monitor.NewScheduler(cfg.MonitorSchedulerEnabled, cfg.MonitorIntervalSeconds)
	monitor.SetDefaultScheduler(scheduler)
	scheduler.Start(schedulerCtx)

	// ── 5. Setup Fiber App ────────────────────────────────────────────────────
	app := fiber.New(fiber.Config{
		AppName:      "SCINetwork API v1.0",
		ReadTimeout:  30 * time.Second,
		WriteTimeout: 30 * time.Second,
		ErrorHandler: func(c *fiber.Ctx, err error) error {
			code := fiber.StatusInternalServerError
			if e, ok := err.(*fiber.Error); ok {
				code = e.Code
			}
			return c.Status(code).JSON(fiber.Map{
				"error": err.Error(),
			})
		},
	})

	// ── 6. Global Middleware ──────────────────────────────────────────────────
	app.Use(recover.New())

	app.Use(logger.New(logger.Config{
		Format:     "[${time}] ${status} ${method} ${path} ${latency}\n",
		TimeFormat: "2006-01-02 15:04:05",
	}))

	app.Use(cors.New(cors.Config{
		AllowOrigins: "*",
		AllowHeaders: "Origin, Content-Type, Accept, Authorization",
		AllowMethods: "GET, POST, PUT, DELETE, OPTIONS",
	}))

	// Rate limiter: max 100 req/menit per IP
	app.Use(limiter.New(limiter.Config{
		Max:        100,
		Expiration: 1 * time.Minute,
		KeyGenerator: func(c *fiber.Ctx) string {
			return c.IP()
		},
		LimitReached: func(c *fiber.Ctx) error {
			return c.Status(fiber.StatusTooManyRequests).JSON(fiber.Map{
				"error": "Terlalu banyak request, coba lagi dalam 1 menit",
			})
		},
	}))

	// ── 7. Register Routes ────────────────────────────────────────────────────
	handler.SetupRoutes(app)

	// 404 handler
	app.Use(func(c *fiber.Ctx) error {
		return c.Status(fiber.StatusNotFound).JSON(fiber.Map{
			"error": fmt.Sprintf("Route %s %s tidak ditemukan", c.Method(), c.Path()),
		})
	})

	// ── 8. Start Server (graceful shutdown) ───────────────────────────────────
	quit := make(chan os.Signal, 1)
	signal.Notify(quit, os.Interrupt, syscall.SIGTERM)

	go func() {
		addr := fmt.Sprintf(":%s", cfg.AppPort)
		log.Printf("[APP] Server berjalan di http://localhost%s", addr)
		if err := app.Listen(addr); err != nil {
			log.Fatalf("[APP] Server error: %v", err)
		}
	}()

	<-quit
	log.Println("[APP] Shutting down gracefully...")
	cancelScheduler()
	scheduler.Stop()

	if err := app.Shutdown(); err != nil {
		log.Fatalf("[APP] Shutdown error: %v", err)
	}

	log.Println("[APP] Server berhasil dihentikan")
}
