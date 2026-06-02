import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useRef, useState, type ComponentType, type ReactNode } from "react";
import {
  ShieldCheck, LogIn, ListChecks, Server, Database, Radio, Activity,
  WifiOff, Wifi, Bell, Brain, CircuitBoard, Clock3, Cpu, Gauge,
  GitBranch, Layers3, LineChart, Network, Workflow, ChevronRight,
  Zap, BarChart3, ArrowRight,
} from "lucide-react";

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

// ─── Types ────────────────────────────────────────────────────────────────────
type IconComponent = ComponentType<{ className?: string }>;
type Status = "online" | "offline" | "unavailable" | "unknown";

type StatusCard  = { label: string; value: string; status: Status; icon: IconComponent };
type FeatureCard = { title: string; desc: string; icon: IconComponent };
type DetailCard  = FeatureCard & { points: string[] };
type RoadmapItem = { title: string; desc: string; tag: string; icon: IconComponent };
type PipelineStep = FeatureCard & { index: number; emoji: string };
type BigStat     = { num: string; label: string };
type ThinFeat    = { name: string; tag: string };

// ─── Data ─────────────────────────────────────────────────────────────────────
const featureCards: FeatureCard[] = [
  { title: "Device Inventory",      desc: "Kelola Mikrotik, switch, router, server, dan endpoint dari satu dashboard terpusat.",                    icon: Server  },
  { title: "Alerting & Notifikasi", desc: "Threshold untuk packet loss, latency, availability, HTTP status, dan kondisi perangkat.",                icon: Bell    },
  { title: "Manual Tools",          desc: "Ping, SNMP GET, HTTP probe, dan interface check untuk troubleshooting langsung dari dashboard.",          icon: Gauge   },
];

const technologyCards: DetailCard[] = [
  {
    title: "Frontend Observability", desc: "React · TanStack Router · React Query · Tailwind CSS · Radix UI.", icon: Layers3,
    points: [
      "Routing halaman: landing, auth, dashboard, devices, alerts, logs, users, feedbacks, manual tools.",
      "Health check API langsung dari landing page agar status backend terlihat sebelum masuk dashboard.",
      "Tampilan gelap dengan network canvas untuk konteks visual sistem monitoring.",
    ],
  },
  {
    title: "Backend Monitoring Engine", desc: "Go Fiber sebagai REST API utama untuk autentikasi, inventory, alert, dan network tools.", icon: Cpu,
    points: [
      "Scheduler menjalankan ping, SNMP, HTTP probe, dan interface check secara berkala.",
      "Repository layer memisahkan akses data: users, devices, alerts, feedback, logs.",
      "Middleware auth menjaga endpoint dashboard aman sesuai sesi dan role pengguna.",
    ],
  },
  {
    title: "Data Layer", desc: "MySQL untuk data operasional, ClickHouse untuk log monitoring berukuran besar.", icon: Database,
    points: [
      "MySQL menyimpan akun, perangkat, konfigurasi monitoring, alert, dan feedback.",
      "ClickHouse untuk network_logs historis agar query time-series dan ML tetap cepat.",
      "Log probe: status, latency, packet loss, jitter, CPU, memory, bandwidth, HTTP status.",
    ],
  },
];

const pipelineSteps: (FeatureCard & { emoji: string })[] = [
  { title: "Collect", desc: "Go collector mengambil sinyal dari ping, SNMP, HTTP, dan interface check secara berkala.",         icon: Network,   emoji: "📡" },
  { title: "Store",   desc: "Hasil monitoring disimpan sebagai network_logs untuk analisis historis dan audit perangkat.",      icon: Database,  emoji: "💾" },
  { title: "Train",   desc: "Python trainer membaca ClickHouse, membuat fitur, lalu melatih Isolation Forest harian.",         icon: Brain,     emoji: "🧠" },
  { title: "Score",   desc: "FastAPI sidecar memuat model terbaru dan memberi skor anomali untuk metric real-time dan batch.", icon: LineChart, emoji: "📊" },
];

const mlCards: DetailCard[] = [
  {
    title: "Feature Engineering", desc: "Data mentah network_logs diubah menjadi fitur yang mudah dipahami model.", icon: CircuitBoard,
    points: [
      "Numeric: success, duration, latency, packet_loss, jitter, response_time, CPU, memory, bandwidth.",
      "Derived: is_timeout, is_error_http, latency_missing, timeout_flag, hour_of_day, day_of_week.",
      "Action dan status sebagai fitur kategori agar model bisa membedakan tipe probe.",
    ],
  },
  {
    title: "Isolation Forest Pipeline", desc: "sklearn pipeline agar preprocessing dan detector konsisten saat training dan inference.", icon: Brain,
    points: [
      "Numeric imputer + StandardScaler untuk normalisasi skala metric.",
      "Categorical imputer + OneHotEncoder untuk action/status baru tanpa merusak inference.",
      "Isolation Forest mendeteksi pola jarang — latency, timeout, error jaringan.",
    ],
  },
  {
    title: "Real-Time Sidecar", desc: "Model diekspor harian lalu dilayani FastAPI untuk scoring dari sistem Go.", icon: Workflow,
    points: [
      "train_daily.sh menjalankan training berkala dengan DAYS, LIMIT, OUTPUT, MODELS_DIR.",
      "Model tersimpan sebagai model_YYYY-MM-DD.joblib dan pointer latest.",
      "Endpoint /score dan /score/batch mengembalikan is_anomaly, prediction, anomaly_score.",
    ],
  },
];

const roadmapItems: RoadmapItem[] = [
  { title: "Adaptive Threshold per Device", desc: "Baseline normal tiap perangkat bisa berbeda. Alert lebih akurat berdasarkan kebiasaan device.",         tag: "ML",           icon: Gauge      },
  { title: "Anomaly Explanation",           desc: "Dashboard menampilkan alasan anomali — latency naik, packet loss tinggi, atau traffic tak normal.",      tag: "Explainability", icon: LineChart  },
  { title: "Feedback Loop",                 desc: "Label admin — true anomaly atau false alarm — dipakai untuk evaluasi model dan tuning contamination.",   tag: "Human-in-loop",  icon: GitBranch  },
  { title: "Forecasting Capacity",          desc: "Data bandwidth, CPU, memory historis untuk prediksi kapasitas sebelum bottleneck terjadi.",              tag: "Prediction",   icon: Clock3     },
  { title: "Root Cause Correlation",        desc: "Alert dari beberapa device dikorelasikan dengan topology agar gangguan upstream cepat ditemukan.",       tag: "Topology",     icon: Network    },
  { title: "Automated Response",            desc: "Anomali kritis memicu runbook, notifikasi prioritas, eskalasi, atau integrasi ticketing otomatis.",      tag: "Automation",   icon: Bell       },
];

const bigStats: BigStat[] = [
  { num: "30d",   label: "Training window historis"    },
  { num: "4×",    label: "Jenis probe monitoring"      },
  { num: "v4.0",  label: "Versi API terkini"           },
];

const thinFeats: ThinFeat[] = [
  { name: "Ping Monitoring",  tag: "ICMP" },
  { name: "SNMP Polling",     tag: "v2c/v3" },
  { name: "HTTP Probe",       tag: "REST" },
  { name: "Interface Check",  tag: "LINK" },
  { name: "ML Anomaly",       tag: "AI" },
];

const mockLogs = [
  { time: "08:42:01", type: "ok",   label: "✓ PING OK",  msg: "core-router-01 · latency 2.1ms · loss 0%"           },
  { time: "08:42:03", type: "ok",   label: "✓ HTTP 200", msg: "api.internal · response 48ms · status OK"            },
  { time: "08:42:05", type: "warn", label: "⚠ ANOMALY",  msg: "switch-floor3 · latency spike 340ms · score −0.42"   },
  { time: "08:42:07", type: "ok",   label: "✓ SNMP OK",  msg: "server-db-02 · CPU 34% · mem 67% · bw 120Mbps"       },
];

const latencyVals  = [40,55,48,62,44,38,70,52,45,58,42,66,50,44,55,48,60,38,52,46];
const anomalyVals  = [30,20,25,18,22,80,75,30,28,24,20,18,22,70,26,22,20,18,30,24];

// ─── Styles (injected once) ────────────────────────────────────────────────────
const CSS = `
  @import url('https://fonts.googleapis.com/css2?family=DM+Sans:ital,opsz,wght@0,9..40,300;0,9..40,400;0,9..40,500;0,9..40,600;1,9..40,300&family=DM+Mono:wght@300;400;500&family=Playfair+Display:wght@400;500;700;900&display=swap');

  .scin-root {
    --bg:#04070f; --surface:#080e1a; --surface2:#0c1422;
    --border:rgba(255,255,255,0.07); --border-glow:rgba(52,211,153,0.25);
    --text:#f0f4ff; --muted:rgba(180,195,225,0.55); --subtle:rgba(140,160,200,0.35);
    --green:#34d399; --green-dim:rgba(52,211,153,0.12); --green-glow:rgba(52,211,153,0.06);
    --blue:#60a5fa;  --blue-dim:rgba(96,165,250,0.10);
    --amber:#fbbf24; --red:#f87171;
    --fd:'Playfair Display',Georgia,serif;
    --fb:'DM Sans',sans-serif;
    --fm:'DM Mono',monospace;
    background:var(--bg);color:var(--text);
    font-family:var(--fb);-webkit-font-smoothing:antialiased;
    overflow-x:hidden;position:relative;min-height:100vh;
  }

  /* Canvas */
  .scin-canvas{position:fixed;inset:0;z-index:0;opacity:.4;pointer-events:none}
  .scin-glow-tl{position:fixed;top:-20%;left:-10%;width:70vw;height:70vh;background:radial-gradient(ellipse,rgba(52,211,153,0.06),transparent 65%);z-index:0;pointer-events:none}
  .scin-glow-br{position:fixed;bottom:-20%;right:-10%;width:60vw;height:60vh;background:radial-gradient(ellipse,rgba(96,165,250,0.05),transparent 65%);z-index:0;pointer-events:none}

  /* Nav */
  .scin-nav{
    position:fixed;top:0;left:0;right:0;z-index:100;height:64px;
    display:flex;align-items:center;justify-content:space-between;padding:0 5vw;
    background:rgba(4,7,15,0.75);backdrop-filter:blur(20px) saturate(180%);
    border-bottom:1px solid var(--border);
  }
  .scin-nav-logo{display:flex;align-items:center;gap:12px}
  .scin-nav-icon{
    width:36px;height:36px;border-radius:10px;flex-shrink:0;
    background:linear-gradient(135deg,#0f3728,#1a5c3f);
    border:1px solid rgba(52,211,153,0.3);
    overflow:hidden;
    display:flex;align-items:center;justify-content:center;
  }
  .scin-logo-img{width:100%;height:100%;object-fit:contain;padding:4px}
  .scin-nav-name{font-size:.95rem;font-weight:600;letter-spacing:-.01em;line-height:1.2}
  .scin-nav-sub{font-family:var(--fm);font-size:.62rem;color:var(--muted);letter-spacing:.05em}
  .scin-nav-links{display:flex;align-items:center;gap:4px}
  .scin-nav-link{
    font-size:.8rem;font-weight:500;color:var(--muted);
    padding:6px 14px;border-radius:8px;text-decoration:none;
    transition:color .2s,background .2s;letter-spacing:.01em;
  }
  .scin-nav-link:hover{color:var(--text);background:rgba(255,255,255,0.05)}
  .scin-nav-cta{
    color:#030a05 !important;background:var(--green);font-weight:600 !important;
    border-radius:8px !important;
  }
  .scin-nav-cta:hover{background:#2fd48a !important}
  @media(max-width:640px){.scin-nav-links{display:none}}

  /* Hero */
  .scin-hero{
    position:relative;z-index:1;
    min-height:100svh;display:flex;flex-direction:column;
    align-items:center;justify-content:center;
    text-align:center;padding:120px 5vw 80px;
  }
  .scin-badge{
    display:inline-flex;align-items:center;gap:8px;
    border:1px solid rgba(52,211,153,0.3);background:rgba(52,211,153,0.07);
    border-radius:100px;padding:5px 14px;
    font-family:var(--fm);font-size:.68rem;color:var(--green);letter-spacing:.08em;
    margin-bottom:36px;
    opacity:0;animation:scin-fadeUp .8s .1s ease forwards;
  }
  .scin-badge-dot{
    width:6px;height:6px;border-radius:50%;background:var(--green);
    animation:scin-pulse 2s infinite;flex-shrink:0;
  }
  @keyframes scin-pulse{0%,100%{opacity:1;transform:scale(1)}50%{opacity:.5;transform:scale(.85)}}

  .scin-h1{
    font-family:var(--fd);
    font-size:clamp(3.2rem,9vw,8rem);font-weight:900;
    line-height:.95;letter-spacing:-.03em;
    background:linear-gradient(160deg,#f0f4ff 0%,#b8c8e8 40%,#60a5fa 70%,#34d399 100%);
    -webkit-background-clip:text;-webkit-text-fill-color:transparent;background-clip:text;
    opacity:0;animation:scin-fadeUp .9s .25s ease forwards;
  }
  .scin-h1-sub{
    font-family:var(--fd);font-size:clamp(1.3rem,3vw,2.2rem);
    font-weight:400;font-style:italic;color:var(--muted);margin-top:6px;
    opacity:0;animation:scin-fadeUp .9s .35s ease forwards;
  }
  .scin-hero-desc{
    max-width:640px;margin:28px auto 0;
    font-size:1rem;line-height:1.85;color:var(--muted);font-weight:300;
    opacity:0;animation:scin-fadeUp .9s .5s ease forwards;
  }
  .scin-hero-actions{
    margin-top:44px;display:flex;gap:12px;flex-wrap:wrap;justify-content:center;
    opacity:0;animation:scin-fadeUp .9s .65s ease forwards;
  }
  .scin-hero-pills{
    margin-top:32px;display:flex;gap:8px;flex-wrap:wrap;justify-content:center;
    opacity:0;animation:scin-fadeUp .9s .8s ease forwards;
  }
  .scin-pill{
    font-family:var(--fm);font-size:.63rem;letter-spacing:.06em;
    padding:5px 12px;border-radius:6px;
    border:1px solid var(--border);background:rgba(255,255,255,0.03);color:var(--subtle);
  }

  /* Buttons */
  .scin-btn{
    display:inline-flex;align-items:center;gap:8px;
    padding:13px 28px;border-radius:12px;font-size:.9rem;font-weight:600;
    text-decoration:none;cursor:pointer;border:none;font-family:var(--fb);
    transition:transform .2s,box-shadow .2s;letter-spacing:-.01em;
  }
  .scin-btn:hover{transform:translateY(-2px)}
  .scin-btn-primary{
    background:var(--green);color:#030a05;
    box-shadow:0 0 30px rgba(52,211,153,0.35),0 4px 16px rgba(0,0,0,.4);
  }
  .scin-btn-primary:hover{box-shadow:0 0 50px rgba(52,211,153,0.5),0 8px 24px rgba(0,0,0,.5)}
  .scin-btn-secondary{
    background:rgba(255,255,255,0.06);color:var(--text);
    border:1px solid var(--border);backdrop-filter:blur(10px);
  }
  .scin-btn-secondary:hover{background:rgba(255,255,255,0.1)}

  /* Mock dashboard */
  .scin-mock{
    margin:64px auto 0;width:100%;max-width:860px;
    border:1px solid var(--border);border-radius:24px;background:var(--surface);overflow:hidden;
    box-shadow:0 32px 80px rgba(0,0,0,.6),0 0 80px rgba(52,211,153,0.06);
    opacity:0;animation:scin-fadeUp 1s 1s ease forwards;
  }
  .scin-mock-bar{
    background:var(--surface2);padding:12px 20px;
    display:flex;align-items:center;gap:8px;border-bottom:1px solid var(--border);
  }
  .scin-mock-dots{display:flex;gap:6px}
  .scin-mock-dot{width:10px;height:10px;border-radius:50%}
  .scin-mock-title{font-family:var(--fm);font-size:.63rem;color:var(--muted);margin-left:8px;letter-spacing:.06em}
  .scin-mock-body{padding:20px;display:grid;grid-template-columns:repeat(4,1fr);gap:10px}
  @media(max-width:640px){.scin-mock-body{grid-template-columns:1fr 1fr}}
  .scin-mini{background:var(--bg);border:1px solid var(--border);border-radius:12px;padding:14px}
  .scin-mini-label{font-family:var(--fm);font-size:.56rem;letter-spacing:.1em;color:var(--subtle)}
  .scin-mini-val{font-size:.9rem;font-weight:600;margin-top:8px}
  .scin-mini-status{font-family:var(--fm);font-size:.6rem;color:var(--green);margin-top:4px}
  .scin-chart{background:var(--bg);border:1px solid var(--border);border-radius:12px;padding:14px;grid-column:span 2}
  .scin-chart-label{font-family:var(--fm);font-size:.6rem;color:var(--subtle);margin-bottom:12px}
  .scin-bars{display:flex;align-items:flex-end;gap:3px;height:56px}
  .scin-bar{flex:1;border-radius:3px 3px 0 0;min-width:6px}
  .scin-log{background:var(--bg);border:1px solid var(--border);border-radius:12px;padding:14px;grid-column:span 4}
  @media(max-width:640px){.scin-chart,.scin-log{grid-column:span 2}}
  .scin-log-line{font-family:var(--fm);font-size:.6rem;line-height:2;display:flex;gap:10px;flex-wrap:wrap}
  .scin-log-time{color:var(--subtle)}
  .scin-log-ok{color:var(--green)}
  .scin-log-warn{color:var(--amber)}
  .scin-log-err{color:var(--red)}

  /* Sections */
  .scin-segment{position:relative;z-index:1;padding:100px 5vw}
  .scin-w{max-width:1200px;margin:0 auto}
  .scin-eyebrow{font-family:var(--fm);font-size:.68rem;letter-spacing:.15em;text-transform:uppercase;color:var(--green);margin-bottom:16px}
  .scin-section-title{font-family:var(--fd);font-size:clamp(2rem,4.5vw,3.2rem);font-weight:700;line-height:1.1;letter-spacing:-.02em;max-width:700px}
  .scin-section-desc{margin-top:16px;max-width:620px;font-size:.95rem;line-height:1.85;color:var(--muted);font-weight:300}
  .scin-section-head{margin-bottom:56px}

  /* Status cards */
  .scin-status-wrap{position:relative;z-index:1;padding:0 5vw;margin-bottom:20px}
  .scin-status-grid{max-width:1200px;margin:0 auto;display:grid;grid-template-columns:repeat(4,1fr);gap:12px}
  @media(max-width:1024px){.scin-status-grid{grid-template-columns:1fr 1fr}}
  @media(max-width:640px){.scin-status-grid{grid-template-columns:1fr 1fr}}
  .scin-status-card{
    background:var(--surface);border:1px solid var(--border);border-radius:16px;padding:20px 24px;
    position:relative;overflow:hidden;transition:border-color .3s,transform .3s;
  }
  .scin-status-card:hover{border-color:var(--border-glow);transform:translateY(-3px)}
  .scin-status-label{font-family:var(--fm);font-size:.58rem;letter-spacing:.12em;color:var(--subtle)}
  .scin-status-val{font-size:.9rem;font-weight:600;margin-top:10px;white-space:nowrap;overflow:hidden;text-overflow:ellipsis}
  .scin-status-dot-row{display:flex;align-items:center;gap:6px;font-family:var(--fm);font-size:.65rem;margin-top:4px}
  .scin-dot{width:7px;height:7px;border-radius:50%;flex-shrink:0}
  .scin-dot-online{background:var(--green);box-shadow:0 0 8px var(--green)}
  .scin-dot-offline{background:var(--red)}
  .scin-dot-unknown{background:var(--amber)}

  /* Banner */
  .scin-banner-wrap{position:relative;z-index:1;padding:0 5vw;margin-bottom:60px}
  .scin-banner-inner{max-width:1200px;margin:0 auto}
  .scin-banner{border-radius:14px;padding:16px 22px;display:flex;align-items:center;gap:12px;font-size:.85rem}
  .scin-banner-online{border:1px solid rgba(52,211,153,0.25);background:rgba(52,211,153,0.07)}
  .scin-banner-offline{border:1px solid rgba(248,113,113,0.25);background:rgba(248,113,113,0.07)}
  .scin-banner-title{font-weight:600;margin-bottom:2px}
  .scin-banner-sub{font-family:var(--fm);font-size:.68rem;color:var(--muted)}

  /* Feature grid */
  .scin-feat-grid{display:grid;grid-template-columns:repeat(3,1fr);gap:16px}
  @media(max-width:1024px){.scin-feat-grid{grid-template-columns:1fr 1fr}}
  @media(max-width:640px){.scin-feat-grid{grid-template-columns:1fr}}
  .scin-feat-card{
    background:var(--surface);border:1px solid var(--border);border-radius:20px;padding:28px;
    transition:border-color .3s,transform .3s;position:relative;overflow:hidden;
  }
  .scin-feat-card::after{
    content:'';position:absolute;bottom:0;left:0;right:0;height:1px;
    background:linear-gradient(90deg,transparent,var(--green),transparent);opacity:0;transition:opacity .3s;
  }
  .scin-feat-card:hover{border-color:rgba(52,211,153,0.2);transform:translateY(-4px)}
  .scin-feat-card:hover::after{opacity:1}
  .scin-feat-icon{
    width:48px;height:48px;border-radius:14px;
    background:var(--green-dim);border:1px solid rgba(52,211,153,0.18);
    display:flex;align-items:center;justify-content:center;margin-bottom:20px;
  }
  .scin-feat-title{font-size:1rem;font-weight:600;letter-spacing:-.01em;margin-bottom:10px}
  .scin-feat-desc{font-size:.84rem;line-height:1.75;color:var(--muted)}

  /* Thin bar */
  .scin-thin-bar{
    display:flex;margin-top:16px;
    border:1px solid var(--border);border-radius:16px;overflow:hidden;
  }
  .scin-thin-item{flex:1;padding:22px 18px;border-right:1px solid var(--border);transition:background .2s}
  .scin-thin-item:last-child{border-right:none}
  .scin-thin-item:hover{background:rgba(255,255,255,0.03)}
  .scin-thin-name{font-size:.8rem;font-weight:600;margin-bottom:6px}
  .scin-thin-tag{
    font-family:var(--fm);font-size:.58rem;color:var(--green);
    padding:2px 8px;border-radius:4px;background:var(--green-dim);display:inline-block;
  }
  @media(max-width:640px){.scin-thin-bar{flex-wrap:wrap}}
  @media(max-width:640px){.scin-thin-item{flex:0 0 50%;border-bottom:1px solid var(--border)}}

  /* Big stats */
  .scin-stats-grid{
    display:grid;grid-template-columns:repeat(3,1fr);gap:1px;
    background:var(--border);border:1px solid var(--border);border-radius:20px;overflow:hidden;margin-top:56px;
  }
  .scin-stat{background:var(--surface);padding:36px 32px;text-align:center}
  .scin-stat-num{
    font-family:var(--fd);font-size:clamp(2.5rem,5vw,4rem);font-weight:900;
    background:linear-gradient(135deg,var(--green),var(--blue));
    -webkit-background-clip:text;-webkit-text-fill-color:transparent;background-clip:text;
  }
  .scin-stat-label{font-size:.82rem;color:var(--muted);margin-top:6px}
  @media(max-width:640px){.scin-stats-grid{grid-template-columns:1fr}}

  /* Detail cards */
  .scin-detail-grid{display:grid;grid-template-columns:repeat(3,1fr);gap:16px}
  @media(max-width:1024px){.scin-detail-grid{grid-template-columns:1fr 1fr}}
  @media(max-width:640px){.scin-detail-grid{grid-template-columns:1fr}}
  .scin-detail-card{
    background:var(--surface);border:1px solid var(--border);border-radius:20px;padding:30px;
    transition:border-color .3s,transform .3s;
  }
  .scin-detail-card:hover{border-color:rgba(96,165,250,0.25);transform:translateY(-4px)}
  .scin-detail-head{display:flex;align-items:flex-start;gap:16px;margin-bottom:24px}
  .scin-detail-icon{
    width:44px;height:44px;border-radius:12px;flex-shrink:0;
    background:var(--blue-dim);border:1px solid rgba(96,165,250,0.18);
    display:flex;align-items:center;justify-content:center;
  }
  .scin-detail-title{font-size:.95rem;font-weight:600;letter-spacing:-.01em;margin-bottom:6px}
  .scin-detail-desc{font-size:.8rem;line-height:1.7;color:var(--muted)}
  .scin-detail-points{list-style:none;display:flex;flex-direction:column;gap:12px}
  .scin-detail-points li{display:flex;gap:12px;font-size:.81rem;line-height:1.7;color:var(--muted)}
  .scin-detail-points li::before{
    content:'';width:5px;height:5px;border-radius:50%;
    background:var(--green);flex-shrink:0;margin-top:8px;
  }

  /* Pipeline */
  .scin-pipeline-grid{display:grid;grid-template-columns:repeat(4,1fr);gap:12px}
  @media(max-width:1024px){.scin-pipeline-grid{grid-template-columns:1fr 1fr}}
  @media(max-width:640px){.scin-pipeline-grid{grid-template-columns:1fr}}
  .scin-pipeline-card{
    background:var(--surface);border:1px solid var(--border);border-radius:20px;padding:28px;
    transition:border-color .3s,transform .3s;
  }
  .scin-pipeline-card:hover{border-color:rgba(52,211,153,0.25);transform:translateY(-4px)}
  .scin-pipeline-num{font-family:var(--fm);font-size:.62rem;letter-spacing:.1em;color:var(--subtle);margin-bottom:20px}
  .scin-pipeline-emoji{font-size:1.6rem;margin-bottom:12px}
  .scin-pipeline-title{font-size:.95rem;font-weight:600;margin-bottom:8px}
  .scin-pipeline-desc{font-size:.81rem;line-height:1.7;color:var(--muted)}

  /* ML section bg */
  .scin-ml-bg{
    background:linear-gradient(180deg,transparent,var(--surface2) 20%,var(--surface2) 80%,transparent);
    border-top:1px solid var(--border);border-bottom:1px solid var(--border);
  }

  /* Metric cards */
  .scin-metric-grid{display:grid;grid-template-columns:repeat(3,1fr);gap:16px;margin-top:24px}
  @media(max-width:640px){.scin-metric-grid{grid-template-columns:1fr}}
  .scin-metric-card{background:var(--surface);border:1px solid var(--border);border-radius:16px;padding:24px;text-align:center}
  .scin-metric-label{font-family:var(--fm);font-size:.6rem;letter-spacing:.12em;text-transform:uppercase;color:var(--subtle);margin-bottom:12px}
  .scin-metric-val{font-family:var(--fd);font-size:1.8rem;font-weight:700;letter-spacing:-.02em}
  .scin-metric-desc{font-size:.78rem;color:var(--muted);margin-top:8px;line-height:1.6}

  /* Roadmap */
  .scin-roadmap-grid{display:grid;grid-template-columns:repeat(3,1fr);gap:16px}
  @media(max-width:1024px){.scin-roadmap-grid{grid-template-columns:1fr 1fr}}
  @media(max-width:640px){.scin-roadmap-grid{grid-template-columns:1fr}}
  .scin-roadmap-card{
    background:var(--surface);border:1px solid var(--border);border-radius:20px;padding:28px;
    transition:border-color .3s,transform .3s;
  }
  .scin-roadmap-card:hover{border-color:rgba(251,191,36,0.2);transform:translateY(-4px)}
  .scin-roadmap-top{display:flex;align-items:center;justify-content:space-between;margin-bottom:20px}
  .scin-roadmap-tag{
    font-family:var(--fm);font-size:.58rem;letter-spacing:.1em;text-transform:uppercase;
    padding:4px 10px;border-radius:6px;
    background:rgba(251,191,36,0.08);border:1px solid rgba(251,191,36,0.2);color:rgba(251,191,36,0.8);
  }
  .scin-roadmap-title{font-size:.95rem;font-weight:600;letter-spacing:-.01em;margin-bottom:8px}
  .scin-roadmap-desc{font-size:.81rem;line-height:1.75;color:var(--muted)}

  /* Divider shimmer */
  .scin-shimmer{
    height:1px;margin:0 5vw;position:relative;z-index:1;
    background:linear-gradient(90deg,transparent 0%,var(--green) 50%,transparent 100%);
    background-size:200% 100%;animation:scin-shimmer 3s infinite;opacity:.35;
  }
  @keyframes scin-shimmer{from{background-position:200% 0}to{background-position:-200% 0}}

  /* Footer */
  .scin-footer{
    position:relative;z-index:1;padding:48px 5vw;
    border-top:1px solid var(--border);
    display:flex;align-items:center;justify-content:space-between;flex-wrap:wrap;gap:16px;
  }
  .scin-footer-brand{display:flex;align-items:center;gap:10px}
  .scin-footer-name{font-size:.9rem;font-weight:600}
  .scin-footer-sub{font-family:var(--fm);font-size:.63rem;color:var(--muted)}
  .scin-footer-copy{font-family:var(--fm);font-size:.63rem;color:var(--subtle)}

  /* Orb */
  .scin-orb{position:absolute;border-radius:50%;pointer-events:none;animation:scin-float 8s ease-in-out infinite}
  .scin-orb-1{width:300px;height:300px;right:-80px;top:10%;background:radial-gradient(circle,rgba(52,211,153,0.06),transparent 70%)}
  .scin-orb-2{width:400px;height:400px;left:-100px;bottom:5%;background:radial-gradient(circle,rgba(96,165,250,0.05),transparent 70%);animation-delay:-4s}
  @keyframes scin-float{0%,100%{transform:translateY(0)}50%{transform:translateY(-20px)}}

  /* Reveal */
  .scin-reveal{opacity:0;transform:translateY(28px);transition:opacity .7s ease,transform .7s ease}
  .scin-reveal.scin-visible{opacity:1;transform:translateY(0)}
  .scin-d1{transition-delay:.1s}.scin-d2{transition-delay:.2s}
  .scin-d3{transition-delay:.3s}.scin-d4{transition-delay:.4s}

  @keyframes scin-fadeUp{from{opacity:0;transform:translateY(24px)}to{opacity:1;transform:translateY(0)}}
`;

// ─── Canvas hook ───────────────────────────────────────────────────────────────
function useNetworkCanvas(canvasRef: React.RefObject<HTMLCanvasElement>) {
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d")!;
    type Node = { x: number; y: number; vx: number; vy: number; r: number };
    let nodes: Node[] = [];
    let animId: number;

    function resize() {
      canvas!.width = window.innerWidth;
      canvas!.height = window.innerHeight;
    }
    function init() {
      const n = Math.min(70, Math.floor((canvas!.width * canvas!.height) / 14000));
      nodes = Array.from({ length: n }, () => ({
        x: Math.random() * canvas!.width,
        y: Math.random() * canvas!.height,
        vx: (Math.random() - 0.5) * 0.4,
        vy: (Math.random() - 0.5) * 0.4,
        r: Math.random() * 2 + 1,
      }));
    }
    function draw() {
      ctx.clearRect(0, 0, canvas!.width, canvas!.height);
      nodes.forEach((n) => {
        n.x += n.vx; n.y += n.vy;
        if (n.x < 0 || n.x > canvas!.width) n.vx *= -1;
        if (n.y < 0 || n.y > canvas!.height) n.vy *= -1;
        ctx.beginPath(); ctx.arc(n.x, n.y, n.r, 0, Math.PI * 2);
        ctx.fillStyle = "rgba(52,211,153,0.5)"; ctx.fill();
      });
      for (let i = 0; i < nodes.length; i++) {
        for (let j = i + 1; j < nodes.length; j++) {
          const dx = nodes[i].x - nodes[j].x, dy = nodes[i].y - nodes[j].y;
          const d = Math.sqrt(dx * dx + dy * dy);
          if (d < 150) {
            ctx.beginPath(); ctx.moveTo(nodes[i].x, nodes[i].y); ctx.lineTo(nodes[j].x, nodes[j].y);
            ctx.strokeStyle = `rgba(52,211,153,${0.18 * (1 - d / 150)})`; ctx.lineWidth = 0.6; ctx.stroke();
          }
        }
      }
      animId = requestAnimationFrame(draw);
    }
    resize(); init(); draw();
    const onResize = () => { resize(); init(); };
    window.addEventListener("resize", onResize);
    return () => { cancelAnimationFrame(animId); window.removeEventListener("resize", onResize); };
  }, [canvasRef]);
}

// ─── Reveal hook ───────────────────────────────────────────────────────────────
function useReveal() {
  useEffect(() => {
    const obs = new IntersectionObserver(
      (entries) => entries.forEach((e) => { if (e.isIntersecting) { e.target.classList.add("scin-visible"); obs.unobserve(e.target); } }),
      { threshold: 0.12 }
    );
    document.querySelectorAll(".scin-reveal").forEach((el) => obs.observe(el));
    return () => obs.disconnect();
  }, []);
}

// ─── Sub-components ────────────────────────────────────────────────────────────
function StatusDot({ status }: { status: Status }) {
  const cls = status === "online" ? "scin-dot-online" : status === "unknown" ? "scin-dot-unknown" : "scin-dot-offline";
  const color = status === "online" ? "var(--green)" : status === "unknown" ? "var(--amber)" : "var(--red)";
  return (
    <div className="scin-status-dot-row" style={{ color }}>
      <span className={`scin-dot ${cls}`} /> {status}
    </div>
  );
}

function StatusTile({ card }: { card: StatusCard }) {
  const Icon = card.icon;
  return (
    <div className="scin-status-card">
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
        <div className="scin-status-label">{card.label}</div>
        <Icon className="h-4 w-4" style={{ color: "var(--subtle)" }} />
      </div>
      <div className="scin-status-val">{card.value}</div>
      <StatusDot status={card.status} />
    </div>
  );
}

function SectionHead({ eyebrow, title, desc }: { eyebrow: string; title: string; desc: string }) {
  return (
    <div className="scin-section-head scin-reveal">
      <div className="scin-eyebrow">{eyebrow}</div>
      <h2 className="scin-section-title">{title}</h2>
      <p className="scin-section-desc">{desc}</p>
    </div>
  );
}

function FeatCard({ card }: { card: FeatureCard }) {
  const Icon = card.icon;
  return (
    <div className="scin-feat-card scin-reveal">
      <div className="scin-feat-icon"><Icon className="h-5 w-5" style={{ color: "var(--green)" }} /></div>
      <div className="scin-feat-title">{card.title}</div>
      <p className="scin-feat-desc">{card.desc}</p>
    </div>
  );
}

function DetailCardUI({ card, delay = "" }: { card: DetailCard; delay?: string }) {
  const Icon = card.icon;
  return (
    <div className={`scin-detail-card scin-reveal ${delay}`}>
      <div className="scin-detail-head">
        <div className="scin-detail-icon"><Icon className="h-5 w-5" style={{ color: "var(--blue)" }} /></div>
        <div>
          <div className="scin-detail-title">{card.title}</div>
          <p className="scin-detail-desc">{card.desc}</p>
        </div>
      </div>
      <ul className="scin-detail-points">
        {card.points.map((p) => <li key={p}>{p}</li>)}
      </ul>
    </div>
  );
}

function PipelineCard({ step, delay = "" }: { step: typeof pipelineSteps[0]; delay?: string }) {
  return (
    <div className={`scin-pipeline-card scin-reveal ${delay}`}>
      <div className="scin-pipeline-num">STEP 0{pipelineSteps.indexOf(step) + 1}</div>
      <div className="scin-pipeline-emoji">{step.emoji}</div>
      <div className="scin-pipeline-title">{step.title}</div>
      <p className="scin-pipeline-desc">{step.desc}</p>
    </div>
  );
}

function RoadmapCard({ item, delay = "" }: { item: RoadmapItem; delay?: string }) {
  const Icon = item.icon;
  return (
    <div className={`scin-roadmap-card scin-reveal ${delay}`}>
      <div className="scin-roadmap-top">
        <span className="scin-roadmap-tag">{item.tag}</span>
        <Icon className="h-5 w-5" style={{ color: "var(--muted)" }} />
      </div>
      <div className="scin-roadmap-title">{item.title}</div>
      <p className="scin-roadmap-desc">{item.desc}</p>
    </div>
  );
}

function MiniChart({ vals, isAnomaly }: { vals: number[]; isAnomaly: boolean }) {
  const max = Math.max(...vals);
  return (
    <div className="scin-bars">
      {vals.map((v, i) => (
        <div
          key={i}
          className="scin-bar"
          style={{
            height: `${(v / max) * 100}%`,
            background: isAnomaly && v > 60
              ? "linear-gradient(to top,#f87171,rgba(248,113,113,0.3))"
              : "linear-gradient(to top,#34d399,rgba(52,211,153,0.3))",
          }}
        />
      ))}
    </div>
  );
}

// ─── Main component ────────────────────────────────────────────────────────────
function Landing() {
  const [online, setOnline] = useState<boolean | null>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  useNetworkCanvas(canvasRef);
  useReveal();

  useEffect(() => {
    let cancelled = false;
    pingBackend().then((ok) => { if (!cancelled) setOnline(ok); });
    return () => { cancelled = true; };
  }, []);

  // Inject styles once
  useEffect(() => {
    if (document.getElementById("scin-styles")) return;
    const s = document.createElement("style");
    s.id = "scin-styles"; s.textContent = CSS;
    document.head.appendChild(s);
    return () => { s.remove(); };
  }, []);

  const statusCards: StatusCard[] = [
    { label: "SERVICE", value: "SCINetwork API", status: online === null ? "unknown" : online ? "online" : "offline",     icon: Server   },
    { label: "MYSQL",   value: "scinetwork",     status: online === null ? "unknown" : online ? "online" : "unavailable", icon: Database },
    { label: "STACK",   value: "fiber + mysql",  status: online === null ? "unknown" : online ? "online" : "offline",     icon: Radio    },
    { label: "BACKEND", value: API_BASE_URL,     status: online === null ? "unknown" : online ? "online" : "offline",     icon: Activity },
  ];

  return (
    <div className="scin-root">
      <canvas ref={canvasRef} className="scin-canvas" />
      <div className="scin-glow-tl" />
      <div className="scin-glow-br" />

      {/* ── Nav ─────────────────────────────────────────────────────────────── */}
      <nav className="scin-nav">
        <div className="scin-nav-logo">
          <div className="scin-nav-icon">
            <img src="/logo.png" alt="SCINetwork logo" className="scin-logo-img" />
          </div>
          <div>
            <div className="scin-nav-name">SCINetwork</div>
            <div className="scin-nav-sub">Go Fiber · MySQL · ML</div>
          </div>
        </div>
        <div className="scin-nav-links">
          <a href="#technology"      className="scin-nav-link">Teknologi</a>
          <a href="#machine-learning" className="scin-nav-link">Machine Learning</a>
          <a href="#roadmap"         className="scin-nav-link">Roadmap</a>
          <Link to="/login"    className="scin-nav-link">Login</Link>
          <Link to="/register" className="scin-nav-link">Register</Link>
          <Link to="/dashboard" className="scin-nav-link scin-nav-cta">Dashboard →</Link>
        </div>
      </nav>

      {/* ── Hero ────────────────────────────────────────────────────────────── */}
      <section className="scin-hero">
        <div className="scin-orb scin-orb-1" />
        <div className="scin-orb scin-orb-2" />

        <div className="scin-badge">
          <span className="scin-badge-dot" />
          API v4.0 &nbsp;·&nbsp; ML-Ready Observability
        </div>

        <h1 className="scin-h1">SCINetwork</h1>
        <div className="scin-h1-sub">Observability tanpa batas.</div>

        <p className="scin-hero-desc">
          Dashboard monitoring jaringan yang menggabungkan inventory perangkat, real-time probing,
          time-series log, dan machine learning Isolation Forest — dalam satu platform terpadu.
        </p>

        <div className="scin-hero-actions">
          <Link to="/login" className="scin-btn scin-btn-primary">
            Masuk ke Dashboard <ArrowRight size={16} />
          </Link>
          <a href="#technology" className="scin-btn scin-btn-secondary">
            Pelajari Lebih Lanjut
          </a>
        </div>

        <div className="scin-hero-pills">
          {["Go Fiber API","React Dashboard","MySQL Config Store","ClickHouse Logs","FastAPI Sidecar","Isolation Forest"].map(p => (
            <span key={p} className="scin-pill">{p}</span>
          ))}
        </div>

        {/* Mock dashboard */}
        <div className="scin-mock">
          <div className="scin-mock-bar">
            <div className="scin-mock-dots">
              <div className="scin-mock-dot" style={{ background: "#f87171" }} />
              <div className="scin-mock-dot" style={{ background: "#fbbf24" }} />
              <div className="scin-mock-dot" style={{ background: "#34d399" }} />
            </div>
            <span className="scin-mock-title">SCINetwork — Observability Dashboard · v4.0</span>
          </div>
          <div className="scin-mock-body">
            {[
              { label: "SERVICE",    val: "SCINetwork API",  status: "online" },
              { label: "MYSQL",      val: "scinetwork",      status: "online" },
              { label: "ML SIDECAR", val: "FastAPI /score",  status: "online" },
              { label: "BACKEND",    val: API_BASE_URL,       status: "online" },
            ].map(c => (
              <div key={c.label} className="scin-mini">
                <div className="scin-mini-label">{c.label}</div>
                <div className="scin-mini-val">{c.val}</div>
                <div className="scin-mini-status">● {c.status}</div>
              </div>
            ))}
            <div className="scin-chart">
              <div className="scin-chart-label">LATENCY (ms) — last 24h</div>
              <MiniChart vals={latencyVals} isAnomaly={false} />
            </div>
            <div className="scin-chart">
              <div className="scin-chart-label">ANOMALY SCORE — Isolation Forest</div>
              <MiniChart vals={anomalyVals} isAnomaly={true} />
            </div>
            <div className="scin-log">
              {mockLogs.map((l, i) => (
                <div key={i} className="scin-log-line">
                  <span className="scin-log-time">2024-01-15 {l.time}</span>
                  <span className={l.type === "ok" ? "scin-log-ok" : l.type === "warn" ? "scin-log-warn" : "scin-log-err"}>{l.label}</span>
                  <span style={{ color: "var(--muted)" }}>{l.msg}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* ── Status cards ────────────────────────────────────────────────────── */}
      <div className="scin-status-wrap">
        <div className="scin-status-grid">
          {statusCards.map(c => <StatusTile key={c.label} card={c} />)}
        </div>
      </div>

      {/* ── Backend banner ───────────────────────────────────────────────────── */}
      {online !== null && (
        <div className="scin-banner-wrap">
          <div className="scin-banner-inner">
            <div className={`scin-banner ${online ? "scin-banner-online" : "scin-banner-offline"}`}>
              {online
                ? <Wifi className="h-5 w-5" style={{ color: "var(--green)", flexShrink: 0 }} />
                : <WifiOff className="h-5 w-5" style={{ color: "var(--red)", flexShrink: 0 }} />
              }
              <div>
                <div className="scin-banner-title">{online ? "Backend reachable" : "Backend belum bisa dijangkau"}</div>
                <div className="scin-banner-sub">
                  {online
                    ? `Connected to ${API_BASE_URL}`
                    : `Pastikan SCINetwork API berjalan di ${API_BASE_URL}`}
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ── Features ────────────────────────────────────────────────────────── */}
      <section className="scin-segment">
        <div className="scin-w">
          <SectionHead
            eyebrow="Kemampuan Utama"
            title="Semua yang dibutuhkan tim jaringan Anda"
            desc="Dari inventory perangkat hingga deteksi anomali berbasis machine learning — SCINetwork dirancang untuk tim yang serius soal uptime."
          />
          <div className="scin-feat-grid">
            {featureCards.map(c => <FeatCard key={c.title} card={c} />)}
          </div>

          <div className="scin-thin-bar scin-reveal scin-d1">
            {thinFeats.map(f => (
              <div key={f.name} className="scin-thin-item">
                <div className="scin-thin-name">{f.name}</div>
                <span className="scin-thin-tag">{f.tag}</span>
              </div>
            ))}
          </div>

          <div className="scin-stats-grid scin-reveal scin-d2">
            {bigStats.map(s => (
              <div key={s.num} className="scin-stat">
                <div className="scin-stat-num">{s.num}</div>
                <div className="scin-stat-label">{s.label}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      <div className="scin-shimmer" />

      {/* ── Technology ──────────────────────────────────────────────────────── */}
      <section className="scin-segment" id="technology">
        <div className="scin-w">
          <SectionHead
            eyebrow="Teknologi di dalamnya"
            title="Dibangun dari monitoring real-time sampai data historis"
            desc="Antarmuka, API, collector, database operasional, log time-series, dan fondasi machine learning — semuanya bekerja bersama."
          />
          <div className="scin-detail-grid">
            {technologyCards.map((c, i) => (
              <DetailCardUI key={c.title} card={c} delay={`scin-d${i + 1}`} />
            ))}
          </div>
        </div>
      </section>

      {/* ── Pipeline ────────────────────────────────────────────────────────── */}
      <section className="scin-segment" style={{ paddingTop: 0 }}>
        <div className="scin-w">
          <SectionHead
            eyebrow="Alur Data"
            title="Dari probe jaringan menjadi insight"
            desc="Setiap pengecekan jaringan berjalan sebagai data pipeline untuk dashboard, alert, audit, dan training model anomali."
          />
          <div className="scin-pipeline-grid">
            {pipelineSteps.map((s, i) => (
              <PipelineCard key={s.title} step={s} delay={`scin-d${i + 1}`} />
            ))}
          </div>
        </div>
      </section>

      <div className="scin-shimmer" />

      {/* ── Machine Learning ─────────────────────────────────────────────────── */}
      <section className="scin-segment scin-ml-bg" id="machine-learning">
        <div className="scin-w">
          <SectionHead
            eyebrow="Machine Learning"
            title="Isolation Forest untuk deteksi anomali jaringan"
            desc="Model ML fokus mencari pola yang jarang muncul dari log historis — timeout, lonjakan latency, packet loss, HTTP error, atau kombinasi metric tak normal."
          />
          <div className="scin-detail-grid">
            {mlCards.map((c, i) => (
              <DetailCardUI key={c.title} card={c} delay={`scin-d${i + 1}`} />
            ))}
          </div>
          <div className="scin-metric-grid">
            {[
              { label: "Training Window", val: "30 hari",   desc: "Default data historis untuk model harian."            },
              { label: "Detector",        val: "IForest",   desc: "Unsupervised anomaly detection dari sklearn."          },
              { label: "Serving",         val: "/score",    desc: "FastAPI untuk inference real-time dan batch."           },
            ].map(m => (
              <div key={m.label} className="scin-metric-card scin-reveal">
                <div className="scin-metric-label">{m.label}</div>
                <div className="scin-metric-val">{m.val}</div>
                <div className="scin-metric-desc">{m.desc}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      <div className="scin-shimmer" />

      {/* ── Roadmap ─────────────────────────────────────────────────────────── */}
      <section className="scin-segment" id="roadmap">
        <div className="scin-w">
          <SectionHead
            eyebrow="Fitur ke depannya"
            title="Roadmap ML dan observability"
            desc="Alert lebih kontekstual, model lebih mudah dievaluasi, dan dashboard lebih cepat membantu admin menemukan sumber gangguan."
          />
          <div className="scin-roadmap-grid">
            {roadmapItems.map((item, i) => (
              <RoadmapCard key={item.title} item={item} delay={`scin-d${(i % 3) + 1}`} />
            ))}
          </div>
        </div>
      </section>

      {/* ── Footer ──────────────────────────────────────────────────────────── */}
      <footer className="scin-footer">
        <div className="scin-footer-brand">
          <div className="scin-nav-icon">
            <img src="/logo.png" alt="SCINetwork logo" className="scin-logo-img" />
          </div>
          <div>
            <div className="scin-footer-name">SCINetwork</div>
            <div className="scin-footer-sub">Go Fiber + MySQL + Isolation Forest</div>
          </div>
        </div>
        <div className="scin-footer-copy">SCINetwork v4.0 · ML-ready observability · © 2024</div>
      </footer>
    </div>
  );
}
