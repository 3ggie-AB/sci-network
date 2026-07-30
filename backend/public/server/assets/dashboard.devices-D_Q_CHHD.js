import { jsxs, Fragment, jsx } from "react/jsx-runtime";
import { useQueryClient, useQuery, useMutation } from "@tanstack/react-query";
import { useState } from "react";
import { Plus, Pencil, Trash2, Loader2 } from "lucide-react";
import { toast } from "sonner";
import { P as PageHeader } from "./DashboardLayout-BIsZ7GUS.js";
import { B as Button } from "./button-BXrfXN_b.js";
import { I as Input } from "./input-DwaGuH4D.js";
import { L as Label } from "./label-Brw405F4.js";
import { D as Dialog, a as DialogTrigger, T as Table, b as TableHeader, c as TableRow, d as TableHead, e as TableBody, f as TableCell, g as DialogContent, h as DialogHeader, i as DialogTitle, j as DialogFooter } from "./table-CFZJqILE.js";
import { S as Select, a as SelectTrigger, b as SelectValue, c as SelectContent, d as SelectItem } from "./select-Dn_c42EA.js";
import { S as Switch } from "./switch-DDHih_sy.js";
import { a as api, c as asArray } from "./router-D-aI0tZc.js";
import "@tanstack/react-router";
import "./push-notifications-kiOw6TiQ.js";
import "@radix-ui/react-slot";
import "class-variance-authority";
import "clsx";
import "tailwind-merge";
import "@radix-ui/react-label";
import "@radix-ui/react-dialog";
import "@radix-ui/react-select";
import "@radix-ui/react-switch";
const deviceTypes = ["server", "router", "mikrotik", "switch", "gateway", "other"];
const snmpVersions = ["v1", "v2c", "v3"];
function Devices() {
  const qc = useQueryClient();
  const [createOpen, setCreateOpen] = useState(false);
  const [editing, setEditing] = useState(null);
  const list = useQuery({
    queryKey: ["devices"],
    queryFn: () => api("/api/devices?page=1&limit=50")
  });
  const del = useMutation({
    mutationFn: (id) => api(`/api/devices/${id}`, {
      method: "DELETE"
    }),
    onSuccess: () => {
      toast.success("Device removed");
      qc.invalidateQueries({
        queryKey: ["devices"]
      });
    },
    onError: (e) => toast.error(errorMessage(e, "Failed to delete"))
  });
  const items = asArray(list.data);
  return /* @__PURE__ */ jsxs(Fragment, { children: [
    /* @__PURE__ */ jsx(PageHeader, { title: "Devices", description: "Inventory perangkat & target monitoring.", actions: /* @__PURE__ */ jsxs(Dialog, { open: createOpen, onOpenChange: setCreateOpen, children: [
      /* @__PURE__ */ jsx(DialogTrigger, { asChild: true, children: /* @__PURE__ */ jsxs(Button, { children: [
        /* @__PURE__ */ jsx(Plus, { className: "mr-2 h-4 w-4" }),
        " New device"
      ] }) }),
      /* @__PURE__ */ jsx(DeviceDialog, { mode: "create", onDone: () => setCreateOpen(false) })
    ] }) }),
    /* @__PURE__ */ jsx("div", { className: "overflow-hidden rounded-xl border border-border bg-card/70", children: /* @__PURE__ */ jsxs(Table, { children: [
      /* @__PURE__ */ jsx(TableHeader, { children: /* @__PURE__ */ jsxs(TableRow, { children: [
        /* @__PURE__ */ jsx(TableHead, { children: "Name" }),
        /* @__PURE__ */ jsx(TableHead, { children: "Host" }),
        /* @__PURE__ */ jsx(TableHead, { children: "Type" }),
        /* @__PURE__ */ jsx(TableHead, { children: "Checks" }),
        /* @__PURE__ */ jsx(TableHead, { children: "Monitor" }),
        /* @__PURE__ */ jsx(TableHead, { children: "Status" }),
        /* @__PURE__ */ jsx(TableHead, { className: "w-28 text-right" })
      ] }) }),
      /* @__PURE__ */ jsxs(TableBody, { children: [
        list.isLoading && /* @__PURE__ */ jsx(TableRow, { children: /* @__PURE__ */ jsx(TableCell, { colSpan: 7, className: "py-8 text-center text-muted-foreground", children: "Loading..." }) }),
        !list.isLoading && items.length === 0 && /* @__PURE__ */ jsx(TableRow, { children: /* @__PURE__ */ jsx(TableCell, { colSpan: 7, className: "py-8 text-center text-muted-foreground", children: "No devices yet." }) }),
        items.map((d, i) => {
          const status = d.last_status ?? d.status ?? "unknown";
          return /* @__PURE__ */ jsxs(TableRow, { children: [
            /* @__PURE__ */ jsx(TableCell, { className: "font-medium", children: d.name ?? "—" }),
            /* @__PURE__ */ jsx(TableCell, { className: "font-mono text-xs", children: d.host ?? "—" }),
            /* @__PURE__ */ jsx(TableCell, { children: d.type ?? "—" }),
            /* @__PURE__ */ jsx(TableCell, { className: "font-mono text-xs", children: checkSummary(d) }),
            /* @__PURE__ */ jsx(TableCell, { children: /* @__PURE__ */ jsx("span", { className: `font-mono text-xs ${d.monitor_enabled ? "text-primary" : "text-muted-foreground"}`, children: d.monitor_enabled ? "on" : "off" }) }),
            /* @__PURE__ */ jsx(TableCell, { children: /* @__PURE__ */ jsx("span", { className: `font-mono text-xs ${statusClass(status)}`, children: status }) }),
            /* @__PURE__ */ jsxs(TableCell, { className: "space-x-1 text-right", children: [
              /* @__PURE__ */ jsx(Button, { size: "icon", variant: "ghost", disabled: !d.id, onClick: () => setEditing(d), "aria-label": "Edit", children: /* @__PURE__ */ jsx(Pencil, { className: "h-4 w-4" }) }),
              /* @__PURE__ */ jsx(Button, { size: "icon", variant: "ghost", disabled: !d.id || del.isPending, onClick: () => d.id && del.mutate(d.id), "aria-label": "Delete", children: /* @__PURE__ */ jsx(Trash2, { className: "h-4 w-4 text-destructive" }) })
            ] })
          ] }, d.id ?? i);
        })
      ] })
    ] }) }),
    /* @__PURE__ */ jsx(Dialog, { open: !!editing, onOpenChange: (open) => !open && setEditing(null), children: editing ? /* @__PURE__ */ jsx(DeviceDialog, { mode: "edit", device: editing, onDone: () => setEditing(null) }) : null })
  ] });
}
function DeviceDialog({
  mode,
  device,
  onDone
}) {
  const qc = useQueryClient();
  const [form, setForm] = useState(() => toDeviceForm(device));
  const save = useMutation({
    mutationFn: () => {
      const payload = normalizeDevicePayload(form);
      if (mode === "edit" && device?.id) {
        return api(`/api/devices/${device.id}`, {
          method: "PUT",
          json: payload
        });
      }
      return api("/api/devices", {
        method: "POST",
        json: payload
      });
    },
    onSuccess: () => {
      toast.success(mode === "edit" ? "Device updated" : "Device created");
      qc.invalidateQueries({
        queryKey: ["devices"]
      });
      onDone();
    },
    onError: (e) => toast.error(errorMessage(e, mode === "edit" ? "Failed to update" : "Failed to create"))
  });
  return /* @__PURE__ */ jsxs(DialogContent, { className: "max-w-4xl", children: [
    /* @__PURE__ */ jsx(DialogHeader, { children: /* @__PURE__ */ jsx(DialogTitle, { children: mode === "edit" ? "Edit device" : "New device" }) }),
    /* @__PURE__ */ jsxs("div", { className: "grid grid-cols-2 gap-3 lg:grid-cols-4", children: [
      /* @__PURE__ */ jsx(FormRow, { label: "Name", children: /* @__PURE__ */ jsx(Input, { value: form.name, onChange: (e) => setForm({
        ...form,
        name: e.target.value
      }) }) }),
      /* @__PURE__ */ jsx(FormRow, { label: "Host", children: /* @__PURE__ */ jsx(Input, { value: form.host, onChange: (e) => setForm({
        ...form,
        host: e.target.value
      }) }) }),
      /* @__PURE__ */ jsx(FormRow, { label: "Type", children: /* @__PURE__ */ jsxs(Select, { value: form.type, onValueChange: (type) => setForm({
        ...form,
        type
      }), children: [
        /* @__PURE__ */ jsx(SelectTrigger, { children: /* @__PURE__ */ jsx(SelectValue, { placeholder: "Type" }) }),
        /* @__PURE__ */ jsx(SelectContent, { children: deviceTypes.map((type) => /* @__PURE__ */ jsx(SelectItem, { value: type, children: type }, type)) })
      ] }) }),
      /* @__PURE__ */ jsx(SwitchRow, { label: "Monitor", checked: form.monitor_enabled, onCheckedChange: (monitor_enabled) => setForm({
        ...form,
        monitor_enabled
      }) }),
      /* @__PURE__ */ jsx(SwitchRow, { label: "Ping", checked: form.ping_enabled, onCheckedChange: (ping_enabled) => setForm({
        ...form,
        ping_enabled
      }) }),
      /* @__PURE__ */ jsx(SwitchRow, { label: "SNMP", checked: form.snmp_enabled, onCheckedChange: (snmp_enabled) => setForm({
        ...form,
        snmp_enabled
      }) }),
      /* @__PURE__ */ jsx(SwitchRow, { label: "HTTP GET", checked: form.http_enabled, onCheckedChange: (http_enabled) => setForm({
        ...form,
        http_enabled
      }) }),
      form.snmp_enabled ? /* @__PURE__ */ jsxs(Fragment, { children: [
        /* @__PURE__ */ jsx(SectionLabel, { children: "SNMP" }),
        /* @__PURE__ */ jsx(FormRow, { label: "SNMP interval (s)", children: /* @__PURE__ */ jsx(Input, { type: "number", value: form.snmp_interval_seconds, onChange: (e) => setForm({
          ...form,
          snmp_interval_seconds: Number(e.target.value) || 60
        }) }) }),
        /* @__PURE__ */ jsx(FormRow, { label: "SNMP version", children: /* @__PURE__ */ jsxs(Select, { value: form.snmp_version, onValueChange: (snmp_version) => setForm({
          ...form,
          snmp_version
        }), children: [
          /* @__PURE__ */ jsx(SelectTrigger, { children: /* @__PURE__ */ jsx(SelectValue, { placeholder: "SNMP" }) }),
          /* @__PURE__ */ jsx(SelectContent, { children: snmpVersions.map((version) => /* @__PURE__ */ jsx(SelectItem, { value: version, children: version }, version)) })
        ] }) }),
        /* @__PURE__ */ jsx(FormRow, { label: "Community", children: /* @__PURE__ */ jsx(Input, { value: form.snmp_community, onChange: (e) => setForm({
          ...form,
          snmp_community: e.target.value
        }) }) }),
        /* @__PURE__ */ jsx(FormRow, { label: "SNMP port", children: /* @__PURE__ */ jsx(Input, { type: "number", value: form.snmp_port, onChange: (e) => setForm({
          ...form,
          snmp_port: Number(e.target.value) || 161
        }) }) }),
        /* @__PURE__ */ jsx(FormRow, { label: "SNMP timeout", children: /* @__PURE__ */ jsx(Input, { type: "number", value: form.snmp_timeout, onChange: (e) => setForm({
          ...form,
          snmp_timeout: Number(e.target.value) || 5
        }) }) })
      ] }) : null,
      form.http_enabled ? /* @__PURE__ */ jsxs(Fragment, { children: [
        /* @__PURE__ */ jsx(SectionLabel, { children: "HTTP GET" }),
        /* @__PURE__ */ jsx(FormRow, { label: "HTTP URL", children: /* @__PURE__ */ jsx(Input, { value: form.http_url, onChange: (e) => setForm({
          ...form,
          http_url: e.target.value
        }), placeholder: "https://server.example/health" }) }),
        /* @__PURE__ */ jsx(FormRow, { label: "HTTP timeout", children: /* @__PURE__ */ jsx(Input, { type: "number", value: form.http_timeout, onChange: (e) => setForm({
          ...form,
          http_timeout: Number(e.target.value) || 10
        }) }) }),
        /* @__PURE__ */ jsx(FormRow, { label: "HTTP interval (s)", children: /* @__PURE__ */ jsx(Input, { type: "number", value: form.http_interval_seconds, onChange: (e) => setForm({
          ...form,
          http_interval_seconds: Number(e.target.value) || 60
        }) }) }),
        /* @__PURE__ */ jsx(FormRow, { label: "HTTP warn (ms)", children: /* @__PURE__ */ jsx(Input, { type: "number", value: form.response_time_warning_ms, onChange: (e) => setForm({
          ...form,
          response_time_warning_ms: Number(e.target.value) || 1e3
        }) }) }),
        /* @__PURE__ */ jsx(FormRow, { label: "HTTP critical (ms)", children: /* @__PURE__ */ jsx(Input, { type: "number", value: form.response_time_critical_ms, onChange: (e) => setForm({
          ...form,
          response_time_critical_ms: Number(e.target.value) || 3e3
        }) }) })
      ] }) : null,
      form.ping_enabled ? /* @__PURE__ */ jsxs(Fragment, { children: [
        /* @__PURE__ */ jsx(SectionLabel, { children: "Ping" }),
        /* @__PURE__ */ jsx(FormRow, { label: "Ping interval (s)", children: /* @__PURE__ */ jsx(Input, { type: "number", value: form.ping_interval_seconds, onChange: (e) => setForm({
          ...form,
          ping_interval_seconds: Number(e.target.value) || 60
        }) }) }),
        /* @__PURE__ */ jsx(FormRow, { label: "Loss warn (%)", children: /* @__PURE__ */ jsx(Input, { type: "number", value: form.packet_loss_warning, onChange: (e) => setForm({
          ...form,
          packet_loss_warning: Number(e.target.value) || 5
        }) }) }),
        /* @__PURE__ */ jsx(FormRow, { label: "Loss critical (%)", children: /* @__PURE__ */ jsx(Input, { type: "number", value: form.packet_loss_critical, onChange: (e) => setForm({
          ...form,
          packet_loss_critical: Number(e.target.value) || 20
        }) }) }),
        /* @__PURE__ */ jsx(FormRow, { label: "Latency warn (ms)", children: /* @__PURE__ */ jsx(Input, { type: "number", value: form.latency_warning_ms, onChange: (e) => setForm({
          ...form,
          latency_warning_ms: Number(e.target.value) || 150
        }) }) }),
        /* @__PURE__ */ jsx(FormRow, { label: "Latency critical (ms)", children: /* @__PURE__ */ jsx(Input, { type: "number", value: form.latency_critical_ms, onChange: (e) => setForm({
          ...form,
          latency_critical_ms: Number(e.target.value) || 500
        }) }) })
      ] }) : null
    ] }),
    /* @__PURE__ */ jsx(DialogFooter, { children: /* @__PURE__ */ jsxs(Button, { disabled: save.isPending || !form.name || !form.host || mode === "edit" && !device?.id, onClick: () => save.mutate(), children: [
      save.isPending ? /* @__PURE__ */ jsx(Loader2, { className: "mr-2 h-4 w-4 animate-spin" }) : null,
      mode === "edit" ? "Save" : "Create"
    ] }) })
  ] });
}
function toDeviceForm(device) {
  const fallbackInterval = device?.check_interval_seconds ?? 60;
  return {
    name: device?.name ?? "Router Utama",
    host: device?.host ?? "192.168.1.1",
    type: device?.type ?? "mikrotik",
    snmp_version: device?.snmp_version ?? "v2c",
    snmp_community: device?.snmp_community ?? "public",
    snmp_port: device?.snmp_port ?? 161,
    snmp_timeout: device?.snmp_timeout ?? 5,
    http_url: device?.http_url ?? "",
    http_timeout: device?.http_timeout ?? 10,
    monitor_enabled: device?.monitor_enabled ?? true,
    ping_enabled: device?.ping_enabled ?? true,
    snmp_enabled: device?.snmp_enabled ?? false,
    http_enabled: device?.http_enabled ?? false,
    check_interval_seconds: fallbackInterval,
    ping_interval_seconds: device?.ping_interval_seconds ?? fallbackInterval,
    snmp_interval_seconds: device?.snmp_interval_seconds ?? fallbackInterval,
    http_interval_seconds: device?.http_interval_seconds ?? fallbackInterval,
    packet_loss_warning: device?.packet_loss_warning ?? 5,
    packet_loss_critical: device?.packet_loss_critical ?? 20,
    latency_warning_ms: device?.latency_warning_ms ?? 150,
    latency_critical_ms: device?.latency_critical_ms ?? 500,
    response_time_warning_ms: device?.response_time_warning_ms ?? 1e3,
    response_time_critical_ms: device?.response_time_critical_ms ?? 3e3
  };
}
function normalizeDevicePayload(form) {
  const activeIntervals = [form.ping_enabled ? form.ping_interval_seconds : null, form.snmp_enabled ? form.snmp_interval_seconds : null, form.http_enabled ? form.http_interval_seconds : null].filter((value) => typeof value === "number" && value > 0);
  return {
    ...form,
    check_interval_seconds: activeIntervals.length ? Math.min(...activeIntervals) : 60,
    snmp_community: form.snmp_community || "public",
    http_url: form.http_url.trim()
  };
}
function checkSummary(device) {
  const checks = [device.ping_enabled ? `ping ${intervalLabel(device.ping_interval_seconds, device.check_interval_seconds)}` : null, device.snmp_enabled ? `snmp ${intervalLabel(device.snmp_interval_seconds, device.check_interval_seconds)}` : null, device.http_enabled ? `http ${intervalLabel(device.http_interval_seconds, device.check_interval_seconds)}` : null].filter(Boolean);
  return checks.join(" / ") || "—";
}
function intervalLabel(value, fallback) {
  return `${value || fallback || 60}s`;
}
function statusClass(status) {
  if (status === "up" || status === "healthy" || status === "online") return "text-primary";
  if (status === "warning") return "text-warning";
  if (status === "critical" || status === "down") return "text-destructive";
  return "text-muted-foreground";
}
function errorMessage(error, fallback) {
  return error instanceof Error ? error.message : fallback;
}
function FormRow({
  label,
  children
}) {
  return /* @__PURE__ */ jsxs("div", { className: "space-y-1.5", children: [
    /* @__PURE__ */ jsx(Label, { className: "text-xs text-muted-foreground", children: label }),
    children
  ] });
}
function SectionLabel({
  children
}) {
  return /* @__PURE__ */ jsx("div", { className: "col-span-2 mt-2 border-t border-border pt-3 font-mono text-[11px] uppercase tracking-widest text-muted-foreground lg:col-span-4", children });
}
function SwitchRow({
  label,
  checked,
  onCheckedChange
}) {
  return /* @__PURE__ */ jsxs("div", { className: "flex items-end justify-between rounded-md border border-border px-3 py-2", children: [
    /* @__PURE__ */ jsx(Label, { className: "text-xs text-muted-foreground", children: label }),
    /* @__PURE__ */ jsx(Switch, { checked, onCheckedChange })
  ] });
}
export {
  Devices as component
};
