-- ============================================================
-- NetMon - MySQL Migration
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
