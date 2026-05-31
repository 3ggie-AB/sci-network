import { createFileRoute } from "@tanstack/react-router";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import { Loader2, Pencil, Plus, Trash2 } from "lucide-react";
import { toast } from "sonner";

import { PageHeader } from "@/components/DashboardLayout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { api, asArray } from "@/lib/api";

export const Route = createFileRoute("/dashboard/devices")({
  component: Devices,
});

type Device = DeviceForm & {
  id?: string;
  status?: string;
  last_status?: string;
};

type DeviceForm = {
  name: string;
  host: string;
  type: string;
  snmp_version: string;
  snmp_community: string;
  snmp_port: number;
  snmp_timeout: number;
  http_url: string;
  http_timeout: number;
  monitor_enabled: boolean;
  ping_enabled: boolean;
  snmp_enabled: boolean;
  http_enabled: boolean;
  check_interval_seconds: number;
  ping_interval_seconds: number;
  snmp_interval_seconds: number;
  http_interval_seconds: number;
  packet_loss_warning: number;
  packet_loss_critical: number;
  latency_warning_ms: number;
  latency_critical_ms: number;
  response_time_warning_ms: number;
  response_time_critical_ms: number;
};

const deviceTypes = ["server", "router", "mikrotik", "switch", "gateway", "other"];
const snmpVersions = ["v1", "v2c", "v3"];

function Devices() {
  const qc = useQueryClient();
  const [createOpen, setCreateOpen] = useState(false);
  const [editing, setEditing] = useState<Device | null>(null);

  const list = useQuery({
    queryKey: ["devices"],
    queryFn: () => api<unknown>("/api/devices?page=1&limit=50"),
  });

  const del = useMutation({
    mutationFn: (id: string) => api(`/api/devices/${id}`, { method: "DELETE" }),
    onSuccess: () => {
      toast.success("Device removed");
      qc.invalidateQueries({ queryKey: ["devices"] });
    },
    onError: (e: unknown) => toast.error(errorMessage(e, "Failed to delete")),
  });

  const items = asArray<Device>(list.data);

  return (
    <>
      <PageHeader
        title="Devices"
        description="Inventory perangkat & target monitoring."
        actions={
          <Dialog open={createOpen} onOpenChange={setCreateOpen}>
            <DialogTrigger asChild>
              <Button>
                <Plus className="mr-2 h-4 w-4" /> New device
              </Button>
            </DialogTrigger>
            <DeviceDialog mode="create" onDone={() => setCreateOpen(false)} />
          </Dialog>
        }
      />

      <div className="overflow-hidden rounded-xl border border-border bg-card/70">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Name</TableHead>
              <TableHead>Host</TableHead>
              <TableHead>Type</TableHead>
              <TableHead>Checks</TableHead>
              <TableHead>Monitor</TableHead>
              <TableHead>Status</TableHead>
              <TableHead className="w-28 text-right" />
            </TableRow>
          </TableHeader>
          <TableBody>
            {list.isLoading && (
              <TableRow>
                <TableCell colSpan={7} className="py-8 text-center text-muted-foreground">
                  Loading...
                </TableCell>
              </TableRow>
            )}
            {!list.isLoading && items.length === 0 && (
              <TableRow>
                <TableCell colSpan={7} className="py-8 text-center text-muted-foreground">
                  No devices yet.
                </TableCell>
              </TableRow>
            )}
            {items.map((d, i) => {
              const status = d.last_status ?? d.status ?? "unknown";

              return (
                <TableRow key={d.id ?? i}>
                  <TableCell className="font-medium">{d.name ?? "—"}</TableCell>
                  <TableCell className="font-mono text-xs">{d.host ?? "—"}</TableCell>
                  <TableCell>{d.type ?? "—"}</TableCell>
                  <TableCell className="font-mono text-xs">{checkSummary(d)}</TableCell>
                  <TableCell>
                    <span
                      className={`font-mono text-xs ${
                        d.monitor_enabled ? "text-primary" : "text-muted-foreground"
                      }`}
                    >
                      {d.monitor_enabled ? "on" : "off"}
                    </span>
                  </TableCell>
                  <TableCell>
                    <span className={`font-mono text-xs ${statusClass(status)}`}>{status}</span>
                  </TableCell>
                  <TableCell className="space-x-1 text-right">
                    <Button
                      size="icon"
                      variant="ghost"
                      disabled={!d.id}
                      onClick={() => setEditing(d)}
                      aria-label="Edit"
                    >
                      <Pencil className="h-4 w-4" />
                    </Button>
                    <Button
                      size="icon"
                      variant="ghost"
                      disabled={!d.id || del.isPending}
                      onClick={() => d.id && del.mutate(d.id)}
                      aria-label="Delete"
                    >
                      <Trash2 className="h-4 w-4 text-destructive" />
                    </Button>
                  </TableCell>
                </TableRow>
              );
            })}
          </TableBody>
        </Table>
      </div>

      <Dialog open={!!editing} onOpenChange={(open) => !open && setEditing(null)}>
        {editing ? (
          <DeviceDialog mode="edit" device={editing} onDone={() => setEditing(null)} />
        ) : null}
      </Dialog>
    </>
  );
}

function DeviceDialog({
  mode,
  device,
  onDone,
}: {
  mode: "create" | "edit";
  device?: Device;
  onDone: () => void;
}) {
  const qc = useQueryClient();
  const [form, setForm] = useState<DeviceForm>(() => toDeviceForm(device));

  const save = useMutation({
    mutationFn: () => {
      const payload = normalizeDevicePayload(form);
      if (mode === "edit" && device?.id) {
        return api(`/api/devices/${device.id}`, { method: "PUT", json: payload });
      }
      return api("/api/devices", { method: "POST", json: payload });
    },
    onSuccess: () => {
      toast.success(mode === "edit" ? "Device updated" : "Device created");
      qc.invalidateQueries({ queryKey: ["devices"] });
      onDone();
    },
    onError: (e: unknown) =>
      toast.error(errorMessage(e, mode === "edit" ? "Failed to update" : "Failed to create")),
  });

  return (
    <DialogContent className="max-w-4xl">
      <DialogHeader>
        <DialogTitle>{mode === "edit" ? "Edit device" : "New device"}</DialogTitle>
      </DialogHeader>

      <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        <FormRow label="Name">
          <Input value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} />
        </FormRow>
        <FormRow label="Host">
          <Input value={form.host} onChange={(e) => setForm({ ...form, host: e.target.value })} />
        </FormRow>
        <FormRow label="Type">
          <Select value={form.type} onValueChange={(type) => setForm({ ...form, type })}>
            <SelectTrigger>
              <SelectValue placeholder="Type" />
            </SelectTrigger>
            <SelectContent>
              {deviceTypes.map((type) => (
                <SelectItem key={type} value={type}>
                  {type}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </FormRow>

        <SwitchRow
          label="Monitor"
          checked={form.monitor_enabled}
          onCheckedChange={(monitor_enabled) => setForm({ ...form, monitor_enabled })}
        />
        <SwitchRow
          label="Ping"
          checked={form.ping_enabled}
          onCheckedChange={(ping_enabled) => setForm({ ...form, ping_enabled })}
        />
        <SwitchRow
          label="SNMP"
          checked={form.snmp_enabled}
          onCheckedChange={(snmp_enabled) => setForm({ ...form, snmp_enabled })}
        />
        <SwitchRow
          label="HTTP GET"
          checked={form.http_enabled}
          onCheckedChange={(http_enabled) => setForm({ ...form, http_enabled })}
        />

        {form.snmp_enabled ? (
          <>
            <SectionLabel>SNMP</SectionLabel>
            <FormRow label="SNMP interval (s)">
              <Input
                type="number"
                value={form.snmp_interval_seconds}
                onChange={(e) =>
                  setForm({ ...form, snmp_interval_seconds: Number(e.target.value) || 60 })
                }
              />
            </FormRow>
            <FormRow label="SNMP version">
              <Select
                value={form.snmp_version}
                onValueChange={(snmp_version) => setForm({ ...form, snmp_version })}
              >
                <SelectTrigger>
                  <SelectValue placeholder="SNMP" />
                </SelectTrigger>
                <SelectContent>
                  {snmpVersions.map((version) => (
                    <SelectItem key={version} value={version}>
                      {version}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </FormRow>
            <FormRow label="Community">
              <Input
                value={form.snmp_community}
                onChange={(e) => setForm({ ...form, snmp_community: e.target.value })}
              />
            </FormRow>
            <FormRow label="SNMP port">
              <Input
                type="number"
                value={form.snmp_port}
                onChange={(e) => setForm({ ...form, snmp_port: Number(e.target.value) || 161 })}
              />
            </FormRow>
            <FormRow label="SNMP timeout">
              <Input
                type="number"
                value={form.snmp_timeout}
                onChange={(e) => setForm({ ...form, snmp_timeout: Number(e.target.value) || 5 })}
              />
            </FormRow>
          </>
        ) : null}

        {form.http_enabled ? (
          <>
            <SectionLabel>HTTP GET</SectionLabel>
            <FormRow label="HTTP URL">
              <Input
                value={form.http_url}
                onChange={(e) => setForm({ ...form, http_url: e.target.value })}
                placeholder="https://server.example/health"
              />
            </FormRow>
            <FormRow label="HTTP timeout">
              <Input
                type="number"
                value={form.http_timeout}
                onChange={(e) => setForm({ ...form, http_timeout: Number(e.target.value) || 10 })}
              />
            </FormRow>
            <FormRow label="HTTP interval (s)">
              <Input
                type="number"
                value={form.http_interval_seconds}
                onChange={(e) =>
                  setForm({ ...form, http_interval_seconds: Number(e.target.value) || 60 })
                }
              />
            </FormRow>
            <FormRow label="HTTP warn (ms)">
              <Input
                type="number"
                value={form.response_time_warning_ms}
                onChange={(e) =>
                  setForm({ ...form, response_time_warning_ms: Number(e.target.value) || 1000 })
                }
              />
            </FormRow>
            <FormRow label="HTTP critical (ms)">
              <Input
                type="number"
                value={form.response_time_critical_ms}
                onChange={(e) =>
                  setForm({ ...form, response_time_critical_ms: Number(e.target.value) || 3000 })
                }
              />
            </FormRow>
          </>
        ) : null}

        {form.ping_enabled ? (
          <>
            <SectionLabel>Ping</SectionLabel>
            <FormRow label="Ping interval (s)">
              <Input
                type="number"
                value={form.ping_interval_seconds}
                onChange={(e) =>
                  setForm({ ...form, ping_interval_seconds: Number(e.target.value) || 60 })
                }
              />
            </FormRow>
            <FormRow label="Loss warn (%)">
              <Input
                type="number"
                value={form.packet_loss_warning}
                onChange={(e) =>
                  setForm({ ...form, packet_loss_warning: Number(e.target.value) || 5 })
                }
              />
            </FormRow>
            <FormRow label="Loss critical (%)">
              <Input
                type="number"
                value={form.packet_loss_critical}
                onChange={(e) =>
                  setForm({ ...form, packet_loss_critical: Number(e.target.value) || 20 })
                }
              />
            </FormRow>
            <FormRow label="Latency warn (ms)">
              <Input
                type="number"
                value={form.latency_warning_ms}
                onChange={(e) =>
                  setForm({ ...form, latency_warning_ms: Number(e.target.value) || 150 })
                }
              />
            </FormRow>
            <FormRow label="Latency critical (ms)">
              <Input
                type="number"
                value={form.latency_critical_ms}
                onChange={(e) =>
                  setForm({ ...form, latency_critical_ms: Number(e.target.value) || 500 })
                }
              />
            </FormRow>
          </>
        ) : null}
      </div>

      <DialogFooter>
        <Button
          disabled={save.isPending || !form.name || !form.host || (mode === "edit" && !device?.id)}
          onClick={() => save.mutate()}
        >
          {save.isPending ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
          {mode === "edit" ? "Save" : "Create"}
        </Button>
      </DialogFooter>
    </DialogContent>
  );
}

function toDeviceForm(device?: Device): DeviceForm {
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
    response_time_warning_ms: device?.response_time_warning_ms ?? 1000,
    response_time_critical_ms: device?.response_time_critical_ms ?? 3000,
  };
}

function normalizeDevicePayload(form: DeviceForm) {
  const activeIntervals = [
    form.ping_enabled ? form.ping_interval_seconds : null,
    form.snmp_enabled ? form.snmp_interval_seconds : null,
    form.http_enabled ? form.http_interval_seconds : null,
  ].filter((value): value is number => typeof value === "number" && value > 0);

  return {
    ...form,
    check_interval_seconds: activeIntervals.length ? Math.min(...activeIntervals) : 60,
    snmp_community: form.snmp_community || "public",
    http_url: form.http_url.trim(),
  };
}

function checkSummary(device: Device) {
  const checks = [
    device.ping_enabled
      ? `ping ${intervalLabel(device.ping_interval_seconds, device.check_interval_seconds)}`
      : null,
    device.snmp_enabled
      ? `snmp ${intervalLabel(device.snmp_interval_seconds, device.check_interval_seconds)}`
      : null,
    device.http_enabled
      ? `http ${intervalLabel(device.http_interval_seconds, device.check_interval_seconds)}`
      : null,
  ].filter(Boolean);
  return checks.join(" / ") || "—";
}

function intervalLabel(value?: number, fallback?: number) {
  return `${value || fallback || 60}s`;
}

function statusClass(status: string) {
  if (status === "up" || status === "healthy" || status === "online") return "text-primary";
  if (status === "warning") return "text-warning";
  if (status === "critical" || status === "down") return "text-destructive";
  return "text-muted-foreground";
}

function errorMessage(error: unknown, fallback: string) {
  return error instanceof Error ? error.message : fallback;
}

function FormRow({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="space-y-1.5">
      <Label className="text-xs text-muted-foreground">{label}</Label>
      {children}
    </div>
  );
}

function SectionLabel({ children }: { children: React.ReactNode }) {
  return (
    <div className="col-span-2 mt-2 border-t border-border pt-3 font-mono text-[11px] uppercase tracking-widest text-muted-foreground lg:col-span-4">
      {children}
    </div>
  );
}

function SwitchRow({
  label,
  checked,
  onCheckedChange,
}: {
  label: string;
  checked: boolean;
  onCheckedChange: (checked: boolean) => void;
}) {
  return (
    <div className="flex items-end justify-between rounded-md border border-border px-3 py-2">
      <Label className="text-xs text-muted-foreground">{label}</Label>
      <Switch checked={checked} onCheckedChange={onCheckedChange} />
    </div>
  );
}
