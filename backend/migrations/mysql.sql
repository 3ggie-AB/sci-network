-- ============================================================
-- SCINetwork - MySQL Migration
-- Run: mysql -u root -p netmon < migrations/mysql.sql
-- ============================================================

CREATE DATABASE IF NOT EXISTS netmon CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
USE netmon;

-- ─── Users ────────────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS users (
    id          VARCHAR(36)  NOT NULL PRIMARY KEY,
    username    VARCHAR(50)  NOT NULL UNIQUE,
    email       VARCHAR(100) NOT NULL UNIQUE,
    password    VARCHAR(255) NOT NULL,
    role        ENUM('admin','staff','karyawan','teknisi','atasan') NOT NULL DEFAULT 'karyawan',
    full_name   VARCHAR(100) NOT NULL DEFAULT '',
    is_active   TINYINT(1)   NOT NULL DEFAULT 1,
    created_at  DATETIME     NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at  DATETIME     NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    INDEX idx_role      (role),
    INDEX idx_is_active (is_active),
    INDEX idx_email     (email)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- ─── Feedbacks / Keluhan ──────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS feedbacks (
    id           VARCHAR(36)  NOT NULL PRIMARY KEY,
    user_id      VARCHAR(36)  NOT NULL,
    title        VARCHAR(200) NOT NULL,
    description  TEXT         NOT NULL,
    category     ENUM('network','hardware','software','other') NOT NULL DEFAULT 'other',
    status       ENUM('open','in_progress','resolved','closed') NOT NULL DEFAULT 'open',
    priority     TINYINT      NOT NULL DEFAULT 1 COMMENT '1=low, 2=medium, 3=high',
    assigned_to  VARCHAR(36)  NULL,
    response     TEXT         NULL,
    created_at   DATETIME     NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at   DATETIME     NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    CONSTRAINT fk_fb_user     FOREIGN KEY (user_id)     REFERENCES users(id) ON DELETE CASCADE,
    CONSTRAINT fk_fb_assigned FOREIGN KEY (assigned_to) REFERENCES users(id) ON DELETE SET NULL,
    INDEX idx_status   (status),
    INDEX idx_category (category),
    INDEX idx_user_id  (user_id),
    INDEX idx_priority (priority)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- ─── Devices / Monitor Targets ───────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS devices (
    id                         VARCHAR(36)  NOT NULL PRIMARY KEY,
    name                       VARCHAR(100) NOT NULL,
    host                       VARCHAR(255) NOT NULL,
    type                       ENUM('server','router','mikrotik','switch','gateway','other') NOT NULL DEFAULT 'other',
    snmp_version               ENUM('v1','v2c','v3') NOT NULL DEFAULT 'v2c',
    snmp_community             VARCHAR(100) NOT NULL DEFAULT 'public',
    snmp_port                  SMALLINT UNSIGNED NOT NULL DEFAULT 161,
    snmp_timeout               INT NOT NULL DEFAULT 5,
    http_url                   VARCHAR(500) NOT NULL DEFAULT '',
    http_timeout               INT NOT NULL DEFAULT 10,
    monitor_enabled            TINYINT(1) NOT NULL DEFAULT 1,
    ping_enabled               TINYINT(1) NOT NULL DEFAULT 1,
    snmp_enabled               TINYINT(1) NOT NULL DEFAULT 0,
    http_enabled               TINYINT(1) NOT NULL DEFAULT 0,
    check_interval_seconds     INT NOT NULL DEFAULT 60,
    ping_interval_seconds      INT NOT NULL DEFAULT 60,
    snmp_interval_seconds      INT NOT NULL DEFAULT 60,
    http_interval_seconds      INT NOT NULL DEFAULT 60,
    packet_loss_warning        DECIMAL(8,2) NOT NULL DEFAULT 5.00,
    packet_loss_critical       DECIMAL(8,2) NOT NULL DEFAULT 20.00,
    latency_warning_ms         DECIMAL(10,2) NOT NULL DEFAULT 150.00,
    latency_critical_ms        DECIMAL(10,2) NOT NULL DEFAULT 500.00,
    response_time_warning_ms   DECIMAL(10,2) NOT NULL DEFAULT 1000.00,
    response_time_critical_ms  DECIMAL(10,2) NOT NULL DEFAULT 3000.00,
    last_status                ENUM('unknown','up','warning','critical','down') NOT NULL DEFAULT 'unknown',
    last_checked_at            DATETIME NULL,
    last_ping_checked_at       DATETIME NULL,
    last_snmp_checked_at       DATETIME NULL,
    last_http_checked_at       DATETIME NULL,
    is_active                  TINYINT(1) NOT NULL DEFAULT 1,
    created_at                 DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at                 DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    INDEX idx_device_host      (host),
    INDEX idx_device_type      (type),
    INDEX idx_monitor_enabled  (monitor_enabled),
    INDEX idx_last_status      (last_status),
    INDEX idx_is_active        (is_active)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

ALTER TABLE devices
    MODIFY last_status ENUM('unknown','healthy','up','warning','critical','down') NOT NULL DEFAULT 'unknown';
UPDATE devices SET last_status = 'up' WHERE last_status = 'healthy';
ALTER TABLE devices
    MODIFY last_status ENUM('unknown','up','warning','critical','down') NOT NULL DEFAULT 'unknown';
ALTER TABLE devices
    ADD COLUMN IF NOT EXISTS ping_interval_seconds INT NOT NULL DEFAULT 60 AFTER check_interval_seconds,
    ADD COLUMN IF NOT EXISTS snmp_interval_seconds INT NOT NULL DEFAULT 60 AFTER ping_interval_seconds,
    ADD COLUMN IF NOT EXISTS http_interval_seconds INT NOT NULL DEFAULT 60 AFTER snmp_interval_seconds,
    ADD COLUMN IF NOT EXISTS last_ping_checked_at DATETIME NULL AFTER last_checked_at,
    ADD COLUMN IF NOT EXISTS last_snmp_checked_at DATETIME NULL AFTER last_ping_checked_at,
    ADD COLUMN IF NOT EXISTS last_http_checked_at DATETIME NULL AFTER last_snmp_checked_at;
UPDATE devices
SET
    ping_interval_seconds = IF(ping_interval_seconds <= 0, check_interval_seconds, ping_interval_seconds),
    snmp_interval_seconds = IF(snmp_interval_seconds <= 0, check_interval_seconds, snmp_interval_seconds),
    http_interval_seconds = IF(http_interval_seconds <= 0, check_interval_seconds, http_interval_seconds);

-- ─── Alerts ──────────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS alerts (
    id              VARCHAR(36) NOT NULL PRIMARY KEY,
    device_id       VARCHAR(36) NOT NULL,
    severity        ENUM('info','warning','critical') NOT NULL DEFAULT 'warning',
    status          ENUM('open','acknowledged','resolved') NOT NULL DEFAULT 'open',
    metric          VARCHAR(50) NOT NULL,
    threshold_value DECIMAL(12,2) NOT NULL DEFAULT 0,
    actual_value    DECIMAL(12,2) NOT NULL DEFAULT 0,
    message         VARCHAR(500) NOT NULL,
    notes           TEXT NULL,
    created_at      DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at      DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    acknowledged_at DATETIME NULL,
    resolved_at     DATETIME NULL,
    CONSTRAINT fk_alert_device FOREIGN KEY (device_id) REFERENCES devices(id) ON DELETE CASCADE,
    INDEX idx_alert_device  (device_id),
    INDEX idx_alert_status  (status),
    INDEX idx_alert_severity(severity),
    INDEX idx_alert_metric  (metric),
    INDEX idx_alert_created (created_at)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

ALTER TABLE alerts
    ADD COLUMN IF NOT EXISTS notes TEXT NULL AFTER message;

-- ─── Browser Push Subscriptions ─────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS push_subscriptions (
    id            VARCHAR(36)  NOT NULL PRIMARY KEY,
    user_id       VARCHAR(36)  NOT NULL,
    endpoint      TEXT         NOT NULL,
    endpoint_hash CHAR(64)     NOT NULL,
    p256dh        VARCHAR(255) NOT NULL,
    auth          VARCHAR(255) NOT NULL,
    user_agent    VARCHAR(255) NOT NULL DEFAULT '',
    created_at    DATETIME     NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at    DATETIME     NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    last_used_at  DATETIME     NULL,
    CONSTRAINT fk_push_user FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
    UNIQUE KEY uniq_push_endpoint_hash (endpoint_hash),
    INDEX idx_push_user (user_id),
    INDEX idx_push_updated (updated_at)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
