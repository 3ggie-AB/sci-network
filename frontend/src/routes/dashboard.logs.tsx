import { createFileRoute } from "@tanstack/react-router";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import { Loader2, Trash2 } from "lucide-react";
import { toast } from "sonner";

import { PageHeader } from "@/components/DashboardLayout";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { api, asArray } from "@/lib/api";

export const Route = createFileRoute("/dashboard/logs")({
  component: Logs,
});

type LogRow = {
  id?: string;
  timestamp?: string;
  created_at?: string;
  action?: string;
  device_name?: string;
  device_id?: string;
  status?: string;
  message?: string;
  result?: string;
};

function Logs() {
  const qc = useQueryClient();
  const [selected, setSelected] = useState<LogRow | null>(null);
  const list = useQuery({
    queryKey: ["network", "logs"],
    queryFn: () => api<unknown>("/api/network/logs?page=1&limit=50"),
    refetchInterval: 20_000,
  });

  const clearLogs = useMutation({
    mutationFn: () => api("/api/network/logs", { method: "DELETE" }),
    onSuccess: () => {
      toast.success("Network logs cleared");
      qc.invalidateQueries({ queryKey: ["network", "logs"] });
      qc.invalidateQueries({ queryKey: ["network", "stats"] });
    },
    onError: (e: unknown) => toast.error(e instanceof Error ? e.message : "Failed to clear logs"),
  });

  const items = asArray<LogRow>(list.data);

  return (
    <>
      <PageHeader
        title="Network Logs"
        description="Histori probe & monitoring."
        actions={
          <AlertDialog>
            <AlertDialogTrigger asChild>
              <Button variant="destructive" disabled={clearLogs.isPending || items.length === 0}>
                {clearLogs.isPending ? (
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                ) : (
                  <Trash2 className="mr-2 h-4 w-4" />
                )}
                Clear logs
              </Button>
            </AlertDialogTrigger>
            <AlertDialogContent>
              <AlertDialogHeader>
                <AlertDialogTitle>Clear all network logs?</AlertDialogTitle>
                <AlertDialogDescription>
                  Semua histori ping, SNMP, HTTP, dan scheduler log di ClickHouse akan dikosongkan.
                </AlertDialogDescription>
              </AlertDialogHeader>
              <AlertDialogFooter>
                <AlertDialogCancel>Cancel</AlertDialogCancel>
                <AlertDialogAction onClick={() => clearLogs.mutate()}>Clear logs</AlertDialogAction>
              </AlertDialogFooter>
            </AlertDialogContent>
          </AlertDialog>
        }
      />
      <div className="overflow-hidden rounded-xl border border-border bg-card/70">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Time</TableHead>
              <TableHead>Action</TableHead>
              <TableHead>Device</TableHead>
              <TableHead>Status</TableHead>
              <TableHead className="w-28 text-right">Detail</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {list.isLoading && (
              <TableRow>
                <TableCell colSpan={5} className="py-8 text-center text-muted-foreground">
                  Loading...
                </TableCell>
              </TableRow>
            )}
            {!list.isLoading && items.length === 0 && (
              <TableRow>
                <TableCell colSpan={5} className="py-8 text-center text-muted-foreground">
                  No logs.
                </TableCell>
              </TableRow>
            )}
            {items.map((l, i) => (
              <TableRow key={l.id ?? i}>
                <TableCell className="font-mono text-xs text-muted-foreground">
                  {(l.timestamp ?? l.created_at)
                    ? new Date(l.timestamp ?? l.created_at).toLocaleString()
                    : "—"}
                </TableCell>
                <TableCell className="font-mono text-xs">{l.action ?? "—"}</TableCell>
                <TableCell className="font-mono text-xs">
                  {l.device_name ?? l.device_id ?? "—"}
                </TableCell>
                <TableCell>
                  <span
                    className={`font-mono text-xs ${
                      l.status === "critical"
                        ? "text-destructive"
                        : l.status === "warning"
                          ? "text-warning"
                          : l.status === "ok" || l.status === "healthy" || l.status === "up"
                            ? "text-primary"
                            : "text-muted-foreground"
                    }`}
                  >
                    {l.status ?? "—"}
                  </span>
                </TableCell>
                <TableCell className="text-right">
                  <Button size="sm" variant="secondary" onClick={() => setSelected(l)}>
                    View JSON
                  </Button>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>

      <Dialog open={!!selected} onOpenChange={(open) => !open && setSelected(null)}>
        <DialogContent className="max-w-3xl">
          <DialogHeader>
            <DialogTitle>Log detail</DialogTitle>
          </DialogHeader>
          <pre className="max-h-[70vh] overflow-auto rounded-md bg-muted/40 p-3 font-mono text-xs">
            {selected ? formatLogDetail(selected) : ""}
          </pre>
        </DialogContent>
      </Dialog>
    </>
  );
}

function formatLogDetail(log: LogRow) {
  const result = parseMaybeJSON(log.result);
  return JSON.stringify({ ...log, result }, null, 2);
}

function parseMaybeJSON(value: unknown) {
  if (typeof value !== "string") return value ?? null;
  try {
    return JSON.parse(value);
  } catch {
    return value;
  }
}
