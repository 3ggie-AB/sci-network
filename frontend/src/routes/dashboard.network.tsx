import { createFileRoute } from "@tanstack/react-router";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import { Send, Loader2, RefreshCw } from "lucide-react";
import { toast } from "sonner";

import { PageHeader } from "@/components/DashboardLayout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { api, asArray, unwrapResponse } from "@/lib/api";

export const Route = createFileRoute("/dashboard/network")({
  component: NetworkTools,
});

type DeviceOption = {
  id?: string;
  name?: string;
  host?: string;
  http_url?: string;
};

type LocalInterface = {
  interface?: string;
  type?: string;
  status?: string;
  connected?: boolean | null;
  is_up?: boolean | null;
  carrier?: boolean | null;
  operstate?: string | null;
  reason?: string | null;
};

function NetworkTools() {
  return (
    <>
      <PageHeader title="Network Tools" description="Ping, SNMP GET, dan HTTP probe." />
      <Tabs defaultValue="ping" className="space-y-4">
        <TabsList>
          <TabsTrigger value="ping">Ping</TabsTrigger>
          <TabsTrigger value="snmp">SNMP</TabsTrigger>
          <TabsTrigger value="http">HTTP GET</TabsTrigger>
          <TabsTrigger value="interfaces">Interfaces</TabsTrigger>
        </TabsList>
        <TabsContent value="ping">
          <PingPanel />
        </TabsContent>
        <TabsContent value="snmp">
          <SnmpPanel />
        </TabsContent>
        <TabsContent value="http">
          <HttpPanel />
        </TabsContent>
        <TabsContent value="interfaces">
          <InterfacePanel />
        </TabsContent>
      </Tabs>
    </>
  );
}

function ResultBox({ data, error, pending }: { data: unknown; error: unknown; pending: boolean }) {
  if (pending) return <div className="text-sm text-muted-foreground">Running...</div>;
  if (error)
    return (
      <pre className="overflow-auto rounded-md bg-destructive/10 p-3 font-mono text-xs text-destructive">
        {String(error instanceof Error ? error.message : error)}
      </pre>
    );
  const payload = unwrapResponse(data);
  if (payload === null) return null;
  return (
    <pre className="max-h-[400px] overflow-auto rounded-md bg-muted/40 p-3 font-mono text-xs">
      {JSON.stringify(payload, null, 2)}
    </pre>
  );
}

function Panel({
  children,
  onRun,
  pending,
}: {
  children: React.ReactNode;
  onRun: () => void;
  pending: boolean;
}) {
  return (
    <div className="rounded-xl border border-border bg-card/70 p-5 space-y-4">
      {children}
      <Button onClick={onRun} disabled={pending}>
        {pending ? (
          <Loader2 className="mr-2 h-4 w-4 animate-spin" />
        ) : (
          <Send className="mr-2 h-4 w-4" />
        )}
        Run
      </Button>
    </div>
  );
}

function PingPanel() {
  const [host, setHost] = useState("8.8.8.8");
  const [count, setCount] = useState(4);
  const run = useMutation({
    mutationFn: () => api("/api/network/ping", { method: "POST", json: { host, count } }),
  });
  return (
    <>
      <Panel onRun={() => run.mutate()} pending={run.isPending}>
        <div className="grid grid-cols-2 gap-3">
          <div className="space-y-1.5">
            <Label className="text-xs text-muted-foreground">Host</Label>
            <Input value={host} onChange={(e) => setHost(e.target.value)} />
          </div>
          <div className="space-y-1.5">
            <Label className="text-xs text-muted-foreground">Count</Label>
            <Input
              type="number"
              value={count}
              onChange={(e) => setCount(Number(e.target.value) || 1)}
            />
          </div>
        </div>
      </Panel>
      <div className="mt-4">
        <ResultBox data={run.data} error={run.error} pending={run.isPending} />
      </div>
    </>
  );
}

function SnmpPanel() {
  const [host, setHost] = useState("192.168.1.1");
  const [community, setCommunity] = useState("public");
  const [version, setVersion] = useState("v2c");
  const [oids, setOids] = useState(".1.3.6.1.2.1.1.1.0,.1.3.6.1.2.1.1.5.0");
  const run = useMutation({
    mutationFn: () =>
      api("/api/network/snmp", {
        method: "POST",
        json: {
          host,
          community,
          version,
          oids: oids
            .split(",")
            .map((s) => s.trim())
            .filter(Boolean),
          port: 161,
          timeout: 5,
        },
      }),
  });
  return (
    <>
      <Panel onRun={() => run.mutate()} pending={run.isPending}>
        <div className="grid grid-cols-3 gap-3">
          <div className="space-y-1.5">
            <Label className="text-xs text-muted-foreground">Host</Label>
            <Input value={host} onChange={(e) => setHost(e.target.value)} />
          </div>
          <div className="space-y-1.5">
            <Label className="text-xs text-muted-foreground">Community</Label>
            <Input value={community} onChange={(e) => setCommunity(e.target.value)} />
          </div>
          <div className="space-y-1.5">
            <Label className="text-xs text-muted-foreground">Version</Label>
            <Input value={version} onChange={(e) => setVersion(e.target.value)} />
          </div>
        </div>
        <div className="space-y-1.5">
          <Label className="text-xs text-muted-foreground">OIDs (comma separated)</Label>
          <Textarea
            rows={2}
            value={oids}
            onChange={(e) => setOids(e.target.value)}
            className="font-mono text-xs"
          />
        </div>
      </Panel>
      <div className="mt-4">
        <ResultBox data={run.data} error={run.error} pending={run.isPending} />
      </div>
    </>
  );
}

function HttpPanel() {
  const [url, setUrl] = useState("https://belsp.itsyntax.dev");
  const [headers, setHeaders] = useState("{}");
  const [deviceID, setDeviceID] = useState("manual");
  const devices = useQuery({
    queryKey: ["devices", "http-options"],
    queryFn: () => api<unknown>("/api/devices?page=1&limit=100"),
  });
  const deviceOptions = asArray<DeviceOption>(devices.data).filter((d) => d.id);
  const run = useMutation({
    mutationFn: () => {
      if (deviceID !== "manual") {
        return api("/api/network/http-get", {
          method: "POST",
          json: { device_id: deviceID },
        });
      }

      let h: Record<string, string> = {};
      try {
        const parsed = JSON.parse(headers || "{}");
        if (parsed && typeof parsed === "object" && !Array.isArray(parsed)) {
          h = parsed as Record<string, string>;
        }
      } catch {
        /* ignore */
      }
      return api("/api/network/http-get", {
        method: "POST",
        json: { url, headers: h, timeout: 10 },
      });
    },
  });
  return (
    <>
      <Panel onRun={() => run.mutate()} pending={run.isPending}>
        <div className="space-y-1.5">
          <Label className="text-xs text-muted-foreground">Device</Label>
          <Select value={deviceID} onValueChange={setDeviceID}>
            <SelectTrigger>
              <SelectValue placeholder="Manual URL" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="manual">Manual URL</SelectItem>
              {deviceOptions.map((device) => (
                <SelectItem key={device.id} value={device.id ?? "manual"}>
                  {device.name ?? device.host ?? device.id}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <div className="space-y-1.5">
          <Label className="text-xs text-muted-foreground">URL</Label>
          <Input
            value={url}
            disabled={deviceID !== "manual"}
            onChange={(e) => setUrl(e.target.value)}
          />
        </div>
        <div className="space-y-1.5">
          <Label className="text-xs text-muted-foreground">Headers (JSON)</Label>
          <Textarea
            rows={3}
            value={headers}
            disabled={deviceID !== "manual"}
            onChange={(e) => setHeaders(e.target.value)}
            className="font-mono text-xs"
          />
        </div>
      </Panel>
      <div className="mt-4">
        <ResultBox data={run.data} error={run.error} pending={run.isPending} />
      </div>
    </>
  );
}

function InterfacePanel() {
  const qc = useQueryClient();
  const list = useQuery({
    queryKey: ["network", "interfaces"],
    queryFn: () => api<unknown>("/api/network/interfaces"),
    refetchInterval: 15_000,
  });
  const check = useMutation({
    mutationFn: () => api<unknown>("/api/network/interfaces/check", { method: "POST" }),
    onSuccess: () => {
      toast.success("Interface check logged");
      qc.invalidateQueries({ queryKey: ["network", "interfaces"] });
      qc.invalidateQueries({ queryKey: ["network", "logs"] });
      qc.invalidateQueries({ queryKey: ["alerts"] });
    },
    onError: (e: unknown) =>
      toast.error(e instanceof Error ? e.message : "Failed to check interfaces"),
  });
  const interfaces = asArray<LocalInterface>(list.data);

  return (
    <div className="space-y-4 rounded-xl border border-border bg-card/70 p-5">
      <div className="flex items-center justify-between gap-3">
        <div>
          <div className="text-sm font-semibold">Local Interface Agent</div>
          <div className="text-xs text-muted-foreground">
            Status Ethernet/WiFi dari host yang menjalankan backend.
          </div>
        </div>
        <Button onClick={() => check.mutate()} disabled={check.isPending}>
          {check.isPending ? (
            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
          ) : (
            <RefreshCw className="mr-2 h-4 w-4" />
          )}
          Check now
        </Button>
      </div>

      <div className="divide-y divide-border rounded-md border border-border/70">
        {list.isLoading ? (
          <div className="p-4 text-sm text-muted-foreground">Loading...</div>
        ) : interfaces.length > 0 ? (
          interfaces.map((item, index) => (
            <div
              key={item.interface ?? index}
              className="grid gap-2 p-4 text-sm md:grid-cols-[1fr_auto_auto_auto]"
            >
              <div className="min-w-0">
                <div className="truncate font-mono">{item.interface ?? "unknown"}</div>
                <div className="mt-1 text-xs text-muted-foreground">{item.reason ?? "—"}</div>
              </div>
              <span className="font-mono text-xs text-muted-foreground">{item.type ?? "—"}</span>
              <span className={`font-mono text-xs ${interfaceStatusClass(item.status)}`}>
                {item.status ?? "unknown"}
              </span>
              <span className="font-mono text-xs text-muted-foreground">
                operstate: {item.operstate ?? "null"}
              </span>
            </div>
          ))
        ) : (
          <div className="p-4 text-sm text-muted-foreground">No physical interface detected.</div>
        )}
      </div>

      <ResultBox data={check.data} error={check.error} pending={check.isPending} />
    </div>
  );
}

function interfaceStatusClass(status?: string) {
  if (status === "connected") return "text-primary";
  if (status === "disconnected" || status === "unknown") return "text-warning";
  if (status === "cable_unplugged" || status === "down") return "text-destructive";
  return "text-muted-foreground";
}
