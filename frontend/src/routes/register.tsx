import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useState } from "react";
import { UserPlus, Loader2 } from "lucide-react";
import { toast } from "sonner";

import { NetworkBackground } from "@/components/NetworkBackground";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useAuth } from "@/lib/auth";

export const Route = createFileRoute("/register")({
  head: () => ({
    meta: [
      { title: "Register — NetMonitor" },
      { name: "description", content: "Create a NetMonitor account." },
    ],
  }),
  component: RegisterPage,
});

function RegisterPage() {
  const { register } = useAuth();
  const nav = useNavigate();
  const [form, setForm] = useState({ username: "", email: "", full_name: "", password: "" });
  const [loading, setLoading] = useState(false);

  function set<K extends keyof typeof form>(k: K, v: string) {
    setForm((f) => ({ ...f, [k]: v }));
  }

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    try {
      await register(form);
      toast.success("Account created. Please login.");
      nav({ to: "/login" });
    } catch (err: any) {
      toast.error(err?.message ?? "Registration failed");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="relative flex min-h-screen items-center justify-center overflow-hidden bg-background px-4 py-10">
      <NetworkBackground className="opacity-50" />
      <div className="relative z-10 w-full max-w-md rounded-2xl border border-border bg-card/80 p-8 backdrop-blur">
        <Link to="/" className="font-mono text-xs text-muted-foreground hover:text-foreground">
          ← back
        </Link>
        <h1 className="mt-3 text-2xl font-bold tracking-tight">Create account</h1>
        <p className="mt-1 text-sm text-muted-foreground">Daftar untuk akses NetMonitor.</p>

        <form onSubmit={onSubmit} className="mt-6 space-y-4">
          <Field label="Full name" id="full_name" value={form.full_name} onChange={(v) => set("full_name", v)} />
          <Field label="Username" id="username" value={form.username} onChange={(v) => set("username", v)} />
          <Field label="Email" id="email" type="email" value={form.email} onChange={(v) => set("email", v)} />
          <Field
            label="Password"
            id="password"
            type="password"
            value={form.password}
            onChange={(v) => set("password", v)}
          />
          <Button type="submit" className="w-full" disabled={loading}>
            {loading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <UserPlus className="mr-2 h-4 w-4" />}
            Register
          </Button>
        </form>

        <p className="mt-6 text-center text-sm text-muted-foreground">
          Sudah punya akun?{" "}
          <Link to="/login" className="text-primary hover:underline">
            Login
          </Link>
        </p>
      </div>
    </div>
  );
}

function Field({
  label,
  id,
  value,
  onChange,
  type = "text",
}: {
  label: string;
  id: string;
  value: string;
  onChange: (v: string) => void;
  type?: string;
}) {
  return (
    <div className="space-y-2">
      <Label htmlFor={id}>{label}</Label>
      <Input id={id} type={type} value={value} onChange={(e) => onChange(e.target.value)} required />
    </div>
  );
}
