# Jurnal Kegiatan & Logbook Proyek SCINetwork
**Periode Pelaksanaan:** 4 Maret 2026 – 25 Juli 2026  
**Lokasi Proyek:** Kantor Syntax  
**Sistem:** SCINetwork (Monitoring & Deteksi Dini Gangguan Jaringan)

---

## Referensi Kode RKJ

| Kode | Kategori Bidang | Deskripsi / Cakupan |
| :---: | :--- | :--- |
| **RKJ-1** | Network Infrastructure Setup & Maintenance | Merancang, membangun, dan memelihara infrastruktur jaringan (router, switch, access point, FO, subnetting, troubleshooting). |
| **RKJ-2** | Server Administration & Virtualization | Pengelolaan server fisik/virtual, instalasi & konfigurasi DB Server, Web Server, backup/recovery, & monitoring log server. |
| **RKJ-3** | Network Security & Firewall Management | Keamanan jaringan, RBAC, access control list, security policy, audit akses, vulnerability assessment & patch management. |
| **RKJ-4** | Cloud Infrastructure & DevOps | Deployment aplikasi, containerization (Docker, Systemd), CI/CD pipeline, automation scripting, & server deployment. |
| **RKJ-5** | Network Monitoring & Performance Analysis | Monitoring traffic jaringan, latency, packet loss, bandwidth, threshold alert, dashboard monitoring, SLA & deteksi anomali. |
| **RKJ-6** | Wireless Network Design & Optimization | Desain & optimasi jaringan wireless enterprise, site survey, controller, coverage optimization, & WiFi security. |
| **RKJ-7** | Software Engineer | Pengembangan aplikasi software, pengodingan backend Go Fiber, REST API, integrasi frontend dashboard, & web editing. |

---

## Tabel Jurnal Kegiatan Rinci (4 Maret 2026 – 25 Juli 2026)

| No. | Tgl | Kegiatan | Kode | Output | Paraf Pembimbing Lapangan |
| :---: | :--- | :--- | :---: | :--- | :---: |
| 1. | 4 – 6 Maret 2026 | Diskusi Masalah Jaringan dan Sistem Permintaan di Kantor Syntax | RKJ-5 | Identifikasi kendala penanganan gangguan reaktif & kebutuhan sistem monitoring otomatis | |
| 2. | 7 Maret 2026 | Membantu Memasang Jaringan & Penataan Infrastruktur | RKJ-1 | Membantu implementasi kabel Fiber Optik & penataan perangkat server di kantor | |
| 3. | 9 – 14 Maret 2026 | Pendataan & Inventory Perangkat Jaringan | RKJ-1 | Dokumen matriks spesifikasi perangkat (Router, Switch, Server, AP, Mikrotik) | |
| 4. | 16 – 21 Maret 2026 | Pemetaan Divisi & Distribusi Titik Jaringan Kantor | RKJ-1 | Peta titik lokasi jaringan per unit kerja (Marketing, IT, Keuangan, HR, Ops, Direksi) | |
| 5. | 23 – 28 Maret 2026 | Penyusunan Business Requirement Document (BRD) | RKJ-5 | Dokumen BRD SCINetwork memuat analisis risiko & kriteria sukses proyek | |
| 6. | 30 Maret – 4 April 2026 | Penyusunan Software Requirement Specification (SRS) | RKJ-5 | Dokumen SRS memuat spesifikasi fungsional, non-fungsional & threshold metrik | |
| 7. | 6 – 11 April 2026 | Perancangan Database Relasional (MySQL) | RKJ-2 | File DDL Script MySQL (`schema_mysql.sql`) & Diagram ERD (3NF) | |
| 8. | 13 – 18 April 2026 | Perancangan Database Log Columnar (ClickHouse) | RKJ-2 | File DDL Script ClickHouse (`schema_clickhouse.sql`) & kebijakan retensi data (TTL) | |
| 9. | 20 – 25 April 2026 | Perancangan Arsitektur Backend & Kontrak API | RKJ-7 | Dokumen Clean Architecture Go Fiber & Spesifikasi OpenAPI Swagger (`swagger.yaml`) | |
| 10. | 27 April – 2 Mei 2026 | Setup Environment, Auth JWT & RBAC Middleware | RKJ-3 | Source Code Backend Base Go Fiber, Modul Autentikasi JWT & Middleware RBAC | |
| 11. | 4 – 9 Mei 2026 | Pembuatan REST API Management Perangkat & User | RKJ-7 | Source Code REST API CRUD Device, Division, Location & User Management | |
| 12. | 11 – 16 Mei 2026 | Pembuatan Engine Scheduler Monitoring Concurrent | RKJ-5 | Source Code Monitoring Engine Go Coroutines (ICMP Ping, SNMP v2c/v3, HTTP Check) | |
| 13. | 18 – 23 Mei 2026 | Development High-Throughput Log Ingestion ClickHouse | RKJ-2 | Source Code Batch Log Ingestion Pipeline ClickHouse & API Query Log Historis | |
| 14. | 25 – 30 Mei 2026 | Development Engine Alerting & Push Notification | RKJ-5 | Source Code Threshold Evaluator Engine & Service Browser Push Notification | |
| 15. | 1 – 6 Juni 2026 | Development Machine Learning Isolation Forest Sidecar | RKJ-5 | Service Python FastAPI ML & Trained Model Isolation Forest (`model.joblib`) | |
| 16. | 8 – 13 Juni 2026 | Integrasi ML Scoring API & Auto-Retraining Cron | RKJ-4 | Endpoint Scoring API ML Sidecar & Cron Job Daily Retraining dari ClickHouse | |
| 17. | 15 – 20 Juni 2026 | Development Modul Tiket Feedback & Survey Keluhan | RKJ-7 | REST API Tiket Feedback Talent & Workflow Penanganan Keluhan oleh Teknisi IT | |
| 18. | 22 – 27 Juni 2026 | Integrasi Logika Backend dengan Dashboard Interface | RKJ-7 | Aplikasi Web SCINetwork Terintegrasi End-to-End (Real-time State & Polling Widget) | |
| 19. | 29 Juni – 4 Juli 2026 | Pengujian Teknis Sistem (Functional, Security & Load) | RKJ-3 | Laporan Hasil Functional Test, RBAC Security Audit, Stress Test Ingestion & ML Accuracy | |
| 20. | 6 – 11 Juli 2026 | Simulasi Gangguan Real-World & Evaluasi UAT | RKJ-5 | Eksekusi Simulasi Gangguan Real, Pengukuran Metrik Teknis & Rekap Kuesioner UAT | |
| 21. | 13 – 18 Juli 2026 | Deployment Live di Server Lokal Kantor Syntax | RKJ-4 | SCINetwork Live Operasional di Server Lokal (Docker Compose / Systemd Services) | |
| 22. | 20 – 25 Juli 2026 | Tuning Threshold, User Training & Serah Terima | RKJ-1 | Kalibrasi Threshold Baseline, Pelatihan Tim IT & Dokumen Manual Operasional System | |
