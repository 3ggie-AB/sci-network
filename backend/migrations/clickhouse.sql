-- ============================================================
-- NetMon - ClickHouse Migration
-- Run: clickhouse-client --query "$(cat migrations/clickhouse.sql)"
-- ============================================================

CREATE DATABASE IF NOT EXISTS netmon;

-- ─── Network Logs ─────────────────────────────────────────────────────────────
-- Tabel ini menyimpan hasil ping dan SNMP dengan performa tinggi
CREATE TABLE IF NOT EXISTS netmon.network_logs (
    id         String,
    user_id    String,
    action     LowCardinality(String),  -- 'ping' | 'snmp' | 'http'
    target     String,
    result     String,                  -- JSON string
    success    UInt8,                   -- 0 = false, 1 = true
    duration   Int64,                   -- milliseconds
    created_at DateTime DEFAULT now()
)
ENGINE = MergeTree()
PARTITION BY toYYYYMM(created_at)
ORDER BY (created_at, user_id, action)
TTL created_at + INTERVAL 6 MONTH     -- auto-hapus log > 6 bulan
SETTINGS index_granularity = 8192;

-- ─── Useful views ─────────────────────────────────────────────────────────────

-- View: statistik harian per user
CREATE VIEW IF NOT EXISTS netmon.daily_stats AS
SELECT
    toDate(created_at)                           AS date,
    user_id,
    action,
    count()                                      AS total_requests,
    countIf(success = 1)                         AS success_count,
    countIf(success = 0)                         AS fail_count,
    round(avg(duration), 2)                      AS avg_duration_ms,
    max(duration)                                AS max_duration_ms
FROM netmon.network_logs
GROUP BY date, user_id, action;

-- View: top targets yang dipantau
CREATE VIEW IF NOT EXISTS netmon.top_targets AS
SELECT
    target,
    action,
    count()                                      AS hits,
    round(countIf(success = 1) / count() * 100, 2) AS success_rate_pct,
    round(avg(duration), 2)                      AS avg_duration_ms
FROM netmon.network_logs
GROUP BY target, action
ORDER BY hits DESC;
