import { jsxs, Fragment, jsx } from "react/jsx-runtime";
import { useQueryClient, useQuery, useMutation } from "@tanstack/react-query";
import { useState } from "react";
import { Plus, Pencil, Trash2, Loader2 } from "lucide-react";
import { toast } from "sonner";
import { P as PageHeader } from "./DashboardLayout-BIsZ7GUS.js";
import { B as Button } from "./button-BXrfXN_b.js";
import { D as Dialog, a as DialogTrigger, T as Table, b as TableHeader, c as TableRow, d as TableHead, e as TableBody, f as TableCell, g as DialogContent, h as DialogHeader, i as DialogTitle, j as DialogFooter } from "./table-CFZJqILE.js";
import { I as Input } from "./input-DwaGuH4D.js";
import { L as Label } from "./label-Brw405F4.js";
import { S as Select, a as SelectTrigger, b as SelectValue, c as SelectContent, d as SelectItem } from "./select-Dn_c42EA.js";
import { S as Switch } from "./switch-DDHih_sy.js";
import { a as api, c as asArray } from "./router-D-aI0tZc.js";
import "@tanstack/react-router";
import "./push-notifications-kiOw6TiQ.js";
import "@radix-ui/react-slot";
import "class-variance-authority";
import "clsx";
import "tailwind-merge";
import "@radix-ui/react-dialog";
import "@radix-ui/react-label";
import "@radix-ui/react-select";
import "@radix-ui/react-switch";
const roleOptions = ["admin", "atasan", "teknisi", "staff", "karyawan"];
function Users() {
  const qc = useQueryClient();
  const [createOpen, setCreateOpen] = useState(false);
  const [editing, setEditing] = useState(null);
  const list = useQuery({
    queryKey: ["users"],
    queryFn: () => api("/api/users?page=1&limit=50")
  });
  const del = useMutation({
    mutationFn: (id) => api(`/api/users/${id}`, {
      method: "DELETE"
    }),
    onSuccess: () => {
      toast.success("User disabled");
      qc.invalidateQueries({
        queryKey: ["users"]
      });
    },
    onError: (e) => toast.error(errorMessage(e, "Failed to delete user"))
  });
  const items = asArray(list.data);
  return /* @__PURE__ */ jsxs(Fragment, { children: [
    /* @__PURE__ */ jsx(PageHeader, { title: "Users", description: "Manajemen user admin, atasan, teknisi, staff, dan karyawan.", actions: /* @__PURE__ */ jsxs(Dialog, { open: createOpen, onOpenChange: setCreateOpen, children: [
      /* @__PURE__ */ jsx(DialogTrigger, { asChild: true, children: /* @__PURE__ */ jsxs(Button, { children: [
        /* @__PURE__ */ jsx(Plus, { className: "mr-2 h-4 w-4" }),
        " New user"
      ] }) }),
      /* @__PURE__ */ jsx(NewUserDialog, { onDone: () => setCreateOpen(false) })
    ] }) }),
    /* @__PURE__ */ jsx("div", { className: "overflow-hidden rounded-xl border border-border bg-card/70", children: /* @__PURE__ */ jsxs(Table, { children: [
      /* @__PURE__ */ jsx(TableHeader, { children: /* @__PURE__ */ jsxs(TableRow, { children: [
        /* @__PURE__ */ jsx(TableHead, { children: "Full name" }),
        /* @__PURE__ */ jsx(TableHead, { children: "Username" }),
        /* @__PURE__ */ jsx(TableHead, { children: "Email" }),
        /* @__PURE__ */ jsx(TableHead, { children: "Role" }),
        /* @__PURE__ */ jsx(TableHead, { children: "Status" }),
        /* @__PURE__ */ jsx(TableHead, { className: "w-28 text-right" })
      ] }) }),
      /* @__PURE__ */ jsxs(TableBody, { children: [
        list.isLoading && /* @__PURE__ */ jsx(TableRow, { children: /* @__PURE__ */ jsx(TableCell, { colSpan: 6, className: "py-8 text-center text-muted-foreground", children: "Loading..." }) }),
        !list.isLoading && items.length === 0 && /* @__PURE__ */ jsx(TableRow, { children: /* @__PURE__ */ jsx(TableCell, { colSpan: 6, className: "py-8 text-center text-muted-foreground", children: "No users or insufficient permissions." }) }),
        items.map((u, i) => /* @__PURE__ */ jsxs(TableRow, { children: [
          /* @__PURE__ */ jsx(TableCell, { className: "font-medium", children: u.full_name ?? "—" }),
          /* @__PURE__ */ jsx(TableCell, { className: "font-mono text-xs", children: u.username ?? "—" }),
          /* @__PURE__ */ jsx(TableCell, { className: "font-mono text-xs", children: u.email ?? "—" }),
          /* @__PURE__ */ jsx(TableCell, { children: /* @__PURE__ */ jsx("span", { className: "font-mono text-xs text-primary", children: u.role ?? "user" }) }),
          /* @__PURE__ */ jsx(TableCell, { children: /* @__PURE__ */ jsx("span", { className: `font-mono text-xs ${u.is_active === false ? "text-muted-foreground" : "text-primary"}`, children: u.is_active === false ? "inactive" : "active" }) }),
          /* @__PURE__ */ jsxs(TableCell, { className: "space-x-1 text-right", children: [
            /* @__PURE__ */ jsx(Button, { size: "icon", variant: "ghost", disabled: !u.id, onClick: () => setEditing(u), "aria-label": "Edit user", children: /* @__PURE__ */ jsx(Pencil, { className: "h-4 w-4" }) }),
            /* @__PURE__ */ jsx(Button, { size: "icon", variant: "ghost", disabled: !u.id || del.isPending, onClick: () => u.id && del.mutate(u.id), "aria-label": "Disable user", children: /* @__PURE__ */ jsx(Trash2, { className: "h-4 w-4 text-destructive" }) })
          ] })
        ] }, u.id ?? i))
      ] })
    ] }) }),
    /* @__PURE__ */ jsx(Dialog, { open: !!editing, onOpenChange: (open) => !open && setEditing(null), children: editing ? /* @__PURE__ */ jsx(EditUserDialog, { user: editing, onDone: () => setEditing(null) }) : null })
  ] });
}
function NewUserDialog({
  onDone
}) {
  const qc = useQueryClient();
  const [form, setForm] = useState({
    username: "",
    email: "",
    password: "",
    role: "teknisi",
    full_name: ""
  });
  const create = useMutation({
    mutationFn: () => api("/api/users", {
      method: "POST",
      json: form
    }),
    onSuccess: () => {
      toast.success("User created");
      qc.invalidateQueries({
        queryKey: ["users"]
      });
      onDone();
    },
    onError: (e) => toast.error(errorMessage(e, "Failed to create user"))
  });
  return /* @__PURE__ */ jsxs(DialogContent, { children: [
    /* @__PURE__ */ jsx(DialogHeader, { children: /* @__PURE__ */ jsx(DialogTitle, { children: "New user" }) }),
    /* @__PURE__ */ jsxs("div", { className: "grid grid-cols-2 gap-3", children: [
      /* @__PURE__ */ jsx(FormRow, { label: "Full name", children: /* @__PURE__ */ jsx(Input, { value: form.full_name, onChange: (e) => setForm({
        ...form,
        full_name: e.target.value
      }) }) }),
      /* @__PURE__ */ jsx(FormRow, { label: "Username", children: /* @__PURE__ */ jsx(Input, { value: form.username, onChange: (e) => setForm({
        ...form,
        username: e.target.value
      }) }) }),
      /* @__PURE__ */ jsx(FormRow, { label: "Email", children: /* @__PURE__ */ jsx(Input, { type: "email", value: form.email, onChange: (e) => setForm({
        ...form,
        email: e.target.value
      }) }) }),
      /* @__PURE__ */ jsx(FormRow, { label: "Password", children: /* @__PURE__ */ jsx(Input, { type: "password", value: form.password, onChange: (e) => setForm({
        ...form,
        password: e.target.value
      }) }) }),
      /* @__PURE__ */ jsx(FormRow, { label: "Role", children: /* @__PURE__ */ jsx(RoleSelect, { value: form.role, onChange: (role) => setForm({
        ...form,
        role
      }) }) })
    ] }),
    /* @__PURE__ */ jsx(DialogFooter, { children: /* @__PURE__ */ jsxs(Button, { disabled: create.isPending || !form.username || !form.email || !form.password, onClick: () => create.mutate(), children: [
      create.isPending ? /* @__PURE__ */ jsx(Loader2, { className: "mr-2 h-4 w-4 animate-spin" }) : null,
      "Create"
    ] }) })
  ] });
}
function EditUserDialog({
  user,
  onDone
}) {
  const qc = useQueryClient();
  const [form, setForm] = useState({
    email: user.email ?? "",
    full_name: user.full_name ?? "",
    role: user.role ?? "karyawan",
    is_active: user.is_active !== false
  });
  const update = useMutation({
    mutationFn: () => api(`/api/users/${user.id}`, {
      method: "PUT",
      json: {
        email: form.email,
        full_name: form.full_name,
        role: form.role,
        is_active: form.is_active
      }
    }),
    onSuccess: () => {
      toast.success("User updated");
      qc.invalidateQueries({
        queryKey: ["users"]
      });
      onDone();
    },
    onError: (e) => toast.error(errorMessage(e, "Failed to update user"))
  });
  return /* @__PURE__ */ jsxs(DialogContent, { children: [
    /* @__PURE__ */ jsx(DialogHeader, { children: /* @__PURE__ */ jsx(DialogTitle, { children: "Edit user" }) }),
    /* @__PURE__ */ jsxs("div", { className: "grid grid-cols-2 gap-3", children: [
      /* @__PURE__ */ jsx(FormRow, { label: "Full name", children: /* @__PURE__ */ jsx(Input, { value: form.full_name, onChange: (e) => setForm({
        ...form,
        full_name: e.target.value
      }) }) }),
      /* @__PURE__ */ jsx(FormRow, { label: "Email", children: /* @__PURE__ */ jsx(Input, { type: "email", value: form.email, onChange: (e) => setForm({
        ...form,
        email: e.target.value
      }) }) }),
      /* @__PURE__ */ jsx(FormRow, { label: "Role", children: /* @__PURE__ */ jsx(RoleSelect, { value: form.role, onChange: (role) => setForm({
        ...form,
        role
      }) }) }),
      /* @__PURE__ */ jsxs("div", { className: "flex items-end justify-between rounded-md border border-border px-3 py-2", children: [
        /* @__PURE__ */ jsx(Label, { className: "text-xs text-muted-foreground", children: "Active" }),
        /* @__PURE__ */ jsx(Switch, { checked: form.is_active, onCheckedChange: (is_active) => setForm({
          ...form,
          is_active
        }) })
      ] })
    ] }),
    /* @__PURE__ */ jsx(DialogFooter, { children: /* @__PURE__ */ jsxs(Button, { disabled: update.isPending || !user.id || !form.email, onClick: () => update.mutate(), children: [
      update.isPending ? /* @__PURE__ */ jsx(Loader2, { className: "mr-2 h-4 w-4 animate-spin" }) : null,
      "Save"
    ] }) })
  ] });
}
function RoleSelect({
  value,
  onChange
}) {
  return /* @__PURE__ */ jsxs(Select, { value, onValueChange: onChange, children: [
    /* @__PURE__ */ jsx(SelectTrigger, { children: /* @__PURE__ */ jsx(SelectValue, { placeholder: "Role" }) }),
    /* @__PURE__ */ jsx(SelectContent, { children: roleOptions.map((role) => /* @__PURE__ */ jsx(SelectItem, { value: role, children: role }, role)) })
  ] });
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
function errorMessage(error, fallback) {
  return error instanceof Error ? error.message : fallback;
}
export {
  Users as component
};
