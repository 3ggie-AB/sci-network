# Rencana Kerja Proyek SCINetwork (19 Minggu - Sampai Deployment)

Dokumen ini memuat rencana kerja dan linimasa proyek **SCINetwork** (Sistem Monitoring dan Deteksi Dini Gangguan Jaringan Kantor Syntax) selama **19 Minggu**, yang dirunut secara mendetail **sampai tahap Deployment di server lokal**.

Catatan Ketentuan Proyek:
1. **Tanpa Tahap UI/UX Design** (tidak ada pembuatan mockup/wireframe/Figma dari nol).
2. **Berakhir di Tahap Deployment & Operasionalisasi** (tanpa pembuatan laporan akademis/skripsi Bab 1–5).
3. **Penyampaian Rinci Per Minggu** (setiap minggu memiliki 1 fokus kegiatan dan 1 output spesifik, tidak digabung/disatukan).

---

## Breakdown Rinci Minggu demi Minggu (Minggu 1 – 19)

### Minggu 1: Observasi & Analisis Masalah Jaringan
- **Kegiatan**: Observasi langsung penanganan gangguan jaringan yang reaktif di Kantor Syntax dan wawancara dengan Tim IT mengenai kendala teknis harian.
- **Deliverable / Output**: Dokumen Analisis Masalah Gangguan Jaringan Kantor Syntax.

### Minggu 2: Pendataan & Inventory Perangkat Jaringan
- **Kegiatan**: Inventarisasi seluruh perangkat jaringan (Router, Switch, Gateway, Access Point, Server, Mikrotik) beserta alamat IP, tipe, dan kemampuan protokolnya (Ping, SNMP, HTTP).
- **Deliverable / Output**: Dokumen Inventory & Matriks Spesifikasi Perangkat Jaringan.

### Minggu 3: Pemetaan Divisi & Titik Lokasi Jaringan
- **Kegiatan**: Pemetaan infrastruktur jaringan berdasarkan unit kerja/divisi di Kantor Syntax (Marketing, IT, Keuangan, HR, Operasional, Direksi).
- **Deliverable / Output**: Dokumen Peta Divisi & Distribusi Titik Jaringan.

### Minggu 4: Penyusunan Business Requirement Document (BRD)
- **Kegiatan**: Perumusan kebutuhan bisnis, batasan proyek, kriteria sukses terukur, analisis risiko, serta alokasi hak akses stakeholder.
- **Deliverable / Output**: Dokumen Business Requirement Document (BRD) SCINetwork.

### Minggu 5: Penyusunan Software Requirement Specification (SRS)
- **Kegiatan**: Perumusan kebutuhan fungsional dan non-fungsional, *Use Case Specifications*, serta spesifikasi ambang batas (threshold) awal metrik jaringan.
- **Deliverable / Output**: Dokumen Software Requirement Specification (SRS) SCINetwork.

### Minggu 6: Perancangan Database Relasional (MySQL)
- **Kegiatan**: Desain tabel operasional (`users`, `roles`, `devices`, `divisions`, `alerts`, `feedback_tickets`), normalisasi database (3NF), dan pembuatan ERD.
- **Deliverable / Output**: File Skema DDL Script MySQL (`schema_mysql.sql`) & Diagram ERD.

### Minggu 7: Perancangan Database Log Columnar (ClickHouse)
- **Kegiatan**: Desain tabel `network_logs` berbasis MergeTree Engine, strategi *partitioning by date*, indexing metrik, dan penentuan kebijakan retensi data (TTL).
- **Deliverable / Output**: File Skema DDL Script ClickHouse (`schema_clickhouse.sql`) & Benchmark Storage Policy.

### Minggu 8: Perancangan Arsitektur Backend & Kontrak API
- **Kegiatan**: Perancangan Clean Architecture Backend Go Fiber (Repository-Service-Handler) dan penyusunan spesifikasi API OpenAPI/Swagger.
- **Deliverable / Output**: Dokumen Arsitektur Backend & File Spesifikasi API (`swagger.yaml`).

### Minggu 9: Setup Environment, Auth & RBAC Middleware Coding
- **Kegiatan**: Pengodingan boilerplate repositori Go Fiber, koneksi database MySQL & ClickHouse, modul Autentikasi (JWT), dan Middleware Authorization RBAC.
- **Deliverable / Output**: Source Code Backend Base, Modul Auth JWT, & Middleware RBAC.

### Minggu 10: Pengodingan REST API CRUD Management
- **Kegiatan**: Pengodingan endpoint REST API untuk CRUD Perangkat Jaringan, Pengelolaan Divisi, Lokasi, serta Pengelolaan User & Hak Akses Role.
- **Deliverable / Output**: Source Code REST API Management Perangkat, Divisi, & User.

### Minggu 11: Pengodingan Engine Scheduler Monitoring Concurrent
- **Kegiatan**: Pengodingan *Concurrent Monitoring Engine* berbasis Go Coroutines & Worker Pools untuk pemeriksaan berkala Ping/ICMP, SNMP v2c/v3, dan HTTP Checker.
- **Deliverable / Output**: Source Code Engine Scheduler Ping, SNMP, & HTTP Checker.

### Minggu 12: Pengodingan Log Ingestion Pipeline ClickHouse
- **Kegiatan**: Pengodingan *Batch Log Writer* dari Backend Go ke ClickHouse menggunakan in-memory channel queue, serta API query log historis.
- **Deliverable / Output**: Source Code Log Ingestion Pipeline & API Historis Log Jaringan.

### Minggu 13: Pengodingan Engine Alerting & Push Notification
- **Kegiatan**: Pengodingan Threshold Evaluator Engine (generasi alert, auto-resolve, acknowledge) serta pengodingan modul Browser Push Notification & Webhook.
- **Deliverable / Output**: Source Code Engine Alerting & Service Push Notification.

### Minggu 14: Development Machine Learning Isolation Forest Sidecar
- **Kegiatan**: Inisialisasi service Python FastAPI, pengodingan data pipeline dari ClickHouse, preprocessing metrik, dan training model Isolation Forest.
- **Deliverable / Output**: Source Code Service ML Sidecar Python & Model Isolation Forest Trained (`model.joblib`).

### Minggu 15: Integrasi ML Scoring API Sidecar & Auto-Retraining Cron
- **Kegiatan**: Integrasi API Backend Go Fiber dengan Endpoint Scoring FastAPI ML, serta pengodingan Cron Job untuk *daily retraining model* dari ClickHouse.
- **Deliverable / Output**: Source Code Integrasi ML Scoring API & Cron Job Auto-Retraining.

### Minggu 16: Pengodingan Modul Feedback Talent & Workflow Keluhan
- **Kegiatan**: Pengodingan REST API Pelaporan Keluhan Jaringan Talent (terkait divisi) dan workflow penanganan tiket oleh Teknisi IT (Open, In Progress, Resolved).
- **Deliverable / Output**: Source Code Modul Tiket Feedback & Workflow Keluhan Talent.

### Minggu 17: Integrasi Logika Backend dengan Dashboard Interface
- **Kegiatan**: Binding seluruh API Backend Go Fiber ke antarmuka Dashboard (real-time state update, polling/websocket widget status perangkat, alert list, & skor ML) tanpa alur desain UI/UX.
- **Deliverable / Output**: Aplikasi Web SCINetwork Terintegrasi End-to-End.

### Minggu 18: Pengujian Teknis Sistem & Evaluation Test
- **Kegiation**: Pelaksanaan Functional Testing (Black Box 10 Skenario Utama), RBAC Security Audit, Stress Test Ingestion ClickHouse, & ML Anomaly Accuracy Test.
- **Deliverable / Output**: Laporan Hasil Pengujian Teknis & Matrix Verifikasi Fungsional.

### Minggu 19: Deployment Live di Server Lokal, Tuning & Training
- **Kegiatan**: Deployment sistem SCINetwork ke server lokal Kantor Syntax (Docker Compose / Systemd Services), kalibrasi threshold alert, dan pelatihan operasional tim IT.
- **Deliverable / Output**: Sistem SCINetwork Live Operasional di Server Lokal Syntax & Dokumen Manual Operasional.

---

## Ringkasan Matriks Deliverable Minggu 1 – 19

| Minggu | Fokus Kegiatan utama | Deliverable / Output Spesifik |
| :---: | :--- | :--- |
| **Minggu 1** | Observasi & Analisis Masalah | Dokumen Analisis Masalah Gangguan Jaringan Syntax |
| **Minggu 2** | Pendataan & Inventory Perangkat | Dokumen Inventory & Matriks Spesifikasi Perangkat Jaringan |
| **Minggu 3** | Pemetaan Divisi & Titik Jaringan | Dokumen Peta Divisi & Distribusi Titik Jaringan |
| **Minggu 4** | Business Requirement Document | Dokumen Business Requirement Document (BRD) SCINetwork |
| **Minggu 5** | Software Requirement Specification | Dokumen Software Requirement Specification (SRS) SCINetwork |
| **Minggu 6** | Desain Database Relasional | File DDL Script MySQL (`schema_mysql.sql`) & Diagram ERD |
| **Minggu 7** | Desain Database Log Columnar | File DDL Script ClickHouse (`schema_clickhouse.sql`) & TTL Policy |
| **Minggu 8** | Arsitektur Backend & Specs API | Dokumen Arsitektur Backend & File `swagger.yaml` |
| **Minggu 9** | Setup Boilerplate, Auth & RBAC | Source Code Backend Base, Modul Auth JWT & RBAC Middleware |
| **Minggu 10**| REST API CRUD Management | Source Code REST API Management Perangkat, Divisi & User |
| **Minggu 11**| Engine Scheduler Monitoring | Source Code Engine Scheduler Ping, SNMP & HTTP Checker |
| **Minggu 12**| Ingestion Pipeline ClickHouse | Source Code Batch Log Ingestion Pipeline & Query API Log |
| **Minggu 13**| Engine Alerting & Notification | Source Code Engine Alerting & Service Push Notification |
| **Minggu 14**| ML Isolation Forest Sidecar | Source Code Python ML Sidecar & Trained Model File |
| **Minggu 15**| ML Scoring API & Auto-Retrain | Source Code Integrasi ML Scoring & Cron Auto-Retraining |
| **Minggu 16**| Modul Feedback Tiket Talent | Source Code Modul Feedback Ticket & Workflow Keluhan IT |
| **Minggu 17**| Integrasi Dashboard Interface | Aplikasi Web SCINetwork Terintegrasi End-to-End |
| **Minggu 18**| Pengujian Teknis Sistem | Laporan Hasil Pengujian Teknis & Verifikasi Skenario |
| **Minggu 19**| Deployment Server Lokal Syntax | Sistem SCINetwork Live Operasional & Manual Book |
