import { jsxs, jsx } from "react/jsx-runtime";
import { useLocation, useNavigate, Link } from "@tanstack/react-router";
import { LayoutDashboard, Server, Bell, MessageSquareWarning, ScrollText, Users, Wrench, Loader2, BellRing, BellOff, LogOut } from "lucide-react";
import { useState, useEffect } from "react";
import { toast } from "sonner";
import { u as useAuth } from "./router-BHOai5Fo.js";
import { B as Button } from "./button-BXrfXN_b.js";
import { g as getBrowserPushState, e as enableBrowserPush, d as disableBrowserPush } from "./push-notifications-CahqIseY.js";
const items = [
  { to: "/dashboard", label: "Overview", icon: LayoutDashboard, exact: true },
  { to: "/dashboard/devices", label: "Devices", icon: Server },
  { to: "/dashboard/alerts", label: "Alerts", icon: Bell },
  { to: "/dashboard/feedbacks", label: "Feedbacks", icon: MessageSquareWarning },
  { to: "/dashboard/logs", label: "Logs", icon: ScrollText },
  { to: "/dashboard/users", label: "Users", icon: Users },
  { to: "/dashboard/network", label: "Manual Tools", icon: Wrench }
];
const PENDING_PUSH_ENABLE_KEY = "scinetwork.enablePushAfterLogin";
function DashboardLayout({ children }) {
  const { user, token, logout } = useAuth();
  const loc = useLocation();
  const nav = useNavigate();
  const [pushState, setPushState] = useState(null);
  const [pushBusy, setPushBusy] = useState(false);
  const canReadAlerts = ["admin", "atasan", "teknisi"].includes(user?.role ?? "");
  useEffect(() => {
    let cancelled = false;
    if (!token || !canReadAlerts) {
      setPushState(null);
      return;
    }
    getBrowserPushState().then((state) => {
      if (!cancelled) setPushState(state);
    }).catch(() => {
      if (!cancelled) {
        setPushState({ supported: false, permission: "unsupported", subscribed: false });
      }
    });
    return () => {
      cancelled = true;
    };
  }, [token, canReadAlerts]);
  useEffect(() => {
    if (typeof window === "undefined" || !token || !canReadAlerts || localStorage.getItem(PENDING_PUSH_ENABLE_KEY) !== "1") {
      return;
    }
    let cancelled = false;
    localStorage.removeItem(PENDING_PUSH_ENABLE_KEY);
    setPushBusy(true);
    enableBrowserPush().then((state) => {
      if (cancelled) return;
      setPushState(state);
      toast.success("Browser alerts aktif");
    }).catch((err) => {
      if (!cancelled) {
        toast.error(err instanceof Error ? err.message : "Gagal mengaktifkan browser alerts");
      }
    }).finally(() => {
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
      const nextState = pushState?.subscribed ? await disableBrowserPush() : await enableBrowserPush();
      setPushState(nextState);
      toast.success(nextState.subscribed ? "Browser alerts aktif" : "Browser alerts dimatikan");
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Gagal mengubah browser alerts");
    } finally {
      setPushBusy(false);
    }
  }
  return /* @__PURE__ */ jsxs("div", { className: "flex min-h-screen bg-background text-foreground", children: [
    /* @__PURE__ */ jsxs("aside", { className: "hidden w-64 shrink-0 border-r border-sidebar-border bg-sidebar md:flex md:flex-col", children: [
      /* @__PURE__ */ jsxs("div", { className: "flex items-center gap-3 px-5 py-5", children: [
        /* @__PURE__ */ jsx(Logo, {}),
        /* @__PURE__ */ jsxs("div", { className: "leading-tight", children: [
          /* @__PURE__ */ jsx("div", { className: "text-sm font-semibold", children: "SCINetwork" }),
          /* @__PURE__ */ jsx("div", { className: "font-mono text-[10px] text-muted-foreground", children: "v4.0 · fiber+mysql" })
        ] })
      ] }),
      /* @__PURE__ */ jsx("nav", { className: "flex-1 space-y-1 px-3", children: items.map((it) => {
        const active = it.exact ? loc.pathname === it.to : loc.pathname === it.to || loc.pathname.startsWith(it.to + "/");
        const Icon = it.icon;
        return /* @__PURE__ */ jsxs(
          Link,
          {
            to: it.to,
            className: `flex items-center gap-3 rounded-lg px-3 py-2 text-sm transition-colors ${active ? "bg-primary/15 text-primary" : "text-sidebar-foreground/80 hover:bg-sidebar-accent hover:text-sidebar-foreground"}`,
            children: [
              /* @__PURE__ */ jsx(Icon, { className: "h-4 w-4" }),
              it.label
            ]
          },
          it.to
        );
      }) }),
      /* @__PURE__ */ jsxs("div", { className: "border-t border-sidebar-border p-4", children: [
        /* @__PURE__ */ jsxs("div", { className: "mb-3", children: [
          /* @__PURE__ */ jsx("div", { className: "truncate text-sm font-medium", children: user?.full_name ?? user?.username ?? "Guest" }),
          /* @__PURE__ */ jsx("div", { className: "font-mono text-[10px] text-muted-foreground", children: user?.role ?? "anonymous" })
        ] }),
        canReadAlerts && /* @__PURE__ */ jsxs(
          Button,
          {
            onClick: onToggleBrowserPush,
            variant: "outline",
            size: "sm",
            className: "mb-2 w-full",
            disabled: pushBusy || !pushState?.supported || pushState.permission === "denied" || pushState.permission === "unsupported",
            children: [
              pushBusy ? /* @__PURE__ */ jsx(Loader2, { className: "mr-2 h-3.5 w-3.5 animate-spin" }) : pushState?.subscribed ? /* @__PURE__ */ jsx(BellRing, { className: "mr-2 h-3.5 w-3.5" }) : /* @__PURE__ */ jsx(BellOff, { className: "mr-2 h-3.5 w-3.5" }),
              pushState?.permission === "denied" ? "Notifications blocked" : pushState?.subscribed ? "Browser Alerts On" : "Enable Browser Alerts"
            ]
          }
        ),
        /* @__PURE__ */ jsxs(Button, { onClick: onLogout, variant: "secondary", size: "sm", className: "w-full", children: [
          /* @__PURE__ */ jsx(LogOut, { className: "mr-2 h-3.5 w-3.5" }),
          " Logout"
        ] })
      ] })
    ] }),
    /* @__PURE__ */ jsxs("main", { className: "min-w-0 flex-1", children: [
      /* @__PURE__ */ jsx("div", { className: "border-b border-border/60 bg-background/60 px-6 py-4 backdrop-blur", children: /* @__PURE__ */ jsx("div", { className: "font-mono text-[11px] uppercase tracking-widest text-muted-foreground", children: loc.pathname }) }),
      /* @__PURE__ */ jsx("div", { className: "p-6", children })
    ] })
  ] });
}
function Logo() {
  return /* @__PURE__ */ jsx("img", { src: "/logo.png", alt: "SCINetwork logo", className: "h-9 w-9 rounded-md object-contain" });
}
function PageHeader({
  title,
  description,
  actions
}) {
  return /* @__PURE__ */ jsxs("div", { className: "mb-6 flex flex-wrap items-end justify-between gap-3", children: [
    /* @__PURE__ */ jsxs("div", { children: [
      /* @__PURE__ */ jsx("h1", { className: "text-2xl font-bold tracking-tight", children: title }),
      description && /* @__PURE__ */ jsx("p", { className: "mt-1 text-sm text-muted-foreground", children: description })
    ] }),
    actions
  ] });
}
export {
  DashboardLayout as D,
  PageHeader as P
};
