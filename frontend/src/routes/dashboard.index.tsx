import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { useState } from "react";
import {
  Activity,
  AlertTriangle,
  Clock3,
  Database,
  Gauge,
  HardDrive,
  MessageSquareWarning,
  RadioTower,
  Server,
  Wifi,
} from "lucide-react";
import { CartesianGrid, Line, LineChart, XAxis, YAxis } from "recharts";

import { PageHeader } from "@/components/DashboardLayout";
import { ChartContainer, ChartTooltip, ChartTooltipContent } from "@/components/ui/chart";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { api, asArray, asObject } from "@/lib/api";

export const Route = createFileRoute("/dashboard/")({
  component: Overview,
});

type AlertSummary = {
  id?: string;
  title?: string;
  message?: string;
  severity?: string;
  status?: string;
  device_name?: string;
  created_at?: string;
};

type DeviceSummary = {
  id?: string;
  name?: string;
  host?: string;
  last_status?: string;
  status?: string;
  monitor_enabled?: boolean;
  ping_enabled?: boolean;
  snmp_enabled?: boolean;
  http_enabled?: boolean;
};

type FeedbackSummary = {
  id?: string;
};

type StorageDatabase = {
  name?: string;
  engine?: string;
  status?: string;
  size_bytes?: number;
  tables?: number;
  rows?: number;
  error?: string;
};

type StorageOverview = {
  mysql?: StorageDatabase;
  clickhouse?: StorageDatabase;
  total_bytes?: number;
  checked_at?: string;
};

type DeviceHistoryPoint = {
  bucket?: string;
  total_checks?: number;
  availability?: number;
  latency_avg_ms?: number;
  packet_loss_avg?: number;
  response_time_avg_ms?: number;
  incidents?: number;
};

const ranges = [
  { label: "1 hour", value: "1h" },
  { label: "6 hours", value: "6h" },
  { label: "24 hours", value: "24h" },
  { label: "7 days", value: "7d" },
  { label: "30 days", value: "30d" },
];

function Overview() {
  const [historyDevice, setHistoryDevice] = useState("all");
  const [historyRange, setHistoryRange] = useState("24h");

  const stats = useQuery({
    queryKey: ["network", "stats"],
    queryFn: () => api<unknown>("/api/network/stats").catch(() => null),
    refetchInterval: 30_000,
  });
  const scheduler = useQuery({
    queryKey: ["network", "scheduler"],
    queryFn: () => api<unknown>("/api/network/scheduler/status").catch(() => null),
    refetchInterval: 15_000,
  });
  const alerts = useQuery({
    queryKey: ["alerts", "open"],
    queryFn: () => api<unknown>("/api/alerts?status=open&limit=8").catch(() => null),
    refetchInterval: 15_000,
  });
  const devices = useQuery({
    queryKey: ["devices", "overview"],
    queryFn: () => api<unknown>("/api/devices?page=1&limit=100").catch(() => null),
    refetchInterval: 20_000,
  });
  const feedbacks = useQuery({
    queryKey: ["feedbacks", "overview"],
    queryFn: () => api<unknown>("/api/feedbacks?page=1&limit=100").catch(() => null),
  });
  const storage = useQuery({
    queryKey: ["system", "storage"],
    queryFn: () => api<unknown>("/api/system/storage").catch(() => null),
    refetchInterval: 30_000,
  });
  const history = useQuery({
    queryKey: ["network", "device-history", historyDevice, historyRange],
    queryFn: () => {
      const params = new URLSearchParams({ range: historyRange });
      if (historyDevice !== "all") params.set("device_id", historyDevice);
      return api<unknown>(`/api/network/device-history?${params.toString()}`).catch(() => null);
    },
    refetchInterval: 30_000,
  });

  const s = asObject(stats.data);
  const schedulerData = asObject(scheduler.data);
  const openAlerts = asArray<AlertSummary>(alerts.data);
  const deviceItems = asArray<DeviceSummary>(devices.data);
  const feedbackItems = asArray<FeedbackSummary>(feedbacks.data);
  const storageData = asObject<StorageOverview>(storage.data);
  const historyPoints = asArray<DeviceHistoryPoint>(history.data).map((point) => ({
    ...point,
    label: formatBucket(point.bucket, historyRange),
    availability: Number(point.availability ?? 0),
    latency_avg_ms: Number(point.latency_avg_ms ?? 0),
    packet_loss_avg: Number(point.packet_loss_avg ?? 0),
    response_time_avg_ms: Number(point.response_time_avg_ms ?? 0),
  }));

  const monitoredDevices = deviceItems.filter((d) => d.monitor_enabled !== false);
  const downDevices = deviceItems.filter(
    (d) => normalizeStatus(d.last_status ?? d.status) === "down",
  );
  const warningDevices = deviceItems.filter((d) =>
    ["warning", "critical"].includes(normalizeStatus(d.last_status ?? d.status)),
  );
  const checkCount = deviceItems.reduce(
    (total, d) =>
      total +
      Number(Boolean(d.ping_enabled)) +
      Number(Boolean(d.snmp_enabled)) +
      Number(Boolean(d.http_enabled)),
    0,
  );

  const tiles = [
    {
      label: "Devices",
      value: deviceItems.length,
      detail: `${monitoredDevices.length} monitored`,
      icon: Server,
    },
    {
      label: "Open Alerts",
      value: openAlerts.length,
      detail: openAlerts.some((a) => a.severity === "critical") ? "critical active" : "no critical",
      icon: AlertTriangle,
    },
    {
      label: "Availability",
      value: pct(s.availability ?? s.success_rate),
      detail: `${num(s.total_checks)} checks`,
      icon: Wifi,
    },
    {
      label: "Feedbacks",
      value: feedbackItems.length,
      detail: "user reports",
      icon: MessageSquareWarning,
    },
  ];

  const metricRows = [
    { label: "Latency avg", value: ms(s.latency_avg_ms), icon: Gauge },
    { label: "Packet loss", value: pct(s.packet_loss_avg), icon: RadioTower },
    { label: "Jitter avg", value: ms(s.jitter_avg_ms), icon: Activity },
    { label: "Response avg", value: ms(s.response_time_avg_ms), icon: Clock3 },
  ];

  return (
    <>
      <PageHeader
        title="Overview"
        description="Snapshot kondisi monitoring, target perangkat, dan alert terbaru."
      />

      <section className="mb-4 grid grid-cols-1 gap-4 xl:grid-cols-[1fr_1fr_auto]">
        <StorageCard title="MySQL Storage" data={storageData.mysql} icon={Database} />
        <StorageCard title="ClickHouse Storage" data={storageData.clickhouse} icon={HardDrive} />
        <div className="rounded-lg border border-border bg-card/70 p-5">
          <div className="flex items-center justify-between gap-3">
            <div className="font-mono text-xs uppercase tracking-widest text-muted-foreground">
              Total Storage
            </div>
            <HardDrive className="h-4 w-4 text-muted-foreground" />
          </div>
          <div className="mt-3 font-mono text-3xl font-semibold">
            {bytes(storageData.total_bytes)}
          </div>
          <div className="mt-1 text-xs text-muted-foreground">
            {storageData.checked_at ? new Date(storageData.checked_at).toLocaleTimeString() : "—"}
          </div>
        </div>
      </section>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {tiles.map((t) => {
          const Icon = t.icon;
          return (
            <div key={t.label} className="rounded-lg border border-border bg-card/70 p-5">
              <div className="flex items-center justify-between gap-3">
                <div className="font-mono text-xs uppercase tracking-widest text-muted-foreground">
                  {t.label}
                </div>
                <Icon className="h-4 w-4 text-muted-foreground" />
              </div>
              <div className="mt-3 text-3xl font-semibold">{String(t.value)}</div>
              <div className="mt-1 text-xs text-muted-foreground">{t.detail}</div>
            </div>
          );
        })}
      </div>

      <div className="mt-4 grid grid-cols-1 gap-4 xl:grid-cols-[1.4fr_1fr]">
        <section className="rounded-lg border border-border bg-card/70 p-5">
          <div className="mb-4 flex items-center justify-between gap-3">
            <div>
              <div className="text-sm font-semibold">Monitoring Health</div>
              <div className="text-xs text-muted-foreground">
                {checkCount} active checks across {deviceItems.length} devices
              </div>
            </div>
            <span
              className={`font-mono text-xs ${schedulerData.running ? "text-primary" : "text-muted-foreground"}`}
            >
              {schedulerData.running ? "scheduler running" : "scheduler idle"}
            </span>
          </div>

          <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
            {metricRows.map((row) => {
              const Icon = row.icon;
              return (
                <div key={row.label} className="rounded-md border border-border/70 p-4">
                  <div className="flex items-center justify-between">
                    <span className="text-xs text-muted-foreground">{row.label}</span>
                    <Icon className="h-4 w-4 text-muted-foreground" />
                  </div>
                  <div className="mt-2 font-mono text-2xl">{row.value}</div>
                </div>
              );
            })}
          </div>
        </section>

        <section className="rounded-lg border border-border bg-card/70 p-5">
          <div className="mb-4 flex items-center justify-between">
            <div>
              <div className="text-sm font-semibold">Device Status</div>
              <div className="text-xs text-muted-foreground">
                {downDevices.length} down, {warningDevices.length} warning/critical
              </div>
            </div>
            <Link to="/dashboard/devices" className="text-xs text-primary hover:underline">
              Manage
            </Link>
          </div>
          <div className="space-y-2">
            {deviceItems.slice(0, 6).map((device, i) => {
              const status = normalizeStatus(device.last_status ?? device.status);
              return (
                <div
                  key={device.id ?? i}
                  className="flex items-center justify-between gap-3 rounded-md border border-border/70 px-3 py-2"
                >
                  <div className="min-w-0">
                    <div className="truncate text-sm font-medium">
                      {device.name ?? device.host ?? "Device"}
                    </div>
                    <div className="truncate font-mono text-xs text-muted-foreground">
                      {device.host ?? "—"}
                    </div>
                  </div>
                  <span className={`font-mono text-xs ${statusClass(status)}`}>{status}</span>
                </div>
              );
            })}
            {deviceItems.length === 0 ? <Empty label="No devices yet" /> : null}
          </div>
        </section>
      </div>

      <section className="mt-4 rounded-lg border border-border bg-card/70 p-5">
        <div className="mb-4 flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
          <div>
            <div className="text-sm font-semibold">Device Trend</div>
            <div className="text-xs text-muted-foreground">
              Availability, latency, packet loss, dan response time berdasarkan histori log.
            </div>
          </div>
          <div className="flex flex-col gap-2 sm:flex-row">
            <Select value={historyDevice} onValueChange={setHistoryDevice}>
              <SelectTrigger className="w-full sm:w-56">
                <SelectValue placeholder="All devices" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All devices</SelectItem>
                {deviceItems.map((device, i) => (
                  <SelectItem key={device.id ?? i} value={device.id ?? "all"}>
                    {device.name ?? device.host ?? "Device"}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Select value={historyRange} onValueChange={setHistoryRange}>
              <SelectTrigger className="w-full sm:w-36">
                <SelectValue placeholder="Range" />
              </SelectTrigger>
              <SelectContent>
                {ranges.map((range) => (
                  <SelectItem key={range.value} value={range.value}>
                    {range.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>

        {historyPoints.length > 0 ? (
          <ChartContainer
            config={{
              availability: { label: "Availability", color: "var(--chart-1)" },
              latency_avg_ms: { label: "Latency", color: "var(--chart-2)" },
              packet_loss_avg: { label: "Packet loss", color: "var(--chart-4)" },
              response_time_avg_ms: { label: "Response", color: "var(--chart-5)" },
            }}
            className="h-[320px] w-full aspect-auto"
          >
            <LineChart data={historyPoints} margin={{ left: 8, right: 8, top: 12 }}>
              <CartesianGrid vertical={false} strokeDasharray="3 3" />
              <XAxis
                dataKey="label"
                tickLine={false}
                axisLine={false}
                minTickGap={24}
                tickMargin={8}
              />
              <YAxis
                yAxisId="percent"
                width={42}
                domain={[0, 100]}
                tickLine={false}
                axisLine={false}
                tickFormatter={(value) => `${value}%`}
              />
              <YAxis
                yAxisId="ms"
                orientation="right"
                width={48}
                tickLine={false}
                axisLine={false}
                tickFormatter={(value) => `${value}ms`}
              />
              <ChartTooltip content={<ChartTooltipContent />} />
              <Line
                yAxisId="percent"
                type="monotone"
                dataKey="availability"
                stroke="var(--color-availability)"
                strokeWidth={2}
                dot={false}
              />
              <Line
                yAxisId="percent"
                type="monotone"
                dataKey="packet_loss_avg"
                stroke="var(--color-packet_loss_avg)"
                strokeWidth={2}
                dot={false}
              />
              <Line
                yAxisId="ms"
                type="monotone"
                dataKey="latency_avg_ms"
                stroke="var(--color-latency_avg_ms)"
                strokeWidth={2}
                dot={false}
              />
              <Line
                yAxisId="ms"
                type="monotone"
                dataKey="response_time_avg_ms"
                stroke="var(--color-response_time_avg_ms)"
                strokeWidth={2}
                dot={false}
              />
            </LineChart>
          </ChartContainer>
        ) : (
          <Empty label="No history data for this range" />
        )}
      </section>

      <section className="mt-4 rounded-lg border border-border bg-card/70 p-5">
        <div className="mb-4 flex items-center justify-between">
          <div>
            <div className="text-sm font-semibold">Recent Open Alerts</div>
            <div className="text-xs text-muted-foreground">Latest unresolved network signals</div>
          </div>
          <Link to="/dashboard/alerts" className="text-xs text-primary hover:underline">
            View all
          </Link>
        </div>
        {openAlerts.length > 0 ? (
          <div className="divide-y divide-border">
            {openAlerts.map((a, i) => (
              <div
                key={a.id ?? i}
                className="grid grid-cols-[1fr_auto_auto] items-center gap-3 py-3 text-sm"
              >
                <div className="min-w-0">
                  <div className="truncate">{a.title ?? a.message ?? "Alert"}</div>
                  <div className="truncate font-mono text-xs text-muted-foreground">
                    {a.device_name ?? "unknown device"}
                  </div>
                </div>
                <span className={`font-mono text-xs ${statusClass(a.severity ?? "warning")}`}>
                  {a.severity ?? "warning"}
                </span>
                <span className="font-mono text-xs text-muted-foreground">
                  {a.created_at ? new Date(a.created_at).toLocaleTimeString() : "—"}
                </span>
              </div>
            ))}
          </div>
        ) : (
          <Empty label="No open alerts" />
        )}
      </section>
    </>
  );
}

function normalizeStatus(status?: string) {
  if (!status || status === "healthy" || status === "online")
    return status === "healthy" || status === "online" ? "up" : "unknown";
  return status;
}

function statusClass(status: string) {
  if (status === "up") return "text-primary";
  if (status === "warning") return "text-warning";
  if (status === "critical" || status === "down") return "text-destructive";
  return "text-muted-foreground";
}

function num(value: unknown) {
  return Number(value ?? 0).toLocaleString();
}

function pct(value: unknown) {
  const n = Number(value ?? 0);
  return `${Number.isFinite(n) ? n.toFixed(1) : "0.0"}%`;
}

function ms(value: unknown) {
  const n = Number(value ?? 0);
  return `${Number.isFinite(n) ? n.toFixed(1) : "0.0"} ms`;
}

function bytes(value: unknown) {
  const n = Number(value ?? 0);
  if (!Number.isFinite(n) || n <= 0) return "0 B";
  const units = ["B", "KB", "MB", "GB", "TB"];
  const index = Math.min(Math.floor(Math.log(n) / Math.log(1024)), units.length - 1);
  return `${(n / 1024 ** index).toFixed(index === 0 ? 0 : 1)} ${units[index]}`;
}

function formatBucket(value: unknown, range: string) {
  if (typeof value !== "string") return "—";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "—";
  if (range === "7d" || range === "30d") {
    return date.toLocaleDateString(undefined, { month: "short", day: "numeric" });
  }
  return date.toLocaleTimeString(undefined, { hour: "2-digit", minute: "2-digit" });
}

function Empty({ label }: { label: string }) {
  return (
    <div className="rounded-md border border-dashed border-border p-6 text-center text-sm text-muted-foreground">
      {label}
    </div>
  );
}

function StorageCard({
  title,
  data,
  icon: Icon,
}: {
  title: string;
  data?: StorageDatabase;
  icon: typeof Database;
}) {
  const status = data?.status ?? "unknown";
  return (
    <div className="rounded-lg border border-border bg-card/70 p-5">
      <div className="flex items-center justify-between gap-3">
        <div className="font-mono text-xs uppercase tracking-widest text-muted-foreground">
          {title}
        </div>
        <Icon className="h-4 w-4 text-muted-foreground" />
      </div>
      <div className="mt-3 flex flex-wrap items-end justify-between gap-3">
        <div>
          <div className="font-mono text-3xl font-semibold">{bytes(data?.size_bytes)}</div>
          <div className="mt-1 text-xs text-muted-foreground">
            {data?.name ?? "—"} · {num(data?.tables)} tables · {num(data?.rows)} rows
          </div>
        </div>
        <span
          className={`font-mono text-xs ${status === "ok" ? "text-primary" : "text-destructive"}`}
        >
          {status}
        </span>
      </div>
      {data?.error ? (
        <div className="mt-2 truncate text-xs text-destructive">{data.error}</div>
      ) : null}
    </div>
  );
}
