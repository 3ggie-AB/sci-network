import { jsx, jsxs, Fragment } from "react/jsx-runtime";
import { Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import * as React from "react";
import { useState } from "react";
import { Server, AlertTriangle, Wifi, MessageSquareWarning, Gauge, RadioTower, Activity, Clock3, Database, HardDrive } from "lucide-react";
import * as RechartsPrimitive from "recharts";
import { LineChart, CartesianGrid, XAxis, YAxis, Line } from "recharts";
import { P as PageHeader } from "./DashboardLayout-BIsZ7GUS.js";
import { c as cn } from "./button-BXrfXN_b.js";
import { S as Select, a as SelectTrigger, b as SelectValue, c as SelectContent, d as SelectItem } from "./select-Dn_c42EA.js";
import { a as api, b as asObject, c as asArray } from "./router-D-aI0tZc.js";
import "sonner";
import "./push-notifications-kiOw6TiQ.js";
import "@radix-ui/react-slot";
import "class-variance-authority";
import "clsx";
import "tailwind-merge";
import "@radix-ui/react-select";
const THEMES = { light: "", dark: ".dark" };
const ChartContext = React.createContext(null);
function useChart() {
  const context = React.useContext(ChartContext);
  if (!context) {
    throw new Error("useChart must be used within a <ChartContainer />");
  }
  return context;
}
const ChartContainer = React.forwardRef(({ id, className, children, config, ...props }, ref) => {
  const uniqueId = React.useId();
  const chartId = `chart-${id || uniqueId.replace(/:/g, "")}`;
  return /* @__PURE__ */ jsx(ChartContext.Provider, { value: { config }, children: /* @__PURE__ */ jsxs(
    "div",
    {
      "data-chart": chartId,
      ref,
      className: cn(
        "flex aspect-video justify-center text-xs [&_.recharts-cartesian-axis-tick_text]:fill-muted-foreground [&_.recharts-cartesian-grid_line[stroke='#ccc']]:stroke-border/50 [&_.recharts-curve.recharts-tooltip-cursor]:stroke-border [&_.recharts-dot[stroke='#fff']]:stroke-transparent [&_.recharts-layer]:outline-none [&_.recharts-polar-grid_[stroke='#ccc']]:stroke-border [&_.recharts-radial-bar-background-sector]:fill-muted [&_.recharts-rectangle.recharts-tooltip-cursor]:fill-muted [&_.recharts-reference-line_[stroke='#ccc']]:stroke-border [&_.recharts-sector[stroke='#fff']]:stroke-transparent [&_.recharts-sector]:outline-none [&_.recharts-surface]:outline-none",
        className
      ),
      ...props,
      children: [
        /* @__PURE__ */ jsx(ChartStyle, { id: chartId, config }),
        /* @__PURE__ */ jsx(RechartsPrimitive.ResponsiveContainer, { children })
      ]
    }
  ) });
});
ChartContainer.displayName = "Chart";
const ChartStyle = ({ id, config }) => {
  const colorConfig = Object.entries(config).filter(([, config2]) => config2.theme || config2.color);
  if (!colorConfig.length) {
    return null;
  }
  return /* @__PURE__ */ jsx(
    "style",
    {
      dangerouslySetInnerHTML: {
        __html: Object.entries(THEMES).map(
          ([theme, prefix]) => `
${prefix} [data-chart=${id}] {
${colorConfig.map(([key, itemConfig]) => {
            const color = itemConfig.theme?.[theme] || itemConfig.color;
            return color ? `  --color-${key}: ${color};` : null;
          }).join("\n")}
}
`
        ).join("\n")
      }
    }
  );
};
const ChartTooltip = RechartsPrimitive.Tooltip;
const ChartTooltipContent = React.forwardRef(
  ({
    active,
    payload,
    className,
    indicator = "dot",
    hideLabel = false,
    hideIndicator = false,
    label,
    labelFormatter,
    labelClassName,
    formatter,
    color,
    nameKey,
    labelKey
  }, ref) => {
    const { config } = useChart();
    const tooltipLabel = React.useMemo(() => {
      if (hideLabel || !payload?.length) {
        return null;
      }
      const [item] = payload;
      const key = `${labelKey || item?.dataKey || item?.name || "value"}`;
      const itemConfig = getPayloadConfigFromPayload(config, item, key);
      const value = !labelKey && typeof label === "string" ? config[label]?.label || label : itemConfig?.label;
      if (labelFormatter) {
        return /* @__PURE__ */ jsx("div", { className: cn("font-medium", labelClassName), children: labelFormatter(value, payload) });
      }
      if (!value) {
        return null;
      }
      return /* @__PURE__ */ jsx("div", { className: cn("font-medium", labelClassName), children: value });
    }, [label, labelFormatter, payload, hideLabel, labelClassName, config, labelKey]);
    if (!active || !payload?.length) {
      return null;
    }
    const nestLabel = payload.length === 1 && indicator !== "dot";
    return /* @__PURE__ */ jsxs(
      "div",
      {
        ref,
        className: cn(
          "grid min-w-[8rem] items-start gap-1.5 rounded-lg border border-border/50 bg-background px-2.5 py-1.5 text-xs shadow-xl",
          className
        ),
        children: [
          !nestLabel ? tooltipLabel : null,
          /* @__PURE__ */ jsx("div", { className: "grid gap-1.5", children: payload.filter((item) => item.type !== "none").map((item, index) => {
            const key = `${nameKey || item.name || item.dataKey || "value"}`;
            const itemConfig = getPayloadConfigFromPayload(config, item, key);
            const indicatorColor = color || item.payload.fill || item.color;
            return /* @__PURE__ */ jsx(
              "div",
              {
                className: cn(
                  "flex w-full flex-wrap items-stretch gap-2 [&>svg]:h-2.5 [&>svg]:w-2.5 [&>svg]:text-muted-foreground",
                  indicator === "dot" && "items-center"
                ),
                children: formatter && item?.value !== void 0 && item.name ? formatter(item.value, item.name, item, index, item.payload) : /* @__PURE__ */ jsxs(Fragment, { children: [
                  itemConfig?.icon ? /* @__PURE__ */ jsx(itemConfig.icon, {}) : !hideIndicator && /* @__PURE__ */ jsx(
                    "div",
                    {
                      className: cn(
                        "shrink-0 rounded-[2px] border-(--color-border) bg-(--color-bg)",
                        {
                          "h-2.5 w-2.5": indicator === "dot",
                          "w-1": indicator === "line",
                          "w-0 border-[1.5px] border-dashed bg-transparent": indicator === "dashed",
                          "my-0.5": nestLabel && indicator === "dashed"
                        }
                      ),
                      style: {
                        "--color-bg": indicatorColor,
                        "--color-border": indicatorColor
                      }
                    }
                  ),
                  /* @__PURE__ */ jsxs(
                    "div",
                    {
                      className: cn(
                        "flex flex-1 justify-between leading-none",
                        nestLabel ? "items-end" : "items-center"
                      ),
                      children: [
                        /* @__PURE__ */ jsxs("div", { className: "grid gap-1.5", children: [
                          nestLabel ? tooltipLabel : null,
                          /* @__PURE__ */ jsx("span", { className: "text-muted-foreground", children: itemConfig?.label || item.name })
                        ] }),
                        item.value && /* @__PURE__ */ jsx("span", { className: "font-mono font-medium tabular-nums text-foreground", children: item.value.toLocaleString() })
                      ]
                    }
                  )
                ] })
              },
              item.dataKey
            );
          }) })
        ]
      }
    );
  }
);
ChartTooltipContent.displayName = "ChartTooltip";
const ChartLegendContent = React.forwardRef(({ className, hideIcon = false, payload, verticalAlign = "bottom", nameKey }, ref) => {
  const { config } = useChart();
  if (!payload?.length) {
    return null;
  }
  return /* @__PURE__ */ jsx(
    "div",
    {
      ref,
      className: cn(
        "flex items-center justify-center gap-4",
        verticalAlign === "top" ? "pb-3" : "pt-3",
        className
      ),
      children: payload.filter((item) => item.type !== "none").map((item) => {
        const key = `${nameKey || item.dataKey || "value"}`;
        const itemConfig = getPayloadConfigFromPayload(config, item, key);
        return /* @__PURE__ */ jsxs(
          "div",
          {
            className: cn(
              "flex items-center gap-1.5 [&>svg]:h-3 [&>svg]:w-3 [&>svg]:text-muted-foreground"
            ),
            children: [
              itemConfig?.icon && !hideIcon ? /* @__PURE__ */ jsx(itemConfig.icon, {}) : /* @__PURE__ */ jsx(
                "div",
                {
                  className: "h-2 w-2 shrink-0 rounded-[2px]",
                  style: {
                    backgroundColor: item.color
                  }
                }
              ),
              itemConfig?.label
            ]
          },
          item.value
        );
      })
    }
  );
});
ChartLegendContent.displayName = "ChartLegend";
function getPayloadConfigFromPayload(config, payload, key) {
  if (typeof payload !== "object" || payload === null) {
    return void 0;
  }
  const payloadPayload = "payload" in payload && typeof payload.payload === "object" && payload.payload !== null ? payload.payload : void 0;
  let configLabelKey = key;
  if (key in payload && typeof payload[key] === "string") {
    configLabelKey = payload[key];
  } else if (payloadPayload && key in payloadPayload && typeof payloadPayload[key] === "string") {
    configLabelKey = payloadPayload[key];
  }
  return configLabelKey in config ? config[configLabelKey] : config[key];
}
const ranges = [{
  label: "1 hour",
  value: "1h"
}, {
  label: "6 hours",
  value: "6h"
}, {
  label: "24 hours",
  value: "24h"
}, {
  label: "7 days",
  value: "7d"
}, {
  label: "30 days",
  value: "30d"
}];
function Overview() {
  const [historyDevice, setHistoryDevice] = useState("all");
  const [historyRange, setHistoryRange] = useState("24h");
  const stats = useQuery({
    queryKey: ["network", "stats"],
    queryFn: () => api("/api/network/stats").catch(() => null),
    refetchInterval: 3e4
  });
  const scheduler = useQuery({
    queryKey: ["network", "scheduler"],
    queryFn: () => api("/api/network/scheduler/status").catch(() => null),
    refetchInterval: 15e3
  });
  const alerts = useQuery({
    queryKey: ["alerts", "open"],
    queryFn: () => api("/api/alerts?status=open&limit=8").catch(() => null),
    refetchInterval: 15e3
  });
  const devices = useQuery({
    queryKey: ["devices", "overview"],
    queryFn: () => api("/api/devices?page=1&limit=100").catch(() => null),
    refetchInterval: 2e4
  });
  const feedbacks = useQuery({
    queryKey: ["feedbacks", "overview"],
    queryFn: () => api("/api/feedbacks?page=1&limit=100").catch(() => null)
  });
  const storage = useQuery({
    queryKey: ["system", "storage"],
    queryFn: () => api("/api/system/storage").catch(() => null),
    refetchInterval: 3e4
  });
  const history = useQuery({
    queryKey: ["network", "device-history", historyDevice, historyRange],
    queryFn: () => {
      const params = new URLSearchParams({
        range: historyRange
      });
      if (historyDevice !== "all") params.set("device_id", historyDevice);
      return api(`/api/network/device-history?${params.toString()}`).catch(() => null);
    },
    refetchInterval: 3e4
  });
  const s = asObject(stats.data);
  const schedulerData = asObject(scheduler.data);
  const openAlerts = asArray(alerts.data);
  const deviceItems = asArray(devices.data);
  const feedbackItems = asArray(feedbacks.data);
  const storageData = asObject(storage.data);
  const historyPoints = asArray(history.data).map((point) => ({
    ...point,
    label: formatBucket(point.bucket, historyRange),
    availability: Number(point.availability ?? 0),
    latency_avg_ms: Number(point.latency_avg_ms ?? 0),
    packet_loss_avg: Number(point.packet_loss_avg ?? 0),
    response_time_avg_ms: Number(point.response_time_avg_ms ?? 0)
  }));
  const monitoredDevices = deviceItems.filter((d) => d.monitor_enabled !== false);
  const downDevices = deviceItems.filter((d) => normalizeStatus(d.last_status ?? d.status) === "down");
  const warningDevices = deviceItems.filter((d) => ["warning", "critical"].includes(normalizeStatus(d.last_status ?? d.status)));
  const checkCount = deviceItems.reduce((total, d) => total + Number(Boolean(d.ping_enabled)) + Number(Boolean(d.snmp_enabled)) + Number(Boolean(d.http_enabled)), 0);
  const tiles = [{
    label: "Devices",
    value: deviceItems.length,
    detail: `${monitoredDevices.length} monitored`,
    icon: Server
  }, {
    label: "Open Alerts",
    value: openAlerts.length,
    detail: openAlerts.some((a) => a.severity === "critical") ? "critical active" : "no critical",
    icon: AlertTriangle
  }, {
    label: "Availability",
    value: pct(s.availability ?? s.success_rate),
    detail: `${num(s.total_checks)} checks`,
    icon: Wifi
  }, {
    label: "Feedbacks",
    value: feedbackItems.length,
    detail: "user reports",
    icon: MessageSquareWarning
  }];
  const metricRows = [{
    label: "Latency avg",
    value: ms(s.latency_avg_ms),
    icon: Gauge
  }, {
    label: "Packet loss",
    value: pct(s.packet_loss_avg),
    icon: RadioTower
  }, {
    label: "Jitter avg",
    value: ms(s.jitter_avg_ms),
    icon: Activity
  }, {
    label: "Response avg",
    value: ms(s.response_time_avg_ms),
    icon: Clock3
  }];
  return /* @__PURE__ */ jsxs(Fragment, { children: [
    /* @__PURE__ */ jsx(PageHeader, { title: "Overview", description: "Snapshot kondisi monitoring, target perangkat, dan alert terbaru." }),
    /* @__PURE__ */ jsxs("section", { className: "mb-4 grid grid-cols-1 gap-4 xl:grid-cols-[1fr_1fr_auto]", children: [
      /* @__PURE__ */ jsx(StorageCard, { title: "MySQL Storage", data: storageData.mysql, icon: Database }),
      /* @__PURE__ */ jsx(StorageCard, { title: "ClickHouse Storage", data: storageData.clickhouse, icon: HardDrive }),
      /* @__PURE__ */ jsxs("div", { className: "rounded-lg border border-border bg-card/70 p-5", children: [
        /* @__PURE__ */ jsxs("div", { className: "flex items-center justify-between gap-3", children: [
          /* @__PURE__ */ jsx("div", { className: "font-mono text-xs uppercase tracking-widest text-muted-foreground", children: "Total Storage" }),
          /* @__PURE__ */ jsx(HardDrive, { className: "h-4 w-4 text-muted-foreground" })
        ] }),
        /* @__PURE__ */ jsx("div", { className: "mt-3 font-mono text-3xl font-semibold", children: bytes(storageData.total_bytes) }),
        /* @__PURE__ */ jsx("div", { className: "mt-1 text-xs text-muted-foreground", children: storageData.checked_at ? new Date(storageData.checked_at).toLocaleTimeString() : "—" })
      ] })
    ] }),
    /* @__PURE__ */ jsx("div", { className: "grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4", children: tiles.map((t) => {
      const Icon = t.icon;
      return /* @__PURE__ */ jsxs("div", { className: "rounded-lg border border-border bg-card/70 p-5", children: [
        /* @__PURE__ */ jsxs("div", { className: "flex items-center justify-between gap-3", children: [
          /* @__PURE__ */ jsx("div", { className: "font-mono text-xs uppercase tracking-widest text-muted-foreground", children: t.label }),
          /* @__PURE__ */ jsx(Icon, { className: "h-4 w-4 text-muted-foreground" })
        ] }),
        /* @__PURE__ */ jsx("div", { className: "mt-3 text-3xl font-semibold", children: String(t.value) }),
        /* @__PURE__ */ jsx("div", { className: "mt-1 text-xs text-muted-foreground", children: t.detail })
      ] }, t.label);
    }) }),
    /* @__PURE__ */ jsxs("div", { className: "mt-4 grid grid-cols-1 gap-4 xl:grid-cols-[1.4fr_1fr]", children: [
      /* @__PURE__ */ jsxs("section", { className: "rounded-lg border border-border bg-card/70 p-5", children: [
        /* @__PURE__ */ jsxs("div", { className: "mb-4 flex items-center justify-between gap-3", children: [
          /* @__PURE__ */ jsxs("div", { children: [
            /* @__PURE__ */ jsx("div", { className: "text-sm font-semibold", children: "Monitoring Health" }),
            /* @__PURE__ */ jsxs("div", { className: "text-xs text-muted-foreground", children: [
              checkCount,
              " active checks across ",
              deviceItems.length,
              " devices"
            ] })
          ] }),
          /* @__PURE__ */ jsx("span", { className: `font-mono text-xs ${schedulerData.running ? "text-primary" : "text-muted-foreground"}`, children: schedulerData.running ? "scheduler running" : "scheduler idle" })
        ] }),
        /* @__PURE__ */ jsx("div", { className: "grid grid-cols-1 gap-3 md:grid-cols-2", children: metricRows.map((row) => {
          const Icon = row.icon;
          return /* @__PURE__ */ jsxs("div", { className: "rounded-md border border-border/70 p-4", children: [
            /* @__PURE__ */ jsxs("div", { className: "flex items-center justify-between", children: [
              /* @__PURE__ */ jsx("span", { className: "text-xs text-muted-foreground", children: row.label }),
              /* @__PURE__ */ jsx(Icon, { className: "h-4 w-4 text-muted-foreground" })
            ] }),
            /* @__PURE__ */ jsx("div", { className: "mt-2 font-mono text-2xl", children: row.value })
          ] }, row.label);
        }) })
      ] }),
      /* @__PURE__ */ jsxs("section", { className: "rounded-lg border border-border bg-card/70 p-5", children: [
        /* @__PURE__ */ jsxs("div", { className: "mb-4 flex items-center justify-between", children: [
          /* @__PURE__ */ jsxs("div", { children: [
            /* @__PURE__ */ jsx("div", { className: "text-sm font-semibold", children: "Device Status" }),
            /* @__PURE__ */ jsxs("div", { className: "text-xs text-muted-foreground", children: [
              downDevices.length,
              " down, ",
              warningDevices.length,
              " warning/critical"
            ] })
          ] }),
          /* @__PURE__ */ jsx(Link, { to: "/dashboard/devices", className: "text-xs text-primary hover:underline", children: "Manage" })
        ] }),
        /* @__PURE__ */ jsxs("div", { className: "space-y-2", children: [
          deviceItems.slice(0, 6).map((device, i) => {
            const status = normalizeStatus(device.last_status ?? device.status);
            return /* @__PURE__ */ jsxs("div", { className: "flex items-center justify-between gap-3 rounded-md border border-border/70 px-3 py-2", children: [
              /* @__PURE__ */ jsxs("div", { className: "min-w-0", children: [
                /* @__PURE__ */ jsx("div", { className: "truncate text-sm font-medium", children: device.name ?? device.host ?? "Device" }),
                /* @__PURE__ */ jsx("div", { className: "truncate font-mono text-xs text-muted-foreground", children: device.host ?? "—" })
              ] }),
              /* @__PURE__ */ jsx("span", { className: `font-mono text-xs ${statusClass(status)}`, children: status })
            ] }, device.id ?? i);
          }),
          deviceItems.length === 0 ? /* @__PURE__ */ jsx(Empty, { label: "No devices yet" }) : null
        ] })
      ] })
    ] }),
    /* @__PURE__ */ jsxs("section", { className: "mt-4 rounded-lg border border-border bg-card/70 p-5", children: [
      /* @__PURE__ */ jsxs("div", { className: "mb-4 flex flex-col gap-3 md:flex-row md:items-center md:justify-between", children: [
        /* @__PURE__ */ jsxs("div", { children: [
          /* @__PURE__ */ jsx("div", { className: "text-sm font-semibold", children: "Device Trend" }),
          /* @__PURE__ */ jsx("div", { className: "text-xs text-muted-foreground", children: "Availability, latency, packet loss, dan response time berdasarkan histori log." })
        ] }),
        /* @__PURE__ */ jsxs("div", { className: "flex flex-col gap-2 sm:flex-row", children: [
          /* @__PURE__ */ jsxs(Select, { value: historyDevice, onValueChange: setHistoryDevice, children: [
            /* @__PURE__ */ jsx(SelectTrigger, { className: "w-full sm:w-56", children: /* @__PURE__ */ jsx(SelectValue, { placeholder: "All devices" }) }),
            /* @__PURE__ */ jsxs(SelectContent, { children: [
              /* @__PURE__ */ jsx(SelectItem, { value: "all", children: "All devices" }),
              deviceItems.map((device, i) => /* @__PURE__ */ jsx(SelectItem, { value: device.id ?? "all", children: device.name ?? device.host ?? "Device" }, device.id ?? i))
            ] })
          ] }),
          /* @__PURE__ */ jsxs(Select, { value: historyRange, onValueChange: setHistoryRange, children: [
            /* @__PURE__ */ jsx(SelectTrigger, { className: "w-full sm:w-36", children: /* @__PURE__ */ jsx(SelectValue, { placeholder: "Range" }) }),
            /* @__PURE__ */ jsx(SelectContent, { children: ranges.map((range) => /* @__PURE__ */ jsx(SelectItem, { value: range.value, children: range.label }, range.value)) })
          ] })
        ] })
      ] }),
      historyPoints.length > 0 ? /* @__PURE__ */ jsx(ChartContainer, { config: {
        availability: {
          label: "Availability",
          color: "var(--chart-1)"
        },
        latency_avg_ms: {
          label: "Latency",
          color: "var(--chart-2)"
        },
        packet_loss_avg: {
          label: "Packet loss",
          color: "var(--chart-4)"
        },
        response_time_avg_ms: {
          label: "Response",
          color: "var(--chart-5)"
        }
      }, className: "h-[320px] w-full aspect-auto", children: /* @__PURE__ */ jsxs(LineChart, { data: historyPoints, margin: {
        left: 8,
        right: 8,
        top: 12
      }, children: [
        /* @__PURE__ */ jsx(CartesianGrid, { vertical: false, strokeDasharray: "3 3" }),
        /* @__PURE__ */ jsx(XAxis, { dataKey: "label", tickLine: false, axisLine: false, minTickGap: 24, tickMargin: 8 }),
        /* @__PURE__ */ jsx(YAxis, { yAxisId: "percent", width: 42, domain: [0, 100], tickLine: false, axisLine: false, tickFormatter: (value) => `${value}%` }),
        /* @__PURE__ */ jsx(YAxis, { yAxisId: "ms", orientation: "right", width: 48, tickLine: false, axisLine: false, tickFormatter: (value) => `${value}ms` }),
        /* @__PURE__ */ jsx(ChartTooltip, { content: /* @__PURE__ */ jsx(ChartTooltipContent, {}) }),
        /* @__PURE__ */ jsx(Line, { yAxisId: "percent", type: "monotone", dataKey: "availability", stroke: "var(--color-availability)", strokeWidth: 2, dot: false }),
        /* @__PURE__ */ jsx(Line, { yAxisId: "percent", type: "monotone", dataKey: "packet_loss_avg", stroke: "var(--color-packet_loss_avg)", strokeWidth: 2, dot: false }),
        /* @__PURE__ */ jsx(Line, { yAxisId: "ms", type: "monotone", dataKey: "latency_avg_ms", stroke: "var(--color-latency_avg_ms)", strokeWidth: 2, dot: false }),
        /* @__PURE__ */ jsx(Line, { yAxisId: "ms", type: "monotone", dataKey: "response_time_avg_ms", stroke: "var(--color-response_time_avg_ms)", strokeWidth: 2, dot: false })
      ] }) }) : /* @__PURE__ */ jsx(Empty, { label: "No history data for this range" })
    ] }),
    /* @__PURE__ */ jsxs("section", { className: "mt-4 rounded-lg border border-border bg-card/70 p-5", children: [
      /* @__PURE__ */ jsxs("div", { className: "mb-4 flex items-center justify-between", children: [
        /* @__PURE__ */ jsxs("div", { children: [
          /* @__PURE__ */ jsx("div", { className: "text-sm font-semibold", children: "Recent Open Alerts" }),
          /* @__PURE__ */ jsx("div", { className: "text-xs text-muted-foreground", children: "Latest unresolved network signals" })
        ] }),
        /* @__PURE__ */ jsx(Link, { to: "/dashboard/alerts", className: "text-xs text-primary hover:underline", children: "View all" })
      ] }),
      openAlerts.length > 0 ? /* @__PURE__ */ jsx("div", { className: "divide-y divide-border", children: openAlerts.map((a, i) => /* @__PURE__ */ jsxs("div", { className: "grid grid-cols-[1fr_auto_auto] items-center gap-3 py-3 text-sm", children: [
        /* @__PURE__ */ jsxs("div", { className: "min-w-0", children: [
          /* @__PURE__ */ jsx("div", { className: "truncate", children: a.title ?? a.message ?? "Alert" }),
          /* @__PURE__ */ jsx("div", { className: "truncate font-mono text-xs text-muted-foreground", children: a.device_name ?? "unknown device" })
        ] }),
        /* @__PURE__ */ jsx("span", { className: `font-mono text-xs ${statusClass(a.severity ?? "warning")}`, children: a.severity ?? "warning" }),
        /* @__PURE__ */ jsx("span", { className: "font-mono text-xs text-muted-foreground", children: a.created_at ? new Date(a.created_at).toLocaleTimeString() : "—" })
      ] }, a.id ?? i)) }) : /* @__PURE__ */ jsx(Empty, { label: "No open alerts" })
    ] })
  ] });
}
function normalizeStatus(status) {
  if (!status || status === "healthy" || status === "online") return status === "healthy" || status === "online" ? "up" : "unknown";
  return status;
}
function statusClass(status) {
  if (status === "up") return "text-primary";
  if (status === "warning") return "text-warning";
  if (status === "critical" || status === "down") return "text-destructive";
  return "text-muted-foreground";
}
function num(value) {
  return Number(value ?? 0).toLocaleString();
}
function pct(value) {
  const n = Number(value ?? 0);
  return `${Number.isFinite(n) ? n.toFixed(1) : "0.0"}%`;
}
function ms(value) {
  const n = Number(value ?? 0);
  return `${Number.isFinite(n) ? n.toFixed(1) : "0.0"} ms`;
}
function bytes(value) {
  const n = Number(value ?? 0);
  if (!Number.isFinite(n) || n <= 0) return "0 B";
  const units = ["B", "KB", "MB", "GB", "TB"];
  const index = Math.min(Math.floor(Math.log(n) / Math.log(1024)), units.length - 1);
  return `${(n / 1024 ** index).toFixed(index === 0 ? 0 : 1)} ${units[index]}`;
}
function formatBucket(value, range) {
  if (typeof value !== "string") return "—";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "—";
  if (range === "7d" || range === "30d") {
    return date.toLocaleDateString(void 0, {
      month: "short",
      day: "numeric"
    });
  }
  return date.toLocaleTimeString(void 0, {
    hour: "2-digit",
    minute: "2-digit"
  });
}
function Empty({
  label
}) {
  return /* @__PURE__ */ jsx("div", { className: "rounded-md border border-dashed border-border p-6 text-center text-sm text-muted-foreground", children: label });
}
function StorageCard({
  title,
  data,
  icon: Icon
}) {
  const status = data?.status ?? "unknown";
  return /* @__PURE__ */ jsxs("div", { className: "rounded-lg border border-border bg-card/70 p-5", children: [
    /* @__PURE__ */ jsxs("div", { className: "flex items-center justify-between gap-3", children: [
      /* @__PURE__ */ jsx("div", { className: "font-mono text-xs uppercase tracking-widest text-muted-foreground", children: title }),
      /* @__PURE__ */ jsx(Icon, { className: "h-4 w-4 text-muted-foreground" })
    ] }),
    /* @__PURE__ */ jsxs("div", { className: "mt-3 flex flex-wrap items-end justify-between gap-3", children: [
      /* @__PURE__ */ jsxs("div", { children: [
        /* @__PURE__ */ jsx("div", { className: "font-mono text-3xl font-semibold", children: bytes(data?.size_bytes) }),
        /* @__PURE__ */ jsxs("div", { className: "mt-1 text-xs text-muted-foreground", children: [
          data?.name ?? "—",
          " · ",
          num(data?.tables),
          " tables · ",
          num(data?.rows),
          " rows"
        ] })
      ] }),
      /* @__PURE__ */ jsx("span", { className: `font-mono text-xs ${status === "ok" ? "text-primary" : "text-destructive"}`, children: status })
    ] }),
    data?.error ? /* @__PURE__ */ jsx("div", { className: "mt-2 truncate text-xs text-destructive", children: data.error }) : null
  ] });
}
export {
  Overview as component
};
