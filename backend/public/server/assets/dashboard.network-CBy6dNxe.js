import { jsx, jsxs, Fragment } from "react/jsx-runtime";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import * as React from "react";
import { useState } from "react";
import { Loader2, RefreshCw, Send } from "lucide-react";
import { toast } from "sonner";
import { P as PageHeader } from "./DashboardLayout-RYDn1jmq.js";
import { c as cn, B as Button } from "./button-BXrfXN_b.js";
import { I as Input } from "./input-DwaGuH4D.js";
import { L as Label } from "./label-Brw405F4.js";
import { S as Select, a as SelectTrigger, b as SelectValue, c as SelectContent, d as SelectItem } from "./select-Dn_c42EA.js";
import { T as Textarea } from "./textarea-BBisE2jS.js";
import * as TabsPrimitive from "@radix-ui/react-tabs";
import { a as api, c as asArray, d as unwrapResponse } from "./router-BHOai5Fo.js";
import "@tanstack/react-router";
import "./push-notifications-CahqIseY.js";
import "@radix-ui/react-slot";
import "class-variance-authority";
import "clsx";
import "tailwind-merge";
import "@radix-ui/react-label";
import "@radix-ui/react-select";
const Tabs = TabsPrimitive.Root;
const TabsList = React.forwardRef(({ className, ...props }, ref) => /* @__PURE__ */ jsx(
  TabsPrimitive.List,
  {
    ref,
    className: cn(
      "inline-flex h-9 items-center justify-center rounded-lg bg-muted p-1 text-muted-foreground",
      className
    ),
    ...props
  }
));
TabsList.displayName = TabsPrimitive.List.displayName;
const TabsTrigger = React.forwardRef(({ className, ...props }, ref) => /* @__PURE__ */ jsx(
  TabsPrimitive.Trigger,
  {
    ref,
    className: cn(
      "inline-flex items-center justify-center whitespace-nowrap rounded-md px-3 py-1 text-sm font-medium ring-offset-background cursor-pointer transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 disabled:cursor-not-allowed data-[state=active]:bg-background data-[state=active]:text-foreground data-[state=active]:shadow",
      className
    ),
    ...props
  }
));
TabsTrigger.displayName = TabsPrimitive.Trigger.displayName;
const TabsContent = React.forwardRef(({ className, ...props }, ref) => /* @__PURE__ */ jsx(
  TabsPrimitive.Content,
  {
    ref,
    className: cn(
      "mt-2 ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2",
      className
    ),
    ...props
  }
));
TabsContent.displayName = TabsPrimitive.Content.displayName;
function NetworkTools() {
  return /* @__PURE__ */ jsxs(Fragment, { children: [
    /* @__PURE__ */ jsx(PageHeader, { title: "Manual Tools", description: "Ping, SNMP GET, dan HTTP probe." }),
    /* @__PURE__ */ jsxs(Tabs, { defaultValue: "ping", className: "space-y-4", children: [
      /* @__PURE__ */ jsxs(TabsList, { children: [
        /* @__PURE__ */ jsx(TabsTrigger, { value: "ping", children: "Ping" }),
        /* @__PURE__ */ jsx(TabsTrigger, { value: "snmp", children: "SNMP" }),
        /* @__PURE__ */ jsx(TabsTrigger, { value: "http", children: "HTTP GET" }),
        /* @__PURE__ */ jsx(TabsTrigger, { value: "interfaces", children: "Interfaces" })
      ] }),
      /* @__PURE__ */ jsx(TabsContent, { value: "ping", children: /* @__PURE__ */ jsx(PingPanel, {}) }),
      /* @__PURE__ */ jsx(TabsContent, { value: "snmp", children: /* @__PURE__ */ jsx(SnmpPanel, {}) }),
      /* @__PURE__ */ jsx(TabsContent, { value: "http", children: /* @__PURE__ */ jsx(HttpPanel, {}) }),
      /* @__PURE__ */ jsx(TabsContent, { value: "interfaces", children: /* @__PURE__ */ jsx(InterfacePanel, {}) })
    ] })
  ] });
}
function ResultBox({
  data,
  error,
  pending
}) {
  if (pending) return /* @__PURE__ */ jsx("div", { className: "text-sm text-muted-foreground", children: "Running..." });
  if (error) return /* @__PURE__ */ jsx("pre", { className: "overflow-auto rounded-md bg-destructive/10 p-3 font-mono text-xs text-destructive", children: String(error instanceof Error ? error.message : error) });
  const payload = unwrapResponse(data);
  if (payload === null) return null;
  return /* @__PURE__ */ jsx("pre", { className: "max-h-[400px] overflow-auto rounded-md bg-muted/40 p-3 font-mono text-xs", children: JSON.stringify(payload, null, 2) });
}
function Panel({
  children,
  onRun,
  pending
}) {
  return /* @__PURE__ */ jsxs("div", { className: "rounded-xl border border-border bg-card/70 p-5 space-y-4", children: [
    children,
    /* @__PURE__ */ jsxs(Button, { onClick: onRun, disabled: pending, children: [
      pending ? /* @__PURE__ */ jsx(Loader2, { className: "mr-2 h-4 w-4 animate-spin" }) : /* @__PURE__ */ jsx(Send, { className: "mr-2 h-4 w-4" }),
      "Run"
    ] })
  ] });
}
function PingPanel() {
  const [host, setHost] = useState("8.8.8.8");
  const [count, setCount] = useState(4);
  const run = useMutation({
    mutationFn: () => api("/api/network/ping", {
      method: "POST",
      json: {
        host,
        count
      }
    })
  });
  return /* @__PURE__ */ jsxs(Fragment, { children: [
    /* @__PURE__ */ jsx(Panel, { onRun: () => run.mutate(), pending: run.isPending, children: /* @__PURE__ */ jsxs("div", { className: "grid grid-cols-2 gap-3", children: [
      /* @__PURE__ */ jsxs("div", { className: "space-y-1.5", children: [
        /* @__PURE__ */ jsx(Label, { className: "text-xs text-muted-foreground", children: "Host" }),
        /* @__PURE__ */ jsx(Input, { value: host, onChange: (e) => setHost(e.target.value) })
      ] }),
      /* @__PURE__ */ jsxs("div", { className: "space-y-1.5", children: [
        /* @__PURE__ */ jsx(Label, { className: "text-xs text-muted-foreground", children: "Count" }),
        /* @__PURE__ */ jsx(Input, { type: "number", value: count, onChange: (e) => setCount(Number(e.target.value) || 1) })
      ] })
    ] }) }),
    /* @__PURE__ */ jsx("div", { className: "mt-4", children: /* @__PURE__ */ jsx(ResultBox, { data: run.data, error: run.error, pending: run.isPending }) })
  ] });
}
function SnmpPanel() {
  const [host, setHost] = useState("192.168.1.1");
  const [community, setCommunity] = useState("public");
  const [version, setVersion] = useState("v2c");
  const [oids, setOids] = useState(".1.3.6.1.2.1.1.1.0,.1.3.6.1.2.1.1.5.0");
  const run = useMutation({
    mutationFn: () => api("/api/network/snmp", {
      method: "POST",
      json: {
        host,
        community,
        version,
        oids: oids.split(",").map((s) => s.trim()).filter(Boolean),
        port: 161,
        timeout: 5
      }
    })
  });
  return /* @__PURE__ */ jsxs(Fragment, { children: [
    /* @__PURE__ */ jsxs(Panel, { onRun: () => run.mutate(), pending: run.isPending, children: [
      /* @__PURE__ */ jsxs("div", { className: "grid grid-cols-3 gap-3", children: [
        /* @__PURE__ */ jsxs("div", { className: "space-y-1.5", children: [
          /* @__PURE__ */ jsx(Label, { className: "text-xs text-muted-foreground", children: "Host" }),
          /* @__PURE__ */ jsx(Input, { value: host, onChange: (e) => setHost(e.target.value) })
        ] }),
        /* @__PURE__ */ jsxs("div", { className: "space-y-1.5", children: [
          /* @__PURE__ */ jsx(Label, { className: "text-xs text-muted-foreground", children: "Community" }),
          /* @__PURE__ */ jsx(Input, { value: community, onChange: (e) => setCommunity(e.target.value) })
        ] }),
        /* @__PURE__ */ jsxs("div", { className: "space-y-1.5", children: [
          /* @__PURE__ */ jsx(Label, { className: "text-xs text-muted-foreground", children: "Version" }),
          /* @__PURE__ */ jsx(Input, { value: version, onChange: (e) => setVersion(e.target.value) })
        ] })
      ] }),
      /* @__PURE__ */ jsxs("div", { className: "space-y-1.5", children: [
        /* @__PURE__ */ jsx(Label, { className: "text-xs text-muted-foreground", children: "OIDs (comma separated)" }),
        /* @__PURE__ */ jsx(Textarea, { rows: 2, value: oids, onChange: (e) => setOids(e.target.value), className: "font-mono text-xs" })
      ] })
    ] }),
    /* @__PURE__ */ jsx("div", { className: "mt-4", children: /* @__PURE__ */ jsx(ResultBox, { data: run.data, error: run.error, pending: run.isPending }) })
  ] });
}
function HttpPanel() {
  const [url, setUrl] = useState("https://belsp.itsyntax.dev");
  const [headers, setHeaders] = useState("{}");
  const [deviceID, setDeviceID] = useState("manual");
  const devices = useQuery({
    queryKey: ["devices", "http-options"],
    queryFn: () => api("/api/devices?page=1&limit=100")
  });
  const deviceOptions = asArray(devices.data).filter((d) => d.id);
  const run = useMutation({
    mutationFn: () => {
      if (deviceID !== "manual") {
        return api("/api/network/http-get", {
          method: "POST",
          json: {
            device_id: deviceID
          }
        });
      }
      let h = {};
      try {
        const parsed = JSON.parse(headers || "{}");
        if (parsed && typeof parsed === "object" && !Array.isArray(parsed)) {
          h = parsed;
        }
      } catch {
      }
      return api("/api/network/http-get", {
        method: "POST",
        json: {
          url,
          headers: h,
          timeout: 10
        }
      });
    }
  });
  return /* @__PURE__ */ jsxs(Fragment, { children: [
    /* @__PURE__ */ jsxs(Panel, { onRun: () => run.mutate(), pending: run.isPending, children: [
      /* @__PURE__ */ jsxs("div", { className: "space-y-1.5", children: [
        /* @__PURE__ */ jsx(Label, { className: "text-xs text-muted-foreground", children: "Device" }),
        /* @__PURE__ */ jsxs(Select, { value: deviceID, onValueChange: setDeviceID, children: [
          /* @__PURE__ */ jsx(SelectTrigger, { children: /* @__PURE__ */ jsx(SelectValue, { placeholder: "Manual URL" }) }),
          /* @__PURE__ */ jsxs(SelectContent, { children: [
            /* @__PURE__ */ jsx(SelectItem, { value: "manual", children: "Manual URL" }),
            deviceOptions.map((device) => /* @__PURE__ */ jsx(SelectItem, { value: device.id ?? "manual", children: device.name ?? device.host ?? device.id }, device.id))
          ] })
        ] })
      ] }),
      /* @__PURE__ */ jsxs("div", { className: "space-y-1.5", children: [
        /* @__PURE__ */ jsx(Label, { className: "text-xs text-muted-foreground", children: "URL" }),
        /* @__PURE__ */ jsx(Input, { value: url, disabled: deviceID !== "manual", onChange: (e) => setUrl(e.target.value) })
      ] }),
      /* @__PURE__ */ jsxs("div", { className: "space-y-1.5", children: [
        /* @__PURE__ */ jsx(Label, { className: "text-xs text-muted-foreground", children: "Headers (JSON)" }),
        /* @__PURE__ */ jsx(Textarea, { rows: 3, value: headers, disabled: deviceID !== "manual", onChange: (e) => setHeaders(e.target.value), className: "font-mono text-xs" })
      ] })
    ] }),
    /* @__PURE__ */ jsx("div", { className: "mt-4", children: /* @__PURE__ */ jsx(ResultBox, { data: run.data, error: run.error, pending: run.isPending }) })
  ] });
}
function InterfacePanel() {
  const qc = useQueryClient();
  const list = useQuery({
    queryKey: ["network", "interfaces"],
    queryFn: () => api("/api/network/interfaces"),
    refetchInterval: 15e3
  });
  const check = useMutation({
    mutationFn: () => api("/api/network/interfaces/check", {
      method: "POST"
    }),
    onSuccess: () => {
      toast.success("Interface check logged");
      qc.invalidateQueries({
        queryKey: ["network", "interfaces"]
      });
      qc.invalidateQueries({
        queryKey: ["network", "logs"]
      });
      qc.invalidateQueries({
        queryKey: ["alerts"]
      });
    },
    onError: (e) => toast.error(e instanceof Error ? e.message : "Failed to check interfaces")
  });
  const interfaces = asArray(list.data);
  return /* @__PURE__ */ jsxs("div", { className: "space-y-4 rounded-xl border border-border bg-card/70 p-5", children: [
    /* @__PURE__ */ jsxs("div", { className: "flex items-center justify-between gap-3", children: [
      /* @__PURE__ */ jsxs("div", { children: [
        /* @__PURE__ */ jsx("div", { className: "text-sm font-semibold", children: "Local Interface Agent" }),
        /* @__PURE__ */ jsx("div", { className: "text-xs text-muted-foreground", children: "Status Ethernet/WiFi dari host yang menjalankan backend." })
      ] }),
      /* @__PURE__ */ jsxs(Button, { onClick: () => check.mutate(), disabled: check.isPending, children: [
        check.isPending ? /* @__PURE__ */ jsx(Loader2, { className: "mr-2 h-4 w-4 animate-spin" }) : /* @__PURE__ */ jsx(RefreshCw, { className: "mr-2 h-4 w-4" }),
        "Check now"
      ] })
    ] }),
    /* @__PURE__ */ jsx("div", { className: "divide-y divide-border rounded-md border border-border/70", children: list.isLoading ? /* @__PURE__ */ jsx("div", { className: "p-4 text-sm text-muted-foreground", children: "Loading..." }) : interfaces.length > 0 ? interfaces.map((item, index) => /* @__PURE__ */ jsxs("div", { className: "grid gap-2 p-4 text-sm md:grid-cols-[1fr_auto_auto_auto]", children: [
      /* @__PURE__ */ jsxs("div", { className: "min-w-0", children: [
        /* @__PURE__ */ jsx("div", { className: "truncate font-mono", children: item.interface ?? "unknown" }),
        /* @__PURE__ */ jsx("div", { className: "mt-1 text-xs text-muted-foreground", children: item.reason ?? "—" })
      ] }),
      /* @__PURE__ */ jsx("span", { className: "font-mono text-xs text-muted-foreground", children: item.type ?? "—" }),
      /* @__PURE__ */ jsx("span", { className: `font-mono text-xs ${interfaceStatusClass(item.status)}`, children: item.status ?? "unknown" }),
      /* @__PURE__ */ jsxs("span", { className: "font-mono text-xs text-muted-foreground", children: [
        "operstate: ",
        item.operstate ?? "null"
      ] })
    ] }, item.interface ?? index)) : /* @__PURE__ */ jsx("div", { className: "p-4 text-sm text-muted-foreground", children: "No physical interface detected." }) }),
    /* @__PURE__ */ jsx(ResultBox, { data: check.data, error: check.error, pending: check.isPending })
  ] });
}
function interfaceStatusClass(status) {
  if (status === "connected") return "text-primary";
  if (status === "disconnected" || status === "unknown") return "text-warning";
  if (status === "cable_unplugged" || status === "down") return "text-destructive";
  return "text-muted-foreground";
}
export {
  NetworkTools as component
};
