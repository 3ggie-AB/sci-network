import { QueryClientProvider, QueryClient } from "@tanstack/react-query";
import { createRootRouteWithContext, useRouter, Link, Outlet, HeadContent, Scripts, createFileRoute, lazyRouteComponent, redirect, createRouter } from "@tanstack/react-router";
import { jsx, jsxs } from "react/jsx-runtime";
import { useState, useEffect, useCallback, createContext, useContext } from "react";
import { Toaster as Toaster$1 } from "sonner";
const appCss = "/assets/styles-BjsQnxWF.css";
function reportLovableError(error, context = {}) {
  if (typeof window === "undefined") return;
  window.__lovableEvents?.captureException?.(
    error,
    {
      source: "react_error_boundary",
      route: window.location.pathname,
      ...context
    },
    {
      mechanism: "react_error_boundary",
      handled: false,
      severity: "error"
    }
  );
}
const BASE = resolveApiBase();
function resolveApiBase() {
  const configured = ""?.trim();
  if (configured) return configured.replace(/\/+$/, "");
  return "";
}
const TOKEN_KEY = "scinetwork.token";
const USER_KEY = "scinetwork.user";
function getToken() {
  if (typeof window === "undefined") return null;
  return localStorage.getItem(TOKEN_KEY);
}
function setToken(token) {
  if (typeof window === "undefined") return;
  if (token) localStorage.setItem(TOKEN_KEY, token);
  else localStorage.removeItem(TOKEN_KEY);
}
function getStoredUser() {
  if (typeof window === "undefined") return null;
  const raw = localStorage.getItem(USER_KEY);
  return raw ? JSON.parse(raw) : null;
}
function setStoredUser(user) {
  if (typeof window === "undefined") return;
  if (user) localStorage.setItem(USER_KEY, JSON.stringify(user));
  else localStorage.removeItem(USER_KEY);
}
class ApiError extends Error {
  constructor(status, message, payload) {
    super(message);
    this.status = status;
    this.payload = payload;
  }
  status;
  payload;
}
async function api(path, opts = {}) {
  const headers = new Headers(opts.headers);
  const token = getToken();
  if (token) headers.set("Authorization", `Bearer ${token}`);
  let body = opts.body;
  if (opts.json !== void 0) {
    headers.set("Content-Type", "application/json");
    body = JSON.stringify(opts.json);
  }
  const normalizedPath = path.startsWith("/") ? path : `/${path}`;
  const url = path.startsWith("http") ? path : `${BASE}${normalizedPath}`;
  const res = await fetch(url, { ...opts, headers, body });
  const text = await res.text();
  const data = text ? safeJSON(text) : null;
  if (!res.ok) {
    const payload = isRecord(data) ? data : {};
    const msg = payload.message || payload.error || `Request failed (${res.status})`;
    throw new ApiError(res.status, String(msg), data);
  }
  return data;
}
function asArray(response) {
  const candidates = responseCandidates(response);
  for (const candidate of candidates) {
    if (Array.isArray(candidate)) return candidate;
  }
  return [];
}
function asObject(response) {
  const candidates = responseCandidates(response);
  for (const candidate of candidates) {
    if (isRecord(candidate) && !Array.isArray(candidate)) return candidate;
  }
  return {};
}
function unwrapResponse(response) {
  const candidates = responseCandidates(response);
  for (const candidate of candidates) {
    if (candidate !== null && candidate !== void 0) return candidate;
  }
  return null;
}
function responseCandidates(response) {
  if (isRecord(response)) {
    const isEnvelope = "data" in response || "items" in response || "results" in response;
    if (!isEnvelope) return [response];
    const candidates = [];
    if ("data" in response) candidates.push(response.data);
    if ("items" in response) candidates.push(response.items);
    if ("results" in response) candidates.push(response.results);
    if (isRecord(response.data)) {
      candidates.push(response.data.data, response.data.items, response.data.results);
    }
    return candidates;
  }
  return [response];
}
function isRecord(value) {
  return typeof value === "object" && value !== null;
}
function safeJSON(s) {
  try {
    return JSON.parse(s);
  } catch {
    return s;
  }
}
async function pingBackend() {
  try {
    const ctrl = new AbortController();
    const t = setTimeout(() => ctrl.abort(), 4e3);
    const res = await fetch(`${BASE}/health`, { signal: ctrl.signal }).catch(() => null);
    clearTimeout(t);
    if (res && res.ok) return true;
    const res2 = await fetch(`${BASE}/api/network/scheduler/status`, {
      headers: getToken() ? { Authorization: `Bearer ${getToken()}` } : void 0
    }).catch(() => null);
    return !!res2 && res2.status < 500;
  } catch {
    return false;
  }
}
const API_BASE_URL = BASE;
const Ctx = createContext(null);
function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [token, setTok] = useState(null);
  const [loading, setLoading] = useState(true);
  useEffect(() => {
    setTok(getToken());
    setUser(getStoredUser());
    setLoading(false);
  }, []);
  const refresh = useCallback(async () => {
    if (!getToken()) return;
    try {
      const res = await api("/api/auth/me");
      const u = res?.data ?? res?.user ?? res;
      if (u) {
        setUser(u);
        setStoredUser(u);
      }
    } catch {
    }
  }, []);
  const login = useCallback(async (username, password) => {
    const res = await api("/api/auth/login", { method: "POST", json: { username, password } });
    const token2 = res?.token ?? res?.access_token ?? res?.data?.token ?? res?.data?.access_token;
    const u = res?.user ?? res?.data?.user ?? { id: "", username };
    if (!token2) throw new Error("Login response missing token");
    setToken(token2);
    setStoredUser(u);
    setTok(token2);
    setUser(u);
    await refresh();
  }, [refresh]);
  const register = useCallback(
    async (input) => {
      await api("/api/auth/register", { method: "POST", json: input });
    },
    []
  );
  const logout = useCallback(() => {
    setToken(null);
    setStoredUser(null);
    setTok(null);
    setUser(null);
  }, []);
  return /* @__PURE__ */ jsx(Ctx.Provider, { value: { user, token, loading, login, register, logout, refresh }, children });
}
function useAuth() {
  const v = useContext(Ctx);
  if (!v) throw new Error("useAuth must be used inside AuthProvider");
  return v;
}
const Toaster = ({ ...props }) => {
  return /* @__PURE__ */ jsx(
    Toaster$1,
    {
      className: "toaster group",
      toastOptions: {
        classNames: {
          toast: "group toast group-[.toaster]:bg-background group-[.toaster]:text-foreground group-[.toaster]:border-border group-[.toaster]:shadow-lg",
          description: "group-[.toast]:text-muted-foreground",
          actionButton: "group-[.toast]:bg-primary group-[.toast]:text-primary-foreground",
          cancelButton: "group-[.toast]:bg-muted group-[.toast]:text-muted-foreground"
        }
      },
      ...props
    }
  );
};
function NotFoundComponent() {
  return /* @__PURE__ */ jsx("div", { className: "flex min-h-screen items-center justify-center bg-background px-4", children: /* @__PURE__ */ jsxs("div", { className: "max-w-md text-center", children: [
    /* @__PURE__ */ jsx("h1", { className: "text-7xl font-bold text-foreground", children: "404" }),
    /* @__PURE__ */ jsx("h2", { className: "mt-4 text-xl font-semibold text-foreground", children: "Page not found" }),
    /* @__PURE__ */ jsx("p", { className: "mt-2 text-sm text-muted-foreground", children: "The page you're looking for doesn't exist or has been moved." }),
    /* @__PURE__ */ jsx("div", { className: "mt-6", children: /* @__PURE__ */ jsx(
      Link,
      {
        to: "/",
        className: "inline-flex items-center justify-center rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground transition-colors hover:bg-primary/90",
        children: "Go home"
      }
    ) })
  ] }) });
}
function ErrorComponent({ error, reset }) {
  console.error(error);
  const router2 = useRouter();
  useEffect(() => {
    reportLovableError(error, { boundary: "tanstack_root_error_component" });
  }, [error]);
  return /* @__PURE__ */ jsx("div", { className: "flex min-h-screen items-center justify-center bg-background px-4", children: /* @__PURE__ */ jsxs("div", { className: "max-w-md text-center", children: [
    /* @__PURE__ */ jsx("h1", { className: "text-xl font-semibold tracking-tight text-foreground", children: "This page didn't load" }),
    /* @__PURE__ */ jsx("p", { className: "mt-2 text-sm text-muted-foreground", children: "Something went wrong on our end. You can try refreshing or head back home." }),
    /* @__PURE__ */ jsxs("div", { className: "mt-6 flex flex-wrap justify-center gap-2", children: [
      /* @__PURE__ */ jsx(
        "button",
        {
          onClick: () => {
            router2.invalidate();
            reset();
          },
          className: "inline-flex items-center justify-center rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground transition-colors hover:bg-primary/90",
          children: "Try again"
        }
      ),
      /* @__PURE__ */ jsx(
        "a",
        {
          href: "/",
          className: "inline-flex items-center justify-center rounded-md border border-input bg-background px-4 py-2 text-sm font-medium text-foreground transition-colors hover:bg-accent",
          children: "Go home"
        }
      )
    ] })
  ] }) });
}
const Route$b = createRootRouteWithContext()({
  head: () => ({
    meta: [
      { charSet: "utf-8" },
      { name: "viewport", content: "width=device-width, initial-scale=1" },
      { title: "SCINetwork — Network Observability" },
      {
        name: "description",
        content: "Dashboard observability jaringan untuk inventory devices, monitoring configs, alerts, topology, dan ML observability."
      },
      { property: "og:title", content: "SCINetwork — Network Observability" },
      {
        property: "og:description",
        content: "Network monitoring dashboard powered by Go Fiber + MySQL."
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" }
    ],
    links: [
      { rel: "stylesheet", href: appCss },
      { rel: "icon", type: "image/png", href: "/logo.png" },
      { rel: "apple-touch-icon", href: "/logo.png" },
      {
        rel: "stylesheet",
        href: "https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800&family=JetBrains+Mono:wght@400;500;600&display=swap"
      }
    ]
  }),
  shellComponent: RootShell,
  component: RootComponent,
  notFoundComponent: NotFoundComponent,
  errorComponent: ErrorComponent
});
function RootShell({ children }) {
  return /* @__PURE__ */ jsxs("html", { lang: "en", children: [
    /* @__PURE__ */ jsx("head", { children: /* @__PURE__ */ jsx(HeadContent, {}) }),
    /* @__PURE__ */ jsxs("body", { children: [
      children,
      /* @__PURE__ */ jsx(Scripts, {})
    ] })
  ] });
}
function RootComponent() {
  const { queryClient } = Route$b.useRouteContext();
  return /* @__PURE__ */ jsx(QueryClientProvider, { client: queryClient, children: /* @__PURE__ */ jsxs(AuthProvider, { children: [
    /* @__PURE__ */ jsx(Outlet, {}),
    /* @__PURE__ */ jsx(Toaster, { richColors: true, theme: "dark", position: "top-right" })
  ] }) });
}
const $$splitComponentImporter$a = () => import("./register-DXyg6Wyx.js");
const Route$a = createFileRoute("/register")({
  head: () => ({
    meta: [{
      title: "Register — SCINetwork"
    }, {
      name: "description",
      content: "Create a SCINetwork account."
    }]
  }),
  component: lazyRouteComponent($$splitComponentImporter$a, "component")
});
const $$splitComponentImporter$9 = () => import("./login-Bbp-VZz8.js");
const Route$9 = createFileRoute("/login")({
  head: () => ({
    meta: [{
      title: "Login — SCINetwork"
    }, {
      name: "description",
      content: "Sign in to SCINetwork observability dashboard."
    }]
  }),
  component: lazyRouteComponent($$splitComponentImporter$9, "component")
});
const $$splitComponentImporter$8 = () => import("./dashboard-PzEYkUlM.js");
const Route$8 = createFileRoute("/dashboard")({
  beforeLoad: () => {
    if (typeof window !== "undefined" && !getToken()) {
      throw redirect({
        to: "/login"
      });
    }
  },
  component: lazyRouteComponent($$splitComponentImporter$8, "component")
});
const $$splitComponentImporter$7 = () => import("./index-DiLE9Vz7.js");
const Route$7 = createFileRoute("/")({
  head: () => ({
    meta: [{
      title: "SCINetwork — Observability Dashboard"
    }, {
      name: "description",
      content: "Dashboard observability jaringan dengan Go Fiber, MySQL, ClickHouse, monitoring probe, alerting, dan machine learning Isolation Forest."
    }]
  }),
  component: lazyRouteComponent($$splitComponentImporter$7, "component")
});
const $$splitComponentImporter$6 = () => import("./dashboard.index-CLNnEqDa.js");
const Route$6 = createFileRoute("/dashboard/")({
  component: lazyRouteComponent($$splitComponentImporter$6, "component")
});
const $$splitComponentImporter$5 = () => import("./dashboard.users-CYHyOvbv.js");
const Route$5 = createFileRoute("/dashboard/users")({
  component: lazyRouteComponent($$splitComponentImporter$5, "component")
});
const $$splitComponentImporter$4 = () => import("./dashboard.network-CBy6dNxe.js");
const Route$4 = createFileRoute("/dashboard/network")({
  component: lazyRouteComponent($$splitComponentImporter$4, "component")
});
const $$splitComponentImporter$3 = () => import("./dashboard.logs-BIuHn6ox.js");
const Route$3 = createFileRoute("/dashboard/logs")({
  component: lazyRouteComponent($$splitComponentImporter$3, "component")
});
const $$splitComponentImporter$2 = () => import("./dashboard.feedbacks-C3cIX3og.js");
const Route$2 = createFileRoute("/dashboard/feedbacks")({
  component: lazyRouteComponent($$splitComponentImporter$2, "component")
});
const $$splitComponentImporter$1 = () => import("./dashboard.devices-BA4sVLga.js");
const Route$1 = createFileRoute("/dashboard/devices")({
  component: lazyRouteComponent($$splitComponentImporter$1, "component")
});
const $$splitComponentImporter = () => import("./dashboard.alerts-CPledSJA.js");
const Route = createFileRoute("/dashboard/alerts")({
  component: lazyRouteComponent($$splitComponentImporter, "component")
});
const RegisterRoute = Route$a.update({
  id: "/register",
  path: "/register",
  getParentRoute: () => Route$b
});
const LoginRoute = Route$9.update({
  id: "/login",
  path: "/login",
  getParentRoute: () => Route$b
});
const DashboardRoute = Route$8.update({
  id: "/dashboard",
  path: "/dashboard",
  getParentRoute: () => Route$b
});
const IndexRoute = Route$7.update({
  id: "/",
  path: "/",
  getParentRoute: () => Route$b
});
const DashboardIndexRoute = Route$6.update({
  id: "/",
  path: "/",
  getParentRoute: () => DashboardRoute
});
const DashboardUsersRoute = Route$5.update({
  id: "/users",
  path: "/users",
  getParentRoute: () => DashboardRoute
});
const DashboardNetworkRoute = Route$4.update({
  id: "/network",
  path: "/network",
  getParentRoute: () => DashboardRoute
});
const DashboardLogsRoute = Route$3.update({
  id: "/logs",
  path: "/logs",
  getParentRoute: () => DashboardRoute
});
const DashboardFeedbacksRoute = Route$2.update({
  id: "/feedbacks",
  path: "/feedbacks",
  getParentRoute: () => DashboardRoute
});
const DashboardDevicesRoute = Route$1.update({
  id: "/devices",
  path: "/devices",
  getParentRoute: () => DashboardRoute
});
const DashboardAlertsRoute = Route.update({
  id: "/alerts",
  path: "/alerts",
  getParentRoute: () => DashboardRoute
});
const DashboardRouteChildren = {
  DashboardAlertsRoute,
  DashboardDevicesRoute,
  DashboardFeedbacksRoute,
  DashboardLogsRoute,
  DashboardNetworkRoute,
  DashboardUsersRoute,
  DashboardIndexRoute
};
const DashboardRouteWithChildren = DashboardRoute._addFileChildren(
  DashboardRouteChildren
);
const rootRouteChildren = {
  IndexRoute,
  DashboardRoute: DashboardRouteWithChildren,
  LoginRoute,
  RegisterRoute
};
const routeTree = Route$b._addFileChildren(rootRouteChildren)._addFileTypes();
const getRouter = () => {
  const queryClient = new QueryClient();
  const router2 = createRouter({
    routeTree,
    context: { queryClient },
    scrollRestoration: true,
    defaultPreloadStaleTime: 0
  });
  return router2;
};
const router = /* @__PURE__ */ Object.freeze(/* @__PURE__ */ Object.defineProperty({
  __proto__: null,
  getRouter
}, Symbol.toStringTag, { value: "Module" }));
export {
  API_BASE_URL as A,
  api as a,
  asObject as b,
  asArray as c,
  unwrapResponse as d,
  getToken as g,
  pingBackend as p,
  router as r,
  useAuth as u
};
