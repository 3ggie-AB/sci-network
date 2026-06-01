import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import type { ComponentType, ReactNode } from "react";
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
  Bell,
  Brain,
  CircuitBoard,
  Clock3,
  Cpu,
  Gauge,
  GitBranch,
  Layers3,
  LineChart,
  Network,
  Workflow,
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
          "Dashboard observability jaringan dengan Go Fiber, MySQL, ClickHouse, monitoring probe, alerting, dan machine learning Isolation Forest.",
      },
    ],
  }),
  component: Landing,
});

type IconComponent = ComponentType<{ className?: string }>;

type StatusCard = {
  label: string;
  value: string;
  status: "online" | "offline" | "unavailable" | "unknown";
  icon: IconComponent;
};

type FeatureCardData = {
  title: string;
  desc: string;
  icon: IconComponent;
};

type DetailCardData = FeatureCardData & {
  points: string[];
};

type RoadmapItemData = {
  title: string;
  desc: string;
  tag: string;
  icon: IconComponent;
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

  const featureCards: FeatureCardData[] = [
    {
      title: "Device Inventory",
      desc: "Kelola perangkat seperti Mikrotik, switch, router, server, dan endpoint monitoring dari satu dashboard.",
      icon: Server,
    },
    {
      title: "Alerting & Notifikasi",
      desc: "Threshold untuk packet loss, latency, availability, HTTP status, dan kondisi perangkat yang perlu ditindaklanjuti.",
      icon: Bell,
    },
    {
      title: "Manual Tools",
      desc: "Ping, SNMP GET, HTTP probe, dan interface check untuk troubleshooting langsung dari dashboard.",
      icon: Gauge,
    },
  ];

  const technologyCards: DetailCardData[] = [
    {
      title: "Frontend Observability",
      desc: "Antarmuka dibangun dengan React, TanStack Router, React Query, Tailwind CSS, dan komponen UI berbasis Radix.",
      icon: Layers3,
      points: [
        "Routing halaman untuk landing, autentikasi, dashboard, devices, alerts, logs, users, feedbacks, dan manual tools.",
        "Health check API langsung dari landing page agar status backend terlihat sebelum masuk dashboard.",
        "Tampilan gelap dengan background network canvas untuk memberi konteks visual sistem monitoring jaringan.",
      ],
    },
    {
      title: "Backend Monitoring Engine",
      desc: "Go Fiber menjadi REST API utama untuk autentikasi, inventory, alert, feedback, user management, dan network tools.",
      icon: Cpu,
      points: [
        "Scheduler monitoring menjalankan ping, SNMP, HTTP probe, dan interface check secara berkala.",
        "Repository layer memisahkan akses data untuk users, devices, alerts, feedback, storage, dan network logs.",
        "Middleware auth menjaga endpoint dashboard tetap aman sesuai sesi dan role pengguna.",
      ],
    },
    {
      title: "Data Layer",
      desc: "MySQL dipakai untuk data operasional, sedangkan ClickHouse disiapkan untuk log monitoring berukuran besar.",
      icon: Database,
      points: [
        "MySQL menyimpan akun, perangkat, konfigurasi monitoring, alert, dan feedback.",
        "ClickHouse menyimpan network_logs historis agar query time-series dan training ML tetap cepat.",
        "Log probe berisi status, durasi, latency, packet loss, jitter, response time, CPU, memory, bandwidth, dan HTTP status.",
      ],
    },
  ];

  const pipelineSteps: FeatureCardData[] = [
    {
      title: "Collect",
      desc: "Go collector mengambil sinyal jaringan dari ping, SNMP, HTTP, dan interface check.",
      icon: Network,
    },
    {
      title: "Store",
      desc: "Hasil monitoring disimpan sebagai network_logs untuk analisis historis dan audit kondisi perangkat.",
      icon: Database,
    },
    {
      title: "Train",
      desc: "Python trainer membaca data ClickHouse, membuat fitur, lalu melatih model Isolation Forest harian.",
      icon: Brain,
    },
    {
      title: "Score",
      desc: "FastAPI sidecar memuat model terbaru dan memberi skor anomali untuk metric real-time.",
      icon: LineChart,
    },
  ];

  const mlCards: DetailCardData[] = [
    {
      title: "Feature Engineering",
      desc: "Data mentah network_logs diubah menjadi fitur yang mudah dipahami model.",
      icon: CircuitBoard,
      points: [
        "Numeric features mencakup success, duration, latency, packet_loss, jitter, response_time, CPU, memory, bandwidth, dan status code.",
        "Derived features seperti is_timeout, is_error_http, latency_missing, is_http, is_ping, timeout_flag, hour_of_day, dan day_of_week.",
        "Action dan status diperlakukan sebagai fitur kategori supaya model bisa membedakan tipe probe.",
      ],
    },
    {
      title: "Isolation Forest Pipeline",
      desc: "Model dibuat sebagai sklearn pipeline agar preprocessing dan detector selalu konsisten saat training dan inference.",
      icon: Brain,
      points: [
        "Numeric imputer mengisi nilai kosong, StandardScaler menormalkan skala metric.",
        "Categorical imputer dan OneHotEncoder menangani action/status baru tanpa merusak inference.",
        "Isolation Forest mendeteksi pola yang jarang muncul, cocok untuk anomali latency, timeout, dan error jaringan.",
      ],
    },
    {
      title: "Real-Time Sidecar",
      desc: "Model diekspor harian lalu dilayani oleh FastAPI sidecar untuk scoring dari sistem Go.",
      icon: Workflow,
      points: [
        "train_daily.sh menjalankan training berkala dengan parameter DAYS, LIMIT, OUTPUT, MODELS_DIR, dan TOP.",
        "Model disimpan sebagai model_YYYY-MM-DD.joblib, metadata JSON, model_latest.joblib, dan pointer latest.",
        "Endpoint /score dan /score/batch mengembalikan is_anomaly, prediction, anomaly_score, decision_score, dan fitur hasil normalisasi.",
      ],
    },
  ];

  const roadmapItems: RoadmapItemData[] = [
    {
      title: "Adaptive Threshold per Device",
      desc: "Baseline normal tiap perangkat bisa berbeda. Fitur ini akan membuat alert lebih akurat berdasarkan kebiasaan device dan tipe probe.",
      tag: "ML",
      icon: Gauge,
    },
    {
      title: "Anomaly Explanation",
      desc: "Dashboard dapat menampilkan alasan anomali seperti latency naik, packet loss tinggi, timeout HTTP, atau traffic melewati pola normal.",
      tag: "Explainability",
      icon: LineChart,
    },
    {
      title: "Feedback Loop",
      desc: "Label dari admin, misalnya true anomaly atau false alarm, dapat dipakai untuk evaluasi model dan tuning contamination.",
      tag: "Human-in-loop",
      icon: GitBranch,
    },
    {
      title: "Forecasting Capacity",
      desc: "Data bandwidth, CPU, memory, dan latency historis bisa dipakai untuk prediksi kapasitas sebelum bottleneck terjadi.",
      tag: "Prediction",
      icon: Clock3,
    },
    {
      title: "Root Cause Correlation",
      desc: "Alert dari beberapa device dapat dikorelasikan dengan topology agar gangguan upstream lebih cepat ditemukan.",
      tag: "Topology",
      icon: Network,
    },
    {
      title: "Automated Response",
      desc: "Anomali kritis dapat memicu runbook, notifikasi prioritas, eskalasi, atau integrasi ticketing di tahap berikutnya.",
      tag: "Automation",
      icon: Bell,
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
          <a
            href="#technology"
            className="rounded-md px-3 py-2 text-muted-foreground hover:text-foreground"
          >
            Teknologi
          </a>
          <a
            href="#machine-learning"
            className="rounded-md px-3 py-2 text-muted-foreground hover:text-foreground"
          >
            Machine Learning
          </a>
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
          API v4.0 · ML-ready observability
        </span>

        <h1 className="mt-6 text-5xl font-extrabold tracking-tight md:text-7xl">SCINetwork</h1>
        <p className="mt-5 max-w-2xl text-base leading-relaxed text-muted-foreground md:text-lg">
          Dashboard observability jaringan untuk inventory devices, monitoring configs, device
          status, alerts, notifications, topology, manual tools, dan deteksi anomali berbasis
          machine learning.
        </p>
        <p className="mt-4 max-w-3xl text-sm leading-7 text-muted-foreground">
          Di dalamnya, SCINetwork menggabungkan frontend React, backend Go Fiber, database MySQL,
          penyimpanan log ClickHouse, collector monitoring, serta Python Isolation Forest sidecar
          untuk membaca pola historis dan memberi sinyal ketika metric jaringan terlihat tidak
          normal.
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

        <div className="mt-8 flex flex-wrap gap-2">
          <TechPill>Go Fiber API</TechPill>
          <TechPill>React Dashboard</TechPill>
          <TechPill>MySQL Config Store</TechPill>
          <TechPill>ClickHouse Logs</TechPill>
          <TechPill>Python FastAPI Sidecar</TechPill>
          <TechPill>sklearn Isolation Forest</TechPill>
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
          {featureCards.map((feature) => (
            <FeatureCard key={feature.title} {...feature} />
          ))}
        </section>

        <section id="technology" className="mt-24 scroll-mt-8">
          <SectionIntro
            eyebrow="Teknologi di dalamnya"
            title="Dibangun dari monitoring real-time sampai data historis"
            desc="Landing page ini sekarang menjelaskan bagian teknis utama SCINetwork: antarmuka, API, collector, database operasional, log time-series, dan fondasi machine learning."
          />
          <div className="mt-8 grid grid-cols-1 gap-4 lg:grid-cols-3">
            {technologyCards.map((card) => (
              <DetailCard key={card.title} {...card} />
            ))}
          </div>
        </section>

        <section className="mt-24">
          <SectionIntro
            eyebrow="Alur data"
            title="Dari probe jaringan menjadi insight"
            desc="Setiap pengecekan jaringan berjalan sebagai data pipeline yang bisa dipakai untuk dashboard, alert, audit, dan training model anomali."
          />
          <div className="mt-8 grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-4">
            {pipelineSteps.map((step, index) => (
              <PipelineStep key={step.title} index={index + 1} {...step} />
            ))}
          </div>
        </section>

        <section id="machine-learning" className="mt-24 scroll-mt-8">
          <SectionIntro
            eyebrow="Machine learning"
            title="Isolation Forest untuk deteksi anomali jaringan"
            desc="Model ML fokus mencari pola yang jarang muncul dari log historis. Pendekatan ini cocok untuk menemukan timeout, lonjakan latency, packet loss, HTTP error, atau kombinasi metric yang tidak biasa."
          />
          <div className="mt-8 grid grid-cols-1 gap-4 lg:grid-cols-3">
            {mlCards.map((card) => (
              <DetailCard key={card.title} {...card} />
            ))}
          </div>

          <div className="mt-8 grid grid-cols-1 gap-4 md:grid-cols-3">
            <MetricCard
              label="Training Window"
              value="30 hari"
              desc="Default data historis untuk model harian."
            />
            <MetricCard
              label="Detector"
              value="Isolation Forest"
              desc="Unsupervised anomaly detection dari sklearn."
            />
            <MetricCard
              label="Serving"
              value="/score"
              desc="Endpoint FastAPI untuk inference real-time dan batch."
            />
          </div>
        </section>

        <section className="mt-24">
          <SectionIntro
            eyebrow="Fitur ke depannya"
            title="Roadmap ML dan observability"
            desc="Arah pengembangan berikutnya adalah membuat alert lebih kontekstual, model lebih mudah dievaluasi, dan dashboard lebih cepat membantu admin menemukan sumber gangguan."
          />
          <div className="mt-8 grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-3">
            {roadmapItems.map((item) => (
              <RoadmapCard key={item.title} {...item} />
            ))}
          </div>
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

function TechPill({ children }: { children: ReactNode }) {
  return (
    <span className="rounded-md border border-border bg-card/50 px-3 py-1.5 font-mono text-xs text-muted-foreground backdrop-blur">
      {children}
    </span>
  );
}

function FeatureCard({ title, desc, icon }: FeatureCardData) {
  const Icon = icon;
  return (
    <div className="rounded-xl border border-border bg-card/50 p-5 backdrop-blur">
      <div className="flex items-center gap-3">
        <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-md border border-primary/30 bg-primary/10 text-primary">
          <Icon className="h-4 w-4" />
        </span>
        <div className="font-semibold">{title}</div>
      </div>
      <div className="mt-2 text-sm text-muted-foreground">{desc}</div>
    </div>
  );
}

function SectionIntro({ eyebrow, title, desc }: { eyebrow: string; title: string; desc: string }) {
  return (
    <div className="max-w-3xl">
      <div className="font-mono text-xs uppercase tracking-widest text-primary">{eyebrow}</div>
      <h2 className="mt-3 text-3xl font-bold tracking-tight md:text-4xl">{title}</h2>
      <p className="mt-4 text-sm leading-7 text-muted-foreground md:text-base">{desc}</p>
    </div>
  );
}

function DetailCard({ title, desc, icon, points }: DetailCardData) {
  const Icon = icon;
  return (
    <article className="rounded-xl border border-border bg-card/55 p-5 backdrop-blur">
      <div className="flex items-start gap-3">
        <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-md border border-primary/30 bg-primary/10 text-primary">
          <Icon className="h-5 w-5" />
        </span>
        <div>
          <h3 className="font-semibold">{title}</h3>
          <p className="mt-2 text-sm leading-6 text-muted-foreground">{desc}</p>
        </div>
      </div>
      <ul className="mt-5 space-y-3 text-sm leading-6 text-muted-foreground">
        {points.map((point) => (
          <li key={point} className="flex gap-3">
            <span className="mt-2 h-1.5 w-1.5 shrink-0 rounded-full bg-primary" />
            <span>{point}</span>
          </li>
        ))}
      </ul>
    </article>
  );
}

function PipelineStep({ title, desc, icon, index }: FeatureCardData & { index: number }) {
  const Icon = icon;
  return (
    <article className="rounded-xl border border-border bg-card/50 p-5 backdrop-blur">
      <div className="flex items-center justify-between gap-3">
        <span className="font-mono text-xs text-muted-foreground">STEP {index}</span>
        <Icon className="h-5 w-5 text-primary" />
      </div>
      <h3 className="mt-5 font-semibold">{title}</h3>
      <p className="mt-2 text-sm leading-6 text-muted-foreground">{desc}</p>
    </article>
  );
}

function MetricCard({ label, value, desc }: { label: string; value: string; desc: string }) {
  return (
    <article className="rounded-xl border border-border bg-card/45 p-5 backdrop-blur">
      <div className="font-mono text-xs uppercase tracking-widest text-muted-foreground">
        {label}
      </div>
      <div className="mt-3 text-2xl font-bold tracking-tight">{value}</div>
      <p className="mt-2 text-sm leading-6 text-muted-foreground">{desc}</p>
    </article>
  );
}

function RoadmapCard({ title, desc, tag, icon }: RoadmapItemData) {
  const Icon = icon;
  return (
    <article className="rounded-xl border border-border bg-card/50 p-5 backdrop-blur transition-colors hover:border-primary/40">
      <div className="flex items-center justify-between gap-3">
        <span className="rounded-md border border-border bg-background/40 px-2 py-1 font-mono text-[11px] uppercase tracking-widest text-muted-foreground">
          {tag}
        </span>
        <Icon className="h-5 w-5 text-primary" />
      </div>
      <h3 className="mt-5 font-semibold">{title}</h3>
      <p className="mt-2 text-sm leading-6 text-muted-foreground">{desc}</p>
    </article>
  );
}

function Logo() {
  return (
    <img src="/logo.png" alt="SCINetwork logo" className="h-10 w-10 rounded-md object-contain" />
  );
}
