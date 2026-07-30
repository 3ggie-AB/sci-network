import { jsxs, Fragment, jsx } from "react/jsx-runtime";
import { useQueryClient, useQuery, useMutation } from "@tanstack/react-query";
import { PencilLine, Check, CheckCircle2, Trash2 } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";
import { P as PageHeader } from "./DashboardLayout-BIsZ7GUS.js";
import { A as AlertDialog, a as AlertDialogTrigger, b as AlertDialogContent, c as AlertDialogHeader, d as AlertDialogTitle, e as AlertDialogDescription, f as AlertDialogFooter, g as AlertDialogCancel, h as AlertDialogAction } from "./alert-dialog-DpCH8EKh.js";
import { B as Button } from "./button-BXrfXN_b.js";
import { T as Table, b as TableHeader, c as TableRow, d as TableHead, e as TableBody, f as TableCell, D as Dialog, g as DialogContent, h as DialogHeader, i as DialogTitle, j as DialogFooter } from "./table-CFZJqILE.js";
import { T as Textarea } from "./textarea-BBisE2jS.js";
import { a as api, c as asArray } from "./router-D-aI0tZc.js";
import "@tanstack/react-router";
import "./push-notifications-kiOw6TiQ.js";
import "@radix-ui/react-alert-dialog";
import "@radix-ui/react-slot";
import "class-variance-authority";
import "clsx";
import "tailwind-merge";
import "@radix-ui/react-dialog";
function Alerts() {
  const qc = useQueryClient();
  const [noteTarget, setNoteTarget] = useState(null);
  const [noteText, setNoteText] = useState("");
  const list = useQuery({
    queryKey: ["alerts"],
    queryFn: () => api("/api/alerts?limit=100"),
    refetchInterval: 15e3
  });
  const ack = useMutation({
    mutationFn: (id) => api(`/api/alerts/${id}/ack`, {
      method: "POST"
    }),
    onSuccess: () => {
      toast.success("Alert acknowledged");
      qc.invalidateQueries({
        queryKey: ["alerts"]
      });
    }
  });
  const resolve = useMutation({
    mutationFn: (id) => api(`/api/alerts/${id}/resolve`, {
      method: "POST"
    }),
    onSuccess: () => {
      toast.success("Alert resolved");
      qc.invalidateQueries({
        queryKey: ["alerts"]
      });
    }
  });
  const saveNotes = useMutation({
    mutationFn: ({
      id,
      notes
    }) => api(`/api/alerts/${id}/notes`, {
      method: "PUT",
      json: {
        notes
      }
    }),
    onSuccess: () => {
      toast.success("Catatan alert disimpan");
      setNoteTarget(null);
      setNoteText("");
      qc.invalidateQueries({
        queryKey: ["alerts"]
      });
    },
    onError: (e) => toast.error(e instanceof Error ? e.message : "Gagal simpan catatan")
  });
  const deleteAlert = useMutation({
    mutationFn: (id) => api(`/api/alerts/${id}`, {
      method: "DELETE"
    }),
    onSuccess: () => {
      toast.success("Alert dihapus");
      qc.invalidateQueries({
        queryKey: ["alerts"]
      });
    },
    onError: (e) => toast.error(e instanceof Error ? e.message : "Gagal hapus alert")
  });
  const items = asArray(list.data);
  return /* @__PURE__ */ jsxs(Fragment, { children: [
    /* @__PURE__ */ jsx(PageHeader, { title: "Alerts", description: "Alert otomatis dari scheduler & threshold." }),
    /* @__PURE__ */ jsx("div", { className: "overflow-hidden rounded-xl border border-border bg-card/70", children: /* @__PURE__ */ jsxs(Table, { children: [
      /* @__PURE__ */ jsx(TableHeader, { children: /* @__PURE__ */ jsxs(TableRow, { children: [
        /* @__PURE__ */ jsx(TableHead, { children: "Title" }),
        /* @__PURE__ */ jsx(TableHead, { children: "Device" }),
        /* @__PURE__ */ jsx(TableHead, { children: "Severity" }),
        /* @__PURE__ */ jsx(TableHead, { children: "Status" }),
        /* @__PURE__ */ jsx(TableHead, { children: "Created" }),
        /* @__PURE__ */ jsx(TableHead, { className: "w-48" })
      ] }) }),
      /* @__PURE__ */ jsxs(TableBody, { children: [
        list.isLoading && /* @__PURE__ */ jsx(TableRow, { children: /* @__PURE__ */ jsx(TableCell, { colSpan: 6, className: "py-8 text-center text-muted-foreground", children: "Loading..." }) }),
        !list.isLoading && items.length === 0 && /* @__PURE__ */ jsx(TableRow, { children: /* @__PURE__ */ jsx(TableCell, { colSpan: 6, className: "py-8 text-center text-muted-foreground", children: "No alerts." }) }),
        items.map((a, i) => /* @__PURE__ */ jsxs(TableRow, { children: [
          /* @__PURE__ */ jsxs(TableCell, { className: "max-w-[360px]", children: [
            /* @__PURE__ */ jsx("div", { className: "truncate font-medium", children: a.title ?? a.message ?? "Alert" }),
            a.notes ? /* @__PURE__ */ jsx("div", { className: "mt-1 line-clamp-2 text-xs text-muted-foreground", children: a.notes }) : null
          ] }),
          /* @__PURE__ */ jsx(TableCell, { className: "font-mono text-xs", children: a.device_name ?? "—" }),
          /* @__PURE__ */ jsx(TableCell, { children: /* @__PURE__ */ jsx("span", { className: `font-mono text-xs ${a.severity === "critical" ? "text-destructive" : a.severity === "warning" ? "text-warning" : "text-muted-foreground"}`, children: a.severity ?? "—" }) }),
          /* @__PURE__ */ jsx(TableCell, { children: /* @__PURE__ */ jsx("span", { className: "font-mono text-xs", children: a.status ?? "—" }) }),
          /* @__PURE__ */ jsx(TableCell, { className: "font-mono text-xs text-muted-foreground", children: a.created_at ? new Date(a.created_at).toLocaleString() : "—" }),
          /* @__PURE__ */ jsx(TableCell, { className: "text-right", children: /* @__PURE__ */ jsxs("div", { className: "flex flex-wrap justify-end gap-2", children: [
            /* @__PURE__ */ jsxs(Button, { size: "sm", variant: "outline", disabled: !a.id, onClick: () => {
              setNoteTarget(a);
              setNoteText(a.notes ?? "");
            }, children: [
              /* @__PURE__ */ jsx(PencilLine, { className: "mr-1 h-3.5 w-3.5" }),
              " Note"
            ] }),
            /* @__PURE__ */ jsxs(Button, { size: "sm", variant: "secondary", disabled: !a.id, onClick: () => a.id && ack.mutate(a.id), children: [
              /* @__PURE__ */ jsx(Check, { className: "mr-1 h-3.5 w-3.5" }),
              " Ack"
            ] }),
            /* @__PURE__ */ jsxs(Button, { size: "sm", disabled: !a.id, onClick: () => a.id && resolve.mutate(a.id), children: [
              /* @__PURE__ */ jsx(CheckCircle2, { className: "mr-1 h-3.5 w-3.5" }),
              " Resolve"
            ] }),
            /* @__PURE__ */ jsxs(AlertDialog, { children: [
              /* @__PURE__ */ jsx(AlertDialogTrigger, { asChild: true, children: /* @__PURE__ */ jsxs(Button, { size: "sm", variant: "destructive", disabled: !a.id, children: [
                /* @__PURE__ */ jsx(Trash2, { className: "mr-1 h-3.5 w-3.5" }),
                " Delete"
              ] }) }),
              /* @__PURE__ */ jsxs(AlertDialogContent, { children: [
                /* @__PURE__ */ jsxs(AlertDialogHeader, { children: [
                  /* @__PURE__ */ jsx(AlertDialogTitle, { children: "Hapus alert?" }),
                  /* @__PURE__ */ jsx(AlertDialogDescription, { children: "Alert ini akan dihapus dari daftar. Jika masalahnya masih aktif, scheduler bisa membuat alert baru lagi." })
                ] }),
                /* @__PURE__ */ jsxs(AlertDialogFooter, { children: [
                  /* @__PURE__ */ jsx(AlertDialogCancel, { children: "Cancel" }),
                  /* @__PURE__ */ jsx(AlertDialogAction, { onClick: () => a.id && deleteAlert.mutate(a.id), children: "Delete" })
                ] })
              ] })
            ] })
          ] }) })
        ] }, a.id ?? i))
      ] })
    ] }) }),
    /* @__PURE__ */ jsx(Dialog, { open: !!noteTarget, onOpenChange: (open) => !open && setNoteTarget(null), children: /* @__PURE__ */ jsxs(DialogContent, { children: [
      /* @__PURE__ */ jsx(DialogHeader, { children: /* @__PURE__ */ jsx(DialogTitle, { children: "Alert note" }) }),
      /* @__PURE__ */ jsx(Textarea, { value: noteText, onChange: (e) => setNoteText(e.target.value), placeholder: "Catatan investigasi, tindakan, atau follow-up...", className: "min-h-32" }),
      /* @__PURE__ */ jsxs(DialogFooter, { children: [
        /* @__PURE__ */ jsx(Button, { variant: "secondary", onClick: () => setNoteTarget(null), children: "Cancel" }),
        /* @__PURE__ */ jsx(Button, { disabled: !noteTarget?.id || saveNotes.isPending, onClick: () => noteTarget?.id && saveNotes.mutate({
          id: noteTarget.id,
          notes: noteText
        }), children: "Save note" })
      ] })
    ] }) })
  ] });
}
export {
  Alerts as component
};
