import { jsxs, Fragment, jsx } from "react/jsx-runtime";
import { useQueryClient, useQuery, useMutation } from "@tanstack/react-query";
import { useState } from "react";
import { Loader2, Trash2, Search, ChevronLeft, ChevronRight } from "lucide-react";
import { toast } from "sonner";
import { P as PageHeader } from "./DashboardLayout-RYDn1jmq.js";
import { A as AlertDialog, a as AlertDialogTrigger, b as AlertDialogContent, c as AlertDialogHeader, d as AlertDialogTitle, e as AlertDialogDescription, f as AlertDialogFooter, g as AlertDialogCancel, h as AlertDialogAction } from "./alert-dialog-DpCH8EKh.js";
import { B as Button } from "./button-BXrfXN_b.js";
import { T as Table, b as TableHeader, c as TableRow, d as TableHead, e as TableBody, f as TableCell, D as Dialog, g as DialogContent, h as DialogHeader, i as DialogTitle } from "./table-CFZJqILE.js";
import { I as Input } from "./input-DwaGuH4D.js";
import { S as Select, a as SelectTrigger, b as SelectValue, c as SelectContent, d as SelectItem } from "./select-Dn_c42EA.js";
import { a as api, c as asArray } from "./router-BHOai5Fo.js";
import "@tanstack/react-router";
import "./push-notifications-CahqIseY.js";
import "@radix-ui/react-alert-dialog";
import "@radix-ui/react-slot";
import "class-variance-authority";
import "clsx";
import "tailwind-merge";
import "@radix-ui/react-dialog";
import "@radix-ui/react-select";
const actions = ["all", "ping", "snmp", "http", "interface"];
const statuses = ["all", "up", "warning", "critical", "down", "error", "unknown"];
const limits = [10, 25, 50, 100];
function Logs() {
  const qc = useQueryClient();
  const [selected, setSelected] = useState(null);
  const [page, setPage] = useState(1);
  const [limit, setLimit] = useState(50);
  const [searchText, setSearchText] = useState("");
  const [query, setQuery] = useState("");
  const [action, setAction] = useState("all");
  const [status, setStatus] = useState("all");
  const list = useQuery({
    queryKey: ["network", "logs", page, limit, query, action, status],
    queryFn: () => api(logsURL({
      page,
      limit,
      query,
      action,
      status
    })),
    refetchInterval: 2e4
  });
  const clearLogs = useMutation({
    mutationFn: () => api("/api/network/logs", {
      method: "DELETE"
    }),
    onSuccess: () => {
      toast.success("Network logs cleared");
      qc.invalidateQueries({
        queryKey: ["network", "logs"]
      });
      qc.invalidateQueries({
        queryKey: ["network", "stats"]
      });
    },
    onError: (e) => toast.error(e instanceof Error ? e.message : "Failed to clear logs")
  });
  const items = asArray(list.data);
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
  return /* @__PURE__ */ jsxs(Fragment, { children: [
    /* @__PURE__ */ jsx(PageHeader, { title: "Network Logs", description: "Histori probe & monitoring.", actions: /* @__PURE__ */ jsxs(AlertDialog, { children: [
      /* @__PURE__ */ jsx(AlertDialogTrigger, { asChild: true, children: /* @__PURE__ */ jsxs(Button, { variant: "destructive", disabled: clearLogs.isPending || items.length === 0, children: [
        clearLogs.isPending ? /* @__PURE__ */ jsx(Loader2, { className: "mr-2 h-4 w-4 animate-spin" }) : /* @__PURE__ */ jsx(Trash2, { className: "mr-2 h-4 w-4" }),
        "Clear logs"
      ] }) }),
      /* @__PURE__ */ jsxs(AlertDialogContent, { children: [
        /* @__PURE__ */ jsxs(AlertDialogHeader, { children: [
          /* @__PURE__ */ jsx(AlertDialogTitle, { children: "Clear all network logs?" }),
          /* @__PURE__ */ jsx(AlertDialogDescription, { children: "Semua histori ping, SNMP, HTTP, dan scheduler log di ClickHouse akan dikosongkan." })
        ] }),
        /* @__PURE__ */ jsxs(AlertDialogFooter, { children: [
          /* @__PURE__ */ jsx(AlertDialogCancel, { children: "Cancel" }),
          /* @__PURE__ */ jsx(AlertDialogAction, { onClick: () => clearLogs.mutate(), children: "Clear logs" })
        ] })
      ] })
    ] }) }),
    /* @__PURE__ */ jsx("div", { className: "mb-4 rounded-xl border border-border bg-card/70 p-4", children: /* @__PURE__ */ jsxs("div", { className: "grid grid-cols-1 gap-3 lg:grid-cols-[1fr_150px_150px_120px_auto]", children: [
      /* @__PURE__ */ jsxs("div", { className: "flex gap-2", children: [
        /* @__PURE__ */ jsx(Input, { value: searchText, onChange: (e) => setSearchText(e.target.value), onKeyDown: (e) => {
          if (e.key === "Enter") applySearch();
        }, placeholder: "Cari target, status, action, device_id, atau isi JSON..." }),
        /* @__PURE__ */ jsxs(Button, { variant: "secondary", onClick: applySearch, disabled: list.isFetching, children: [
          /* @__PURE__ */ jsx(Search, { className: "mr-2 h-4 w-4" }),
          "Search"
        ] })
      ] }),
      /* @__PURE__ */ jsxs(Select, { value: action, onValueChange: (value) => {
        setPage(1);
        setAction(value);
      }, children: [
        /* @__PURE__ */ jsx(SelectTrigger, { children: /* @__PURE__ */ jsx(SelectValue, { placeholder: "Action" }) }),
        /* @__PURE__ */ jsx(SelectContent, { children: actions.map((item) => /* @__PURE__ */ jsx(SelectItem, { value: item, children: item === "all" ? "All actions" : item }, item)) })
      ] }),
      /* @__PURE__ */ jsxs(Select, { value: status, onValueChange: (value) => {
        setPage(1);
        setStatus(value);
      }, children: [
        /* @__PURE__ */ jsx(SelectTrigger, { children: /* @__PURE__ */ jsx(SelectValue, { placeholder: "Status" }) }),
        /* @__PURE__ */ jsx(SelectContent, { children: statuses.map((item) => /* @__PURE__ */ jsx(SelectItem, { value: item, children: item === "all" ? "All status" : item }, item)) })
      ] }),
      /* @__PURE__ */ jsxs(Select, { value: String(limit), onValueChange: (value) => {
        setPage(1);
        setLimit(Number(value));
      }, children: [
        /* @__PURE__ */ jsx(SelectTrigger, { children: /* @__PURE__ */ jsx(SelectValue, { placeholder: "Limit" }) }),
        /* @__PURE__ */ jsx(SelectContent, { children: limits.map((item) => /* @__PURE__ */ jsxs(SelectItem, { value: String(item), children: [
          item,
          " rows"
        ] }, item)) })
      ] }),
      /* @__PURE__ */ jsx(Button, { variant: "outline", onClick: resetFilters, disabled: list.isFetching, children: "Reset" })
    ] }) }),
    /* @__PURE__ */ jsx("div", { className: "overflow-hidden rounded-xl border border-border bg-card/70", children: /* @__PURE__ */ jsxs(Table, { children: [
      /* @__PURE__ */ jsx(TableHeader, { children: /* @__PURE__ */ jsxs(TableRow, { children: [
        /* @__PURE__ */ jsx(TableHead, { children: "Time" }),
        /* @__PURE__ */ jsx(TableHead, { children: "Action" }),
        /* @__PURE__ */ jsx(TableHead, { children: "Device" }),
        /* @__PURE__ */ jsx(TableHead, { children: "Status" }),
        /* @__PURE__ */ jsx(TableHead, { className: "w-28 text-right", children: "Detail" })
      ] }) }),
      /* @__PURE__ */ jsxs(TableBody, { children: [
        list.isLoading && /* @__PURE__ */ jsx(TableRow, { children: /* @__PURE__ */ jsx(TableCell, { colSpan: 5, className: "py-8 text-center text-muted-foreground", children: "Loading..." }) }),
        !list.isLoading && items.length === 0 && /* @__PURE__ */ jsx(TableRow, { children: /* @__PURE__ */ jsx(TableCell, { colSpan: 5, className: "py-8 text-center text-muted-foreground", children: "No logs." }) }),
        items.map((l, i) => /* @__PURE__ */ jsxs(TableRow, { children: [
          /* @__PURE__ */ jsx(TableCell, { className: "font-mono text-xs text-muted-foreground", children: l.timestamp ?? l.created_at ? new Date(l.timestamp ?? l.created_at).toLocaleString() : "—" }),
          /* @__PURE__ */ jsx(TableCell, { className: "font-mono text-xs", children: l.action ?? "—" }),
          /* @__PURE__ */ jsx(TableCell, { className: "font-mono text-xs", children: l.device_name ?? l.device_id ?? "—" }),
          /* @__PURE__ */ jsx(TableCell, { children: /* @__PURE__ */ jsx("span", { className: `font-mono text-xs ${l.status === "critical" ? "text-destructive" : l.status === "warning" ? "text-warning" : l.status === "ok" || l.status === "healthy" || l.status === "up" ? "text-primary" : "text-muted-foreground"}`, children: l.status ?? "—" }) }),
          /* @__PURE__ */ jsx(TableCell, { className: "text-right", children: /* @__PURE__ */ jsx(Button, { size: "sm", variant: "secondary", onClick: () => setSelected(l), children: "View JSON" }) })
        ] }, l.id ?? i))
      ] })
    ] }) }),
    /* @__PURE__ */ jsxs("div", { className: "mt-4 flex flex-col gap-3 rounded-xl border border-border bg-card/70 px-4 py-3 sm:flex-row sm:items-center sm:justify-between", children: [
      /* @__PURE__ */ jsxs("div", { className: "font-mono text-xs text-muted-foreground", children: [
        "Showing ",
        items.length,
        " of ",
        total.toLocaleString(),
        " logs · page ",
        page,
        " / ",
        pages,
        list.isFetching ? " · refreshing" : ""
      ] }),
      /* @__PURE__ */ jsxs("div", { className: "flex gap-2", children: [
        /* @__PURE__ */ jsxs(Button, { variant: "secondary", size: "sm", disabled: !canPrev, onClick: () => setPage(page - 1), children: [
          /* @__PURE__ */ jsx(ChevronLeft, { className: "mr-1 h-4 w-4" }),
          "Prev"
        ] }),
        /* @__PURE__ */ jsxs(Button, { variant: "secondary", size: "sm", disabled: !canNext, onClick: () => setPage(page + 1), children: [
          "Next",
          /* @__PURE__ */ jsx(ChevronRight, { className: "ml-1 h-4 w-4" })
        ] })
      ] })
    ] }),
    /* @__PURE__ */ jsx(Dialog, { open: !!selected, onOpenChange: (open) => !open && setSelected(null), children: /* @__PURE__ */ jsxs(DialogContent, { className: "max-w-3xl", children: [
      /* @__PURE__ */ jsx(DialogHeader, { children: /* @__PURE__ */ jsx(DialogTitle, { children: "Log detail" }) }),
      /* @__PURE__ */ jsx("pre", { className: "max-h-[70vh] overflow-auto rounded-md bg-muted/40 p-3 font-mono text-xs", children: selected ? formatLogDetail(selected) : "" })
    ] }) })
  ] });
}
function logsURL({
  page,
  limit,
  query,
  action,
  status
}) {
  const params = new URLSearchParams({
    page: String(page),
    limit: String(limit)
  });
  if (query) params.set("q", query);
  if (action !== "all") params.set("action", action);
  if (status !== "all") params.set("status", status);
  return `/api/network/logs?${params.toString()}`;
}
function logMeta(response) {
  if (typeof response !== "object" || response === null || !("meta" in response)) return {};
  const meta = response.meta;
  if (typeof meta !== "object" || meta === null) return {};
  return meta;
}
function formatLogDetail(log) {
  const result = parseMaybeJSON(log.result);
  return JSON.stringify({
    ...log,
    result
  }, null, 2);
}
function parseMaybeJSON(value) {
  if (typeof value !== "string") return value ?? null;
  try {
    return JSON.parse(value);
  } catch {
    return value;
  }
}
export {
  Logs as component
};
