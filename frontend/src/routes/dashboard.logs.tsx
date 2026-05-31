import { createFileRoute } from "@tanstack/react-router";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import { ChevronLeft, ChevronRight, Loader2, Search, Trash2 } from "lucide-react";
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
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
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

type LogMeta = {
  total?: number;
  page?: number;
  limit?: number;
  pages?: number;
};

const actions = ["all", "ping", "snmp", "http", "interface"];
const statuses = ["all", "up", "warning", "critical", "down", "error", "unknown"];
const limits = [10, 25, 50, 100];

function Logs() {
  const qc = useQueryClient();
  const [selected, setSelected] = useState<LogRow | null>(null);
  const [page, setPage] = useState(1);
  const [limit, setLimit] = useState(50);
  const [searchText, setSearchText] = useState("");
  const [query, setQuery] = useState("");
  const [action, setAction] = useState("all");
  const [status, setStatus] = useState("all");
  const list = useQuery({
    queryKey: ["network", "logs", page, limit, query, action, status],
    queryFn: () => api<unknown>(logsURL({ page, limit, query, action, status })),
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
  const meta = logMeta(list.data);
  const total = Number(meta.total ?? items.length);
  const pages = Math.max(1, Number(meta.pages ?? 1));
  const canPrev = page > 1 && !list.isFetching;
  const canNext = page < pages && !list.isFetching;

  function applySearch() {
    setPage(1);
    setQuery(searchText.trim());
  }

  function resetFilters() {
    setPage(1);
    setSearchText("");
    setQuery("");
    setAction("all");
    setStatus("all");
    setLimit(50);
  }

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
      <div className="mb-4 rounded-xl border border-border bg-card/70 p-4">
        <div className="grid grid-cols-1 gap-3 lg:grid-cols-[1fr_150px_150px_120px_auto]">
          <div className="flex gap-2">
            <Input
              value={searchText}
              onChange={(e) => setSearchText(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter") applySearch();
              }}
              placeholder="Cari target, status, action, device_id, atau isi JSON..."
            />
            <Button variant="secondary" onClick={applySearch} disabled={list.isFetching}>
              <Search className="mr-2 h-4 w-4" />
              Search
            </Button>
          </div>
          <Select
            value={action}
            onValueChange={(value) => {
              setPage(1);
              setAction(value);
            }}
          >
            <SelectTrigger>
              <SelectValue placeholder="Action" />
            </SelectTrigger>
            <SelectContent>
              {actions.map((item) => (
                <SelectItem key={item} value={item}>
                  {item === "all" ? "All actions" : item}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Select
            value={status}
            onValueChange={(value) => {
              setPage(1);
              setStatus(value);
            }}
          >
            <SelectTrigger>
              <SelectValue placeholder="Status" />
            </SelectTrigger>
            <SelectContent>
              {statuses.map((item) => (
                <SelectItem key={item} value={item}>
                  {item === "all" ? "All status" : item}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Select
            value={String(limit)}
            onValueChange={(value) => {
              setPage(1);
              setLimit(Number(value));
            }}
          >
            <SelectTrigger>
              <SelectValue placeholder="Limit" />
            </SelectTrigger>
            <SelectContent>
              {limits.map((item) => (
                <SelectItem key={item} value={String(item)}>
                  {item} rows
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Button variant="outline" onClick={resetFilters} disabled={list.isFetching}>
            Reset
          </Button>
        </div>
      </div>

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

      <div className="mt-4 flex flex-col gap-3 rounded-xl border border-border bg-card/70 px-4 py-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="font-mono text-xs text-muted-foreground">
          Showing {items.length} of {total.toLocaleString()} logs · page {page} / {pages}
          {list.isFetching ? " · refreshing" : ""}
        </div>
        <div className="flex gap-2">
          <Button
            variant="secondary"
            size="sm"
            disabled={!canPrev}
            onClick={() => setPage(page - 1)}
          >
            <ChevronLeft className="mr-1 h-4 w-4" />
            Prev
          </Button>
          <Button
            variant="secondary"
            size="sm"
            disabled={!canNext}
            onClick={() => setPage(page + 1)}
          >
            Next
            <ChevronRight className="ml-1 h-4 w-4" />
          </Button>
        </div>
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

function logsURL({
  page,
  limit,
  query,
  action,
  status,
}: {
  page: number;
  limit: number;
  query: string;
  action: string;
  status: string;
}) {
  const params = new URLSearchParams({ page: String(page), limit: String(limit) });
  if (query) params.set("q", query);
  if (action !== "all") params.set("action", action);
  if (status !== "all") params.set("status", status);
  return `/api/network/logs?${params.toString()}`;
}

function logMeta(response: unknown): LogMeta {
  if (typeof response !== "object" || response === null || !("meta" in response)) return {};
  const meta = (response as { meta?: unknown }).meta;
  if (typeof meta !== "object" || meta === null) return {};
  return meta as LogMeta;
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
