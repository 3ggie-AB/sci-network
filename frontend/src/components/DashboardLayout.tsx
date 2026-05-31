import { Link, useLocation, useNavigate } from "@tanstack/react-router";
import {
  LayoutDashboard,
  Server,
  Bell,
  MessageSquareWarning,
  Users,
  Wrench,
  ScrollText,
  LogOut,
} from "lucide-react";
import type { ReactNode } from "react";

import { useAuth } from "@/lib/auth";
import { Button } from "@/components/ui/button";

const items: Array<{ to: string; label: string; icon: typeof LayoutDashboard; exact?: boolean }> = [
  { to: "/dashboard", label: "Overview", icon: LayoutDashboard, exact: true },
  { to: "/dashboard/devices", label: "Devices", icon: Server },
  { to: "/dashboard/alerts", label: "Alerts", icon: Bell },
  { to: "/dashboard/feedbacks", label: "Feedbacks", icon: MessageSquareWarning },
  { to: "/dashboard/network", label: "Network Tools", icon: Wrench },
  { to: "/dashboard/logs", label: "Logs", icon: ScrollText },
  { to: "/dashboard/users", label: "Users", icon: Users },
];


export function DashboardLayout({ children }: { children: ReactNode }) {
  const { user, logout } = useAuth();
  const loc = useLocation();
  const nav = useNavigate();

  function onLogout() {
    logout();
    nav({ to: "/" });
  }

  return (
    <div className="flex min-h-screen bg-background text-foreground">
      <aside className="hidden w-64 shrink-0 border-r border-sidebar-border bg-sidebar md:flex md:flex-col">
        <div className="flex items-center gap-3 px-5 py-5">
          <Logo />
          <div className="leading-tight">
            <div className="text-sm font-semibold">NetMonitor</div>
            <div className="font-mono text-[10px] text-muted-foreground">v4.0 · fiber+gorm</div>
          </div>
        </div>

        <nav className="flex-1 space-y-1 px-3">
          {items.map((it) => {
            const active = it.exact
              ? loc.pathname === it.to
              : loc.pathname === it.to || loc.pathname.startsWith(it.to + "/");
            const Icon = it.icon;
            return (
              <Link
                key={it.to}
                to={it.to}
                className={`flex items-center gap-3 rounded-lg px-3 py-2 text-sm transition-colors ${
                  active
                    ? "bg-primary/15 text-primary"
                    : "text-sidebar-foreground/80 hover:bg-sidebar-accent hover:text-sidebar-foreground"
                }`}
              >
                <Icon className="h-4 w-4" />
                {it.label}
              </Link>
            );
          })}
        </nav>

        <div className="border-t border-sidebar-border p-4">
          <div className="mb-3">
            <div className="truncate text-sm font-medium">{user?.full_name ?? user?.username ?? "Guest"}</div>
            <div className="font-mono text-[10px] text-muted-foreground">
              {user?.role ?? "anonymous"}
            </div>
          </div>
          <Button onClick={onLogout} variant="secondary" size="sm" className="w-full">
            <LogOut className="mr-2 h-3.5 w-3.5" /> Logout
          </Button>
        </div>
      </aside>

      <main className="min-w-0 flex-1">
        <div className="border-b border-border/60 bg-background/60 px-6 py-4 backdrop-blur">
          <div className="font-mono text-[11px] uppercase tracking-widest text-muted-foreground">
            {loc.pathname}
          </div>
        </div>
        <div className="p-6">{children}</div>
      </main>
    </div>
  );
}

function Logo() {
  return (
    <div className="grid grid-cols-3 gap-[3px]">
      {Array.from({ length: 9 }).map((_, i) => (
        <span
          key={i}
          className="h-1.5 w-1.5 rounded-[2px]"
          style={{
            backgroundColor:
              i % 3 === 0
                ? "oklch(0.78 0.18 162)"
                : i % 2 === 0
                  ? "oklch(0.72 0.16 230)"
                  : "oklch(0.55 0.05 240)",
          }}
        />
      ))}
    </div>
  );
}

export function PageHeader({
  title,
  description,
  actions,
}: {
  title: string;
  description?: string;
  actions?: ReactNode;
}) {
  return (
    <div className="mb-6 flex flex-wrap items-end justify-between gap-3">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">{title}</h1>
        {description && <p className="mt-1 text-sm text-muted-foreground">{description}</p>}
      </div>
      {actions}
    </div>
  );
}
