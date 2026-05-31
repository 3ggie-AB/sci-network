import { createFileRoute } from "@tanstack/react-router";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import { Loader2, Pencil, Plus, Trash2 } from "lucide-react";
import { toast } from "sonner";

import { PageHeader } from "@/components/DashboardLayout";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
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

export const Route = createFileRoute("/dashboard/users")({
  component: Users,
});

type UserRow = {
  id?: string;
  full_name?: string;
  username?: string;
  email?: string;
  role?: string;
  is_active?: boolean;
};

const roleOptions = ["admin", "atasan", "teknisi", "staff", "karyawan"];

function Users() {
  const qc = useQueryClient();
  const [createOpen, setCreateOpen] = useState(false);
  const [editing, setEditing] = useState<UserRow | null>(null);

  const list = useQuery({
    queryKey: ["users"],
    queryFn: () => api<unknown>("/api/users?page=1&limit=50"),
  });

  const del = useMutation({
    mutationFn: (id: string) => api(`/api/users/${id}`, { method: "DELETE" }),
    onSuccess: () => {
      toast.success("User disabled");
      qc.invalidateQueries({ queryKey: ["users"] });
    },
    onError: (e: unknown) => toast.error(errorMessage(e, "Failed to delete user")),
  });

  const items = asArray<UserRow>(list.data);

  return (
    <>
      <PageHeader
        title="Users"
        description="Manajemen user admin, atasan, teknisi, staff, dan karyawan."
        actions={
          <Dialog open={createOpen} onOpenChange={setCreateOpen}>
            <DialogTrigger asChild>
              <Button>
                <Plus className="mr-2 h-4 w-4" /> New user
              </Button>
            </DialogTrigger>
            <NewUserDialog onDone={() => setCreateOpen(false)} />
          </Dialog>
        }
      />

      <div className="overflow-hidden rounded-xl border border-border bg-card/70">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Full name</TableHead>
              <TableHead>Username</TableHead>
              <TableHead>Email</TableHead>
              <TableHead>Role</TableHead>
              <TableHead>Status</TableHead>
              <TableHead className="w-28 text-right" />
            </TableRow>
          </TableHeader>
          <TableBody>
            {list.isLoading && (
              <TableRow>
                <TableCell colSpan={6} className="py-8 text-center text-muted-foreground">
                  Loading...
                </TableCell>
              </TableRow>
            )}
            {!list.isLoading && items.length === 0 && (
              <TableRow>
                <TableCell colSpan={6} className="py-8 text-center text-muted-foreground">
                  No users or insufficient permissions.
                </TableCell>
              </TableRow>
            )}
            {items.map((u, i) => (
              <TableRow key={u.id ?? i}>
                <TableCell className="font-medium">{u.full_name ?? "—"}</TableCell>
                <TableCell className="font-mono text-xs">{u.username ?? "—"}</TableCell>
                <TableCell className="font-mono text-xs">{u.email ?? "—"}</TableCell>
                <TableCell>
                  <span className="font-mono text-xs text-primary">{u.role ?? "user"}</span>
                </TableCell>
                <TableCell>
                  <span
                    className={`font-mono text-xs ${
                      u.is_active === false ? "text-muted-foreground" : "text-primary"
                    }`}
                  >
                    {u.is_active === false ? "inactive" : "active"}
                  </span>
                </TableCell>
                <TableCell className="space-x-1 text-right">
                  <Button
                    size="icon"
                    variant="ghost"
                    disabled={!u.id}
                    onClick={() => setEditing(u)}
                    aria-label="Edit user"
                  >
                    <Pencil className="h-4 w-4" />
                  </Button>
                  <Button
                    size="icon"
                    variant="ghost"
                    disabled={!u.id || del.isPending}
                    onClick={() => u.id && del.mutate(u.id)}
                    aria-label="Disable user"
                  >
                    <Trash2 className="h-4 w-4 text-destructive" />
                  </Button>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>

      <Dialog open={!!editing} onOpenChange={(open) => !open && setEditing(null)}>
        {editing ? <EditUserDialog user={editing} onDone={() => setEditing(null)} /> : null}
      </Dialog>
    </>
  );
}

function NewUserDialog({ onDone }: { onDone: () => void }) {
  const qc = useQueryClient();
  const [form, setForm] = useState({
    username: "",
    email: "",
    password: "",
    role: "teknisi",
    full_name: "",
  });

  const create = useMutation({
    mutationFn: () => api("/api/users", { method: "POST", json: form }),
    onSuccess: () => {
      toast.success("User created");
      qc.invalidateQueries({ queryKey: ["users"] });
      onDone();
    },
    onError: (e: unknown) => toast.error(errorMessage(e, "Failed to create user")),
  });

  return (
    <DialogContent>
      <DialogHeader>
        <DialogTitle>New user</DialogTitle>
      </DialogHeader>

      <div className="grid grid-cols-2 gap-3">
        <FormRow label="Full name">
          <Input
            value={form.full_name}
            onChange={(e) => setForm({ ...form, full_name: e.target.value })}
          />
        </FormRow>
        <FormRow label="Username">
          <Input
            value={form.username}
            onChange={(e) => setForm({ ...form, username: e.target.value })}
          />
        </FormRow>
        <FormRow label="Email">
          <Input
            type="email"
            value={form.email}
            onChange={(e) => setForm({ ...form, email: e.target.value })}
          />
        </FormRow>
        <FormRow label="Password">
          <Input
            type="password"
            value={form.password}
            onChange={(e) => setForm({ ...form, password: e.target.value })}
          />
        </FormRow>
        <FormRow label="Role">
          <RoleSelect value={form.role} onChange={(role) => setForm({ ...form, role })} />
        </FormRow>
      </div>

      <DialogFooter>
        <Button
          disabled={create.isPending || !form.username || !form.email || !form.password}
          onClick={() => create.mutate()}
        >
          {create.isPending ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
          Create
        </Button>
      </DialogFooter>
    </DialogContent>
  );
}

function EditUserDialog({ user, onDone }: { user: UserRow; onDone: () => void }) {
  const qc = useQueryClient();
  const [form, setForm] = useState({
    email: user.email ?? "",
    full_name: user.full_name ?? "",
    role: user.role ?? "karyawan",
    is_active: user.is_active !== false,
  });

  const update = useMutation({
    mutationFn: () =>
      api(`/api/users/${user.id}`, {
        method: "PUT",
        json: {
          email: form.email,
          full_name: form.full_name,
          role: form.role,
          is_active: form.is_active,
        },
      }),
    onSuccess: () => {
      toast.success("User updated");
      qc.invalidateQueries({ queryKey: ["users"] });
      onDone();
    },
    onError: (e: unknown) => toast.error(errorMessage(e, "Failed to update user")),
  });

  return (
    <DialogContent>
      <DialogHeader>
        <DialogTitle>Edit user</DialogTitle>
      </DialogHeader>

      <div className="grid grid-cols-2 gap-3">
        <FormRow label="Full name">
          <Input
            value={form.full_name}
            onChange={(e) => setForm({ ...form, full_name: e.target.value })}
          />
        </FormRow>
        <FormRow label="Email">
          <Input
            type="email"
            value={form.email}
            onChange={(e) => setForm({ ...form, email: e.target.value })}
          />
        </FormRow>
        <FormRow label="Role">
          <RoleSelect value={form.role} onChange={(role) => setForm({ ...form, role })} />
        </FormRow>
        <div className="flex items-end justify-between rounded-md border border-border px-3 py-2">
          <Label className="text-xs text-muted-foreground">Active</Label>
          <Switch
            checked={form.is_active}
            onCheckedChange={(is_active) => setForm({ ...form, is_active })}
          />
        </div>
      </div>

      <DialogFooter>
        <Button
          disabled={update.isPending || !user.id || !form.email}
          onClick={() => update.mutate()}
        >
          {update.isPending ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
          Save
        </Button>
      </DialogFooter>
    </DialogContent>
  );
}

function RoleSelect({ value, onChange }: { value: string; onChange: (role: string) => void }) {
  return (
    <Select value={value} onValueChange={onChange}>
      <SelectTrigger>
        <SelectValue placeholder="Role" />
      </SelectTrigger>
      <SelectContent>
        {roleOptions.map((role) => (
          <SelectItem key={role} value={role}>
            {role}
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  );
}

function FormRow({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="space-y-1.5">
      <Label className="text-xs text-muted-foreground">{label}</Label>
      {children}
    </div>
  );
}

function errorMessage(error: unknown, fallback: string) {
  return error instanceof Error ? error.message : fallback;
}
