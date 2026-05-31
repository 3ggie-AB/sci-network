-- ============================================================
-- SCINetwork - ClickHouse Migration
-- Run: clickhouse-client --multiquery --query "$(cat migrations/clickhouse.sql)"
-- ============================================================

CREATE DATABASE IF NOT EXISTS netmon;

-- ─── Network Logs ─────────────────────────────────────────────────────────────
-- Tabel ini menyimpan hasil ping dan SNMP dengan performa tinggi
CREATE TABLE IF NOT EXISTS netmon.network_logs (
    id         String,
    user_id    String,
    device_id  String DEFAULT '',
    action     LowCardinality(String),  -- 'ping' | 'snmp' | 'http'
    target     String,
    result     String,                  -- JSON string
    success    UInt8,                   -- 0 = false, 1 = true
    duration   Int64,                   -- milliseconds
    latency    Float64 DEFAULT 0,
    packet_loss Float64 DEFAULT 0,
    jitter     Float64 DEFAULT 0,
    response_time Int64 DEFAULT 0,
    status     LowCardinality(String) DEFAULT 'unknown', -- 'up' | 'warning' | 'critical' | 'down'
    cpu        Float64 DEFAULT 0,
    memory     Float64 DEFAULT 0,
    bandwidth_in Float64 DEFAULT 0,
    bandwidth_out Float64 DEFAULT 0,
    created_at DateTime DEFAULT now()
)
ENGINE = MergeTree()
PARTITION BY toYYYYMM(created_at)
ORDER BY (created_at, user_id, device_id, action)
TTL created_at + INTERVAL 6 MONTH     -- auto-hapus log > 6 bulan
SETTINGS index_granularity = 8192;

ALTER TABLE netmon.network_logs ADD COLUMN IF NOT EXISTS device_id String DEFAULT '' AFTER user_id;
ALTER TABLE netmon.network_logs ADD COLUMN IF NOT EXISTS latency Float64 DEFAULT 0 AFTER duration;
ALTER TABLE netmon.network_logs ADD COLUMN IF NOT EXISTS packet_loss Float64 DEFAULT 0 AFTER latency;
ALTER TABLE netmon.network_logs ADD COLUMN IF NOT EXISTS jitter Float64 DEFAULT 0 AFTER packet_loss;
ALTER TABLE netmon.network_logs ADD COLUMN IF NOT EXISTS response_time Int64 DEFAULT 0 AFTER jitter;
ALTER TABLE netmon.network_logs ADD COLUMN IF NOT EXISTS status LowCardinality(String) DEFAULT 'unknown' AFTER response_time;
ALTER TABLE netmon.network_logs ADD COLUMN IF NOT EXISTS cpu Float64 DEFAULT 0 AFTER status;
ALTER TABLE netmon.network_logs ADD COLUMN IF NOT EXISTS memory Float64 DEFAULT 0 AFTER cpu;
ALTER TABLE netmon.network_logs ADD COLUMN IF NOT EXISTS bandwidth_in Float64 DEFAULT 0 AFTER memory;
ALTER TABLE netmon.network_logs ADD COLUMN IF NOT EXISTS bandwidth_out Float64 DEFAULT 0 AFTER bandwidth_in;

-- ─── Useful views ─────────────────────────────────────────────────────────────

-- View: statistik harian per user
CREATE VIEW IF NOT EXISTS netmon.daily_stats AS
SELECT
    toDate(created_at)                           AS date,
    user_id,
    device_id,
    action,
    count()                                      AS total_requests,
    countIf(success = 1)                         AS success_count,
    countIf(success = 0)                         AS fail_count,
    round(avg(duration), 2)                      AS avg_duration_ms,
    max(duration)                                AS max_duration_ms,
    round(avgIf(latency, latency > 0), 2)        AS avg_latency_ms,
    round(avgIf(packet_loss, action = 'ping'), 2) AS avg_packet_loss,
    round(avgIf(jitter, jitter > 0), 2)          AS avg_jitter_ms,
    round(avgIf(response_time, response_time > 0), 2) AS avg_response_time_ms
FROM netmon.network_logs
GROUP BY date, user_id, device_id, action;

-- View: top targets yang dipantau
CREATE VIEW IF NOT EXISTS netmon.top_targets AS
SELECT
    target,
    device_id,
    action,
    count()                                      AS hits,
    round(countIf(success = 1) / count() * 100, 2) AS success_rate_pct,
    round(avg(duration), 2)                      AS avg_duration_ms,
    round(avgIf(latency, latency > 0), 2)        AS avg_latency_ms,
    round(avgIf(packet_loss, action = 'ping'), 2) AS avg_packet_loss,
    anyLast(status)                              AS last_status
FROM netmon.network_logs
GROUP BY target, device_id, action
ORDER BY hits DESC;
