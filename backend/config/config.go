package config

import (
	"log"
	"os"
	"strconv"

	"github.com/joho/godotenv"
)

type Config struct {
	AppPort   string
	AppEnv    string
	JWTSecret string

	MySQLHost     string
	MySQLPort     string
	MySQLUser     string
	MySQLPassword string
	MySQLDBName   string

	ClickHouseHost     string
	ClickHousePort     string
	ClickHouseUser     string
	ClickHousePassword string
	ClickHouseDBName   string

	MonitorSchedulerEnabled      bool
	MonitorIntervalSeconds       int
	LocalInterfaceMonitorEnabled bool
	LocalInterfaceNames          string

	AlertWebhookURL       string
	AlertTelegramBotToken string
	AlertTelegramChatID   string
	AlertEmailSMTPHost    string
	AlertEmailSMTPPort    string
	AlertEmailUsername    string
	AlertEmailPassword    string
	AlertEmailFrom        string
	AlertEmailTo          string

	// Default users
	DefaultAdminUsername string
	DefaultAdminEmail    string
	DefaultAdminPassword string

	DefaultStaffUsername string
	DefaultStaffEmail    string
	DefaultStaffPassword string

	DefaultKaryawanUsername string
	DefaultKaryawanEmail    string
	DefaultKaryawanPassword string

	DefaultTeknisiUsername string
	DefaultTeknisiEmail    string
	DefaultTeknisiPassword string

	DefaultAtasanUsername string
	DefaultAtasanEmail    string
	DefaultAtasanPassword string
}

var App *Config

func Load() {
	if err := godotenv.Load(); err != nil {
		log.Println("[CONFIG] .env file not found, using environment variables")
	}

	App = &Config{
		AppPort:   getEnv("APP_PORT", "3000"),
		AppEnv:    getEnv("APP_ENV", "development"),
		JWTSecret: getEnv("JWT_SECRET", "default_jwt_secret"),

		MySQLHost:     getEnv("MYSQL_HOST", "localhost"),
		MySQLPort:     getEnv("MYSQL_PORT", "3306"),
		MySQLUser:     getEnv("MYSQL_USER", "root"),
		MySQLPassword: getEnv("MYSQL_PASSWORD", ""),
		MySQLDBName:   getEnv("MYSQL_DBNAME", "netmon"),

		ClickHouseHost:     getEnv("CLICKHOUSE_HOST", "localhost"),
		ClickHousePort:     getEnv("CLICKHOUSE_PORT", "9000"),
		ClickHouseUser:     getEnv("CLICKHOUSE_USER", "default"),
		ClickHousePassword: getEnv("CLICKHOUSE_PASSWORD", ""),
		ClickHouseDBName:   getEnv("CLICKHOUSE_DBNAME", "netmon"),

		MonitorSchedulerEnabled:      getEnvBool("MONITOR_SCHEDULER_ENABLED", true),
		MonitorIntervalSeconds:       getEnvInt("MONITOR_INTERVAL_SECONDS", 10),
		LocalInterfaceMonitorEnabled: getEnvBool("LOCAL_INTERFACE_MONITOR_ENABLED", true),
		LocalInterfaceNames:          getEnv("LOCAL_INTERFACE_NAMES", ""),

		AlertWebhookURL:       getEnv("ALERT_WEBHOOK_URL", ""),
		AlertTelegramBotToken: getEnv("ALERT_TELEGRAM_BOT_TOKEN", ""),
		AlertTelegramChatID:   getEnv("ALERT_TELEGRAM_CHAT_ID", ""),
		AlertEmailSMTPHost:    getEnv("ALERT_EMAIL_SMTP_HOST", ""),
		AlertEmailSMTPPort:    getEnv("ALERT_EMAIL_SMTP_PORT", "587"),
		AlertEmailUsername:    getEnv("ALERT_EMAIL_USERNAME", ""),
		AlertEmailPassword:    getEnv("ALERT_EMAIL_PASSWORD", ""),
		AlertEmailFrom:        getEnv("ALERT_EMAIL_FROM", ""),
		AlertEmailTo:          getEnv("ALERT_EMAIL_TO", ""),

		DefaultAdminUsername: getEnv("DEFAULT_ADMIN_USERNAME", "admin"),
		DefaultAdminEmail:    getEnv("DEFAULT_ADMIN_EMAIL", "admin@netmon.local"),
		DefaultAdminPassword: getEnv("DEFAULT_ADMIN_PASSWORD", "Admin@123!"),

		DefaultStaffUsername: getEnv("DEFAULT_STAFF_USERNAME", "staff01"),
		DefaultStaffEmail:    getEnv("DEFAULT_STAFF_EMAIL", "staff@netmon.local"),
		DefaultStaffPassword: getEnv("DEFAULT_STAFF_PASSWORD", "Staff@123!"),

		DefaultKaryawanUsername: getEnv("DEFAULT_KARYAWAN_USERNAME", "karyawan01"),
		DefaultKaryawanEmail:    getEnv("DEFAULT_KARYAWAN_EMAIL", "karyawan@netmon.local"),
		DefaultKaryawanPassword: getEnv("DEFAULT_KARYAWAN_PASSWORD", "Karyawan@123!"),

		DefaultTeknisiUsername: getEnv("DEFAULT_TEKNISI_USERNAME", "teknisi01"),
		DefaultTeknisiEmail:    getEnv("DEFAULT_TEKNISI_EMAIL", "teknisi@netmon.local"),
		DefaultTeknisiPassword: getEnv("DEFAULT_TEKNISI_PASSWORD", "Teknisi@123!"),

		DefaultAtasanUsername: getEnv("DEFAULT_ATASAN_USERNAME", "atasan01"),
		DefaultAtasanEmail:    getEnv("DEFAULT_ATASAN_EMAIL", "atasan@netmon.local"),
		DefaultAtasanPassword: getEnv("DEFAULT_ATASAN_PASSWORD", "Atasan@123!"),
	}
}

func getEnv(key, defaultVal string) string {
	if val := os.Getenv(key); val != "" {
		return val
	}
	return defaultVal
}

func getEnvBool(key string, defaultVal bool) bool {
	val := os.Getenv(key)
	if val == "" {
		return defaultVal
	}

	parsed, err := strconv.ParseBool(val)
	if err != nil {
		return defaultVal
	}
	return parsed
}

func getEnvInt(key string, defaultVal int) int {
	val := os.Getenv(key)
	if val == "" {
		return defaultVal
	}

	parsed, err := strconv.Atoi(val)
	if err != nil {
		return defaultVal
	}
	return parsed
}
