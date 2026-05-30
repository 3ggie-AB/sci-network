package config

import (
	"log"
	"os"

	"github.com/joho/godotenv"
)

type Config struct {
	AppPort    string
	AppEnv     string
	JWTSecret  string

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
