import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import {
  ShieldCheck,
  LogIn,
  ListChecks,
  Server,
  Database,
  Radio,
  Activity,
  WifiOff,
  Wifi,
} from "lucide-react";

import { NetworkBackground } from "@/components/NetworkBackground";
import { Button } from "@/components/ui/button";
import { API_BASE_URL, pingBackend } from "@/lib/api";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "SCINetwork — Observability Dashboard" },
      {
        name: "description",
        content:
          "Dashboard observability jaringan untuk inventory devices, monitoring configs, alerts, topology, dan ML observability.",
      },
    ],
  }),
  component: Landing,
});

type StatusCard = {
  label: string;
  value: string;
  status: "online" | "offline" | "unavailable" | "unknown";
  icon: React.ComponentType<{ className?: string }>;
};

function Landing() {
  const [online, setOnline] = useState<boolean | null>(null);

  useEffect(() => {
    let cancelled = false;
    pingBackend().then((ok) => {
      if (!cancelled) setOnline(ok);
    });
    return () => {
      cancelled = true;
    };
  }, []);

  const cards: StatusCard[] = [
    {
      label: "SERVICE",
      value: "SCINetwork API",
      status: online === null ? "unknown" : online ? "online" : "offline",
      icon: Server,
    },
    {
      label: "MYSQL",
      value: "scinetwork",
      status: online === null ? "unknown" : online ? "online" : "unavailable",
      icon: Database,
    },
    {
      label: "STACK",
      value: "fiber + mysql",
      status: online === null ? "unknown" : online ? "online" : "offline",
      icon: Radio,
    },
    {
      label: "BACKEND",
      value: API_BASE_URL,
      status: online === null ? "unknown" : online ? "online" : "offline",
      icon: Activity,
    },
  ];

  return (
    <div className="relative min-h-screen overflow-hidden bg-background text-foreground">
      <NetworkBackground className="opacity-60" />
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_at_top_left,rgba(52,211,153,0.08),transparent_50%),radial-gradient(ellipse_at_bottom_right,rgba(56,189,248,0.08),transparent_50%)]" />

      {/* Nav */}
      <header className="relative z-10 mx-auto flex max-w-7xl items-center justify-between px-6 py-6">
        <div className="flex items-center gap-3">
          <Logo />
          <div className="leading-tight">
            <div className="text-lg font-semibold tracking-tight">SCINetwork</div>
            <div className="font-mono text-xs text-muted-foreground">Go Fiber + MySQL</div>
          </div>
        </div>

        <nav className="hidden items-center gap-2 text-sm md:flex">
          <Link
            to="/login"
            className="rounded-md px-3 py-2 text-muted-foreground hover:text-foreground"
          >
            Login
          </Link>
          <Link
            to="/register"
            className="rounded-md px-3 py-2 text-muted-foreground hover:text-foreground"
          >
            Register
          </Link>
          <Link
            to="/dashboard"
            className="rounded-md border border-border bg-card/60 px-3 py-2 text-foreground hover:bg-card"
          >
            Dashboard
          </Link>
        </nav>
      </header>

      {/* Hero */}
      <main className="relative z-10 mx-auto max-w-7xl px-6 pb-24 pt-12">
        <span className="inline-flex items-center gap-2 rounded-full border border-primary/40 bg-primary/10 px-3 py-1 font-mono text-xs text-primary">
          <ShieldCheck className="h-3.5 w-3.5" />
          API v4.0
        </span>

        <h1 className="mt-6 text-5xl font-extrabold tracking-tight md:text-7xl">SCINetwork</h1>
        <p className="mt-5 max-w-2xl text-base leading-relaxed text-muted-foreground md:text-lg">
          Dashboard observability jaringan untuk inventory devices, monitoring configs, device
          status, alerts, notifications, topology, dan ML observability.
        </p>

        <div className="mt-8 flex flex-wrap gap-3">
          <Button asChild size="lg" className="rounded-md">
            <Link to="/login">
              Login <LogIn className="ml-2 h-4 w-4" />
            </Link>
          </Button>
          <Button
            asChild
            size="lg"
            variant="secondary"
            className="rounded-md border border-border bg-card/70 hover:bg-card"
          >
            <Link to="/dashboard/devices">
              <ListChecks className="mr-2 h-4 w-4" />
              Monitoring Configs
            </Link>
          </Button>
        </div>

        {/* Status cards */}
        <section className="mt-14 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {cards.map((c) => (
            <StatusTile key={c.label} card={c} />
          ))}
        </section>

        {/* Backend banner */}
        <section className="mt-6">
          {online === false && (
            <div className="flex items-start gap-3 rounded-xl border border-destructive/30 bg-destructive/10 px-5 py-4">
              <WifiOff className="mt-0.5 h-5 w-5 text-destructive" />
              <div>
                <div className="font-semibold">Backend belum bisa dijangkau</div>
                <div className="font-mono text-xs text-muted-foreground">
                  Pastikan SCINetwork API berjalan di {API_BASE_URL}, atau set{" "}
                  <code className="text-foreground">VITE_API_BASE_URL</code>.
                </div>
              </div>
            </div>
          )}
          {online === true && (
            <div className="flex items-start gap-3 rounded-xl border border-primary/30 bg-primary/10 px-5 py-4">
              <Wifi className="mt-0.5 h-5 w-5 text-primary" />
              <div>
                <div className="font-semibold">Backend reachable</div>
                <div className="font-mono text-xs text-muted-foreground">
                  Connected to {API_BASE_URL}
                </div>
              </div>
            </div>
          )}
        </section>

        {/* Feature grid */}
        <section className="mt-16 grid grid-cols-1 gap-4 md:grid-cols-3">
          <FeatureCard
            title="Device Inventory"
            desc="Kelola perangkat: mikrotik, switch, server. SNMP v2c/v3, ping & HTTP checks."
          />
          <FeatureCard
            title="Alerting & Notifikasi"
            desc="Threshold packet loss, latency, availability. Notifikasi Telegram, email, WhatsApp."
          />
          <FeatureCard
            title="Network Tools"
            desc="Ping, SNMP GET, HTTP probe. Log historis dengan filter device/status."
          />
        </section>
      </main>

      <footer className="relative z-10 border-t border-border/60 py-6 text-center font-mono text-xs text-muted-foreground">
        SCINetwork v4.0 · Go Fiber + MySQL
      </footer>
    </div>
  );
}

function StatusTile({ card }: { card: StatusCard }) {
  const Icon = card.icon;
  const statusColor =
    card.status === "online"
      ? "text-primary"
      : card.status === "unknown"
        ? "text-muted-foreground"
        : "text-destructive";
  return (
    <div className="group relative overflow-hidden rounded-xl border border-border bg-card/70 p-5 backdrop-blur transition-colors hover:border-primary/40">
      <div className="flex items-center justify-between">
        <div className="font-mono text-xs tracking-widest text-muted-foreground">{card.label}</div>
        <Icon className="h-4 w-4 text-muted-foreground" />
      </div>
      <div className="mt-4 truncate font-semibold">{card.value}</div>
      <div className={`mt-1 font-mono text-xs ${statusColor}`}>{card.status}</div>
    </div>
  );
}

function FeatureCard({ title, desc }: { title: string; desc: string }) {
  return (
    <div className="rounded-xl border border-border bg-card/50 p-5 backdrop-blur">
      <div className="font-semibold">{title}</div>
      <div className="mt-2 text-sm text-muted-foreground">{desc}</div>
    </div>
  );
}

function Logo() {
  return (
    <img src="/logo.png" alt="SCINetwork logo" className="h-10 w-10 rounded-md object-contain" />
  );
}
