import { Link, useLocation, useNavigate } from "@tanstack/react-router";
import {
  LayoutDashboard,
  Server,
  Bell,
  BellOff,
  BellRing,
  Loader2,
  MessageSquareWarning,
  Users,
  Wrench,
  ScrollText,
  LogOut,
} from "lucide-react";
import { useEffect, useState, type ReactNode } from "react";
import { toast } from "sonner";

import { useAuth } from "@/lib/auth";
import { Button } from "@/components/ui/button";
import {
  disableBrowserPush,
  enableBrowserPush,
  getBrowserPushState,
  type BrowserPushState,
} from "@/lib/push-notifications";

const items: Array<{ to: string; label: string; icon: typeof LayoutDashboard; exact?: boolean }> = [
  { to: "/dashboard", label: "Overview", icon: LayoutDashboard, exact: true },
  { to: "/dashboard/devices", label: "Devices", icon: Server },
  { to: "/dashboard/alerts", label: "Alerts", icon: Bell },
  { to: "/dashboard/feedbacks", label: "Feedbacks", icon: MessageSquareWarning },
  { to: "/dashboard/logs", label: "Logs", icon: ScrollText },
  { to: "/dashboard/users", label: "Users", icon: Users },
  { to: "/dashboard/network", label: "Manual Tools", icon: Wrench },
];

const PENDING_PUSH_ENABLE_KEY = "scinetwork.enablePushAfterLogin";

export function DashboardLayout({ children }: { children: ReactNode }) {
  const { user, token, logout } = useAuth();
  const loc = useLocation();
  const nav = useNavigate();
  const [pushState, setPushState] = useState<BrowserPushState | null>(null);
  const [pushBusy, setPushBusy] = useState(false);
  const canReadAlerts = ["admin", "atasan", "teknisi"].includes(user?.role ?? "");

  useEffect(() => {
    let cancelled = false;
    if (!token || !canReadAlerts) {
      setPushState(null);
      return;
    }

    getBrowserPushState()
      .then((state) => {
        if (!cancelled) setPushState(state);
      })
      .catch(() => {
        if (!cancelled) {
          setPushState({ supported: false, permission: "unsupported", subscribed: false });
        }
      });

    return () => {
      cancelled = true;
    };
  }, [token, canReadAlerts]);

  useEffect(() => {
    if (
      typeof window === "undefined" ||
      !token ||
      !canReadAlerts ||
      localStorage.getItem(PENDING_PUSH_ENABLE_KEY) !== "1"
    ) {
      return;
    }

    let cancelled = false;
    localStorage.removeItem(PENDING_PUSH_ENABLE_KEY);
    setPushBusy(true);
    enableBrowserPush()
      .then((state) => {
        if (cancelled) return;
        setPushState(state);
        toast.success("Browser alerts aktif");
      })
      .catch((err) => {
        if (!cancelled) {
          toast.error(err instanceof Error ? err.message : "Gagal mengaktifkan browser alerts");
        }
      })
      .finally(() => {
        if (!cancelled) setPushBusy(false);
      });

    return () => {
      cancelled = true;
    };
  }, [token, canReadAlerts]);

  function onLogout() {
    logout();
    nav({ to: "/" });
  }

  async function onToggleBrowserPush() {
    setPushBusy(true);
    try {
      const nextState = pushState?.subscribed
        ? await disableBrowserPush()
        : await enableBrowserPush();
      setPushState(nextState);
      toast.success(nextState.subscribed ? "Browser alerts aktif" : "Browser alerts dimatikan");
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Gagal mengubah browser alerts");
    } finally {
      setPushBusy(false);
    }
  }

  return (
    <div className="flex min-h-screen bg-background text-foreground">
      <aside className="hidden w-64 shrink-0 border-r border-sidebar-border bg-sidebar md:flex md:flex-col">
        <div className="flex items-center gap-3 px-5 py-5">
          <Logo />
          <div className="leading-tight">
            <div className="text-sm font-semibold">SCINetwork</div>
            <div className="font-mono text-[10px] text-muted-foreground">v4.0 · fiber+mysql</div>
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
            <div className="truncate text-sm font-medium">
              {user?.full_name ?? user?.username ?? "Guest"}
            </div>
            <div className="font-mono text-[10px] text-muted-foreground">
              {user?.role ?? "anonymous"}
            </div>
          </div>
          {canReadAlerts && (
            <Button
              onClick={onToggleBrowserPush}
              variant="outline"
              size="sm"
              className="mb-2 w-full"
              disabled={
                pushBusy ||
                !pushState?.supported ||
                pushState.permission === "denied" ||
                pushState.permission === "unsupported"
              }
            >
              {pushBusy ? (
                <Loader2 className="mr-2 h-3.5 w-3.5 animate-spin" />
              ) : pushState?.subscribed ? (
                <BellRing className="mr-2 h-3.5 w-3.5" />
              ) : (
                <BellOff className="mr-2 h-3.5 w-3.5" />
              )}
              {pushState?.permission === "denied"
                ? "Notifications blocked"
                : pushState?.subscribed
                  ? "Browser Alerts On"
                  : "Enable Browser Alerts"}
            </Button>
          )}
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
    <img src="/logo.png" alt="SCINetwork logo" className="h-9 w-9 rounded-md object-contain" />
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
