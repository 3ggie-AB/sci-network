import { jsxs, Fragment, jsx } from "react/jsx-runtime";
import { useQueryClient, useQuery, useMutation } from "@tanstack/react-query";
import { useState } from "react";
import { Plus, Loader2 } from "lucide-react";
import { toast } from "sonner";
import { P as PageHeader } from "./DashboardLayout-RYDn1jmq.js";
import { B as Button } from "./button-BXrfXN_b.js";
import { I as Input } from "./input-DwaGuH4D.js";
import { L as Label } from "./label-Brw405F4.js";
import { T as Textarea } from "./textarea-BBisE2jS.js";
import { D as Dialog, a as DialogTrigger, T as Table, b as TableHeader, c as TableRow, d as TableHead, e as TableBody, f as TableCell, g as DialogContent, h as DialogHeader, i as DialogTitle, j as DialogFooter } from "./table-CFZJqILE.js";
import { a as api, c as asArray } from "./router-BHOai5Fo.js";
import "@tanstack/react-router";
import "./push-notifications-CahqIseY.js";
import "@radix-ui/react-slot";
import "class-variance-authority";
import "clsx";
import "tailwind-merge";
import "@radix-ui/react-label";
import "@radix-ui/react-dialog";
function Feedbacks() {
  const qc = useQueryClient();
  const [open, setOpen] = useState(false);
  const list = useQuery({
    queryKey: ["feedbacks"],
    queryFn: () => api("/api/feedbacks?page=1&limit=50")
  });
  const items = asArray(list.data);
  return /* @__PURE__ */ jsxs(Fragment, { children: [
    /* @__PURE__ */ jsx(PageHeader, { title: "Feedbacks", description: "Keluhan & laporan dari user.", actions: /* @__PURE__ */ jsxs(Dialog, { open, onOpenChange: setOpen, children: [
      /* @__PURE__ */ jsx(DialogTrigger, { asChild: true, children: /* @__PURE__ */ jsxs(Button, { children: [
        /* @__PURE__ */ jsx(Plus, { className: "mr-2 h-4 w-4" }),
        " New feedback"
      ] }) }),
      /* @__PURE__ */ jsx(NewFeedbackDialog, { onDone: () => {
        setOpen(false);
        qc.invalidateQueries({
          queryKey: ["feedbacks"]
        });
      } })
    ] }) }),
    /* @__PURE__ */ jsx("div", { className: "overflow-hidden rounded-xl border border-border bg-card/70", children: /* @__PURE__ */ jsxs(Table, { children: [
      /* @__PURE__ */ jsx(TableHeader, { children: /* @__PURE__ */ jsxs(TableRow, { children: [
        /* @__PURE__ */ jsx(TableHead, { children: "Title" }),
        /* @__PURE__ */ jsx(TableHead, { children: "Category" }),
        /* @__PURE__ */ jsx(TableHead, { children: "Priority" }),
        /* @__PURE__ */ jsx(TableHead, { children: "Status" }),
        /* @__PURE__ */ jsx(TableHead, { children: "Created" })
      ] }) }),
      /* @__PURE__ */ jsxs(TableBody, { children: [
        list.isLoading && /* @__PURE__ */ jsx(TableRow, { children: /* @__PURE__ */ jsx(TableCell, { colSpan: 5, className: "py-8 text-center text-muted-foreground", children: "Loading..." }) }),
        !list.isLoading && items.length === 0 && /* @__PURE__ */ jsx(TableRow, { children: /* @__PURE__ */ jsx(TableCell, { colSpan: 5, className: "py-8 text-center text-muted-foreground", children: "No feedbacks." }) }),
        items.map((f, i) => /* @__PURE__ */ jsxs(TableRow, { children: [
          /* @__PURE__ */ jsx(TableCell, { className: "font-medium", children: f.title ?? "—" }),
          /* @__PURE__ */ jsx(TableCell, { className: "font-mono text-xs", children: f.category ?? "—" }),
          /* @__PURE__ */ jsx(TableCell, { children: /* @__PURE__ */ jsx("span", { className: `font-mono text-xs ${f.priority === 3 ? "text-destructive" : f.priority === 2 ? "text-warning" : "text-muted-foreground"}`, children: f.priority === 3 ? "high" : f.priority === 2 ? "medium" : "low" }) }),
          /* @__PURE__ */ jsx(TableCell, { children: /* @__PURE__ */ jsx("span", { className: "font-mono text-xs", children: f.status ?? "open" }) }),
          /* @__PURE__ */ jsx(TableCell, { className: "font-mono text-xs text-muted-foreground", children: f.created_at ? new Date(f.created_at).toLocaleString() : "—" })
        ] }, f.id ?? i))
      ] })
    ] }) })
  ] });
}
function NewFeedbackDialog({
  onDone
}) {
  const [form, setForm] = useState({
    title: "",
    description: "",
    category: "network",
    priority: 2
  });
  const create = useMutation({
    mutationFn: () => api("/api/feedbacks", {
      method: "POST",
      json: form
    }),
    onSuccess: () => {
      toast.success("Feedback submitted");
      onDone();
    },
    onError: (e) => toast.error(e instanceof Error ? e.message : "Failed")
  });
  return /* @__PURE__ */ jsxs(DialogContent, { children: [
    /* @__PURE__ */ jsx(DialogHeader, { children: /* @__PURE__ */ jsx(DialogTitle, { children: "New feedback" }) }),
    /* @__PURE__ */ jsxs("div", { className: "space-y-3", children: [
      /* @__PURE__ */ jsxs("div", { className: "space-y-1.5", children: [
        /* @__PURE__ */ jsx(Label, { className: "text-xs text-muted-foreground", children: "Title" }),
        /* @__PURE__ */ jsx(Input, { value: form.title, onChange: (e) => setForm({
          ...form,
          title: e.target.value
        }) })
      ] }),
      /* @__PURE__ */ jsxs("div", { className: "space-y-1.5", children: [
        /* @__PURE__ */ jsx(Label, { className: "text-xs text-muted-foreground", children: "Description" }),
        /* @__PURE__ */ jsx(Textarea, { rows: 4, value: form.description, onChange: (e) => setForm({
          ...form,
          description: e.target.value
        }) })
      ] }),
      /* @__PURE__ */ jsxs("div", { className: "grid grid-cols-2 gap-3", children: [
        /* @__PURE__ */ jsxs("div", { className: "space-y-1.5", children: [
          /* @__PURE__ */ jsx(Label, { className: "text-xs text-muted-foreground", children: "Category" }),
          /* @__PURE__ */ jsx(Input, { value: form.category, onChange: (e) => setForm({
            ...form,
            category: e.target.value
          }) })
        ] }),
        /* @__PURE__ */ jsxs("div", { className: "space-y-1.5", children: [
          /* @__PURE__ */ jsx(Label, { className: "text-xs text-muted-foreground", children: "Priority (1-3)" }),
          /* @__PURE__ */ jsx(Input, { type: "number", min: 1, max: 3, value: form.priority, onChange: (e) => setForm({
            ...form,
            priority: Number(e.target.value) || 1
          }) })
        ] })
      ] })
    ] }),
    /* @__PURE__ */ jsx(DialogFooter, { children: /* @__PURE__ */ jsxs(Button, { onClick: () => create.mutate(), disabled: create.isPending || !form.title, children: [
      create.isPending && /* @__PURE__ */ jsx(Loader2, { className: "mr-2 h-4 w-4 animate-spin" }),
      "Submit"
    ] }) })
  ] });
}
export {
  Feedbacks as component
};
