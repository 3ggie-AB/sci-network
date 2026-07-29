# Paket Dokumen Proyek SCINetwork

## Analisis Singkat Proyek

SCINetwork adalah sistem monitoring jaringan berbasis dashboard yang terdiri dari backend Go Fiber, frontend React, database MySQL untuk data operasional, ClickHouse untuk log jaringan, serta modul machine learning Isolation Forest untuk deteksi anomali. Fitur utama yang sudah terlihat pada project meliputi manajemen perangkat jaringan, scheduler monitoring, ping/ICMP, SNMP, HTTP checker, alert otomatis, browser push notification, role-based access control, histori log jaringan, statistik dashboard, dan kanal feedback/keluhan talent.

Masalah nyata yang dipilih adalah keterlambatan deteksi dan penanganan gangguan jaringan di lingkungan Kantor Syntax. Jaringan kantor digunakan oleh banyak divisi, seperti Marketing, IT, Keuangan, HR, Operasional, dan Direksi, sehingga gangguan koneksi dapat memengaruhi proses kerja lintas divisi. Pada praktiknya, tim IT sering mengetahui masalah setelah talent menyampaikan keluhan, sementara data teknis seperti latency, packet loss, response time, availability, status SNMP, dan histori gangguan belum selalu tersaji secara terpadu. SCINetwork diposisikan sebagai artefak solusi untuk membantu tim IT memonitor kondisi jaringan secara proaktif, mengurangi waktu deteksi gangguan, dan menyediakan dasar data untuk menentukan prioritas perbaikan.

## 1. Draft Kesepakatan Proyek

### Judul Proyek

Implementasi SCINetwork sebagai Sistem Monitoring dan Deteksi Dini Gangguan Jaringan di Lingkungan Kantor Syntax.

### Latar Belakang

Koneksi jaringan di Kantor Syntax digunakan untuk menunjang komunikasi, pemasaran digital, pengelolaan keuangan, pengembangan aplikasi, rapat manajemen, akses internet, serta penggunaan berbagai aplikasi internal perusahaan. Gangguan seperti perangkat mati, packet loss tinggi, latency meningkat, HTTP service tidak merespons, atau interface jaringan terputus dapat menghambat aktivitas talent dari berbagai divisi. Ketika monitoring masih dilakukan secara manual atau hanya berdasarkan keluhan talent, proses identifikasi masalah menjadi lambat dan histori gangguan tidak terdokumentasi dengan baik.

### Tujuan

Membangun dan menguji sistem monitoring jaringan yang mampu memantau perangkat secara berkala, mencatat metrik jaringan, memberi alert otomatis, menampilkan dashboard kondisi jaringan, serta menerima feedback dari talent.

### Ruang Lingkup

Ruang lingkup proyek mencakup:

- Pendaftaran dan pengelolaan perangkat jaringan seperti router, switch, gateway, server, dan perangkat Mikrotik.
- Pemetaan perangkat dan titik jaringan berdasarkan area kerja atau divisi, seperti Marketing, IT, Keuangan, HR, Operasional, dan Direksi.
- Monitoring otomatis menggunakan ping, SNMP, HTTP checker, dan pemeriksaan interface lokal.
- Penyimpanan data operasional pada MySQL dan log monitoring pada ClickHouse.
- Dashboard ringkasan availability, latency, packet loss, jitter, response time, perangkat, alert, storage, dan feedback.
- Alert otomatis berdasarkan threshold availability, packet loss, latency, response time, HTTP status, SNMP, dan interface.
- Notifikasi melalui browser push dan opsi integrasi webhook, Telegram, atau email.
- Pengelolaan role pengguna: superadmin, admin IT, teknisi IT, direksi/head divisi, dan talent.
- Modul machine learning Isolation Forest untuk mendeteksi anomali dari histori network logs.

Di luar ruang lingkup:

- Penggantian perangkat jaringan fisik.
- Konfigurasi lengkap firewall, VLAN, atau routing produksi.
- Integrasi penuh dengan sistem helpdesk eksternal.
- Jaminan eliminasi seluruh gangguan jaringan, karena sistem berfokus pada monitoring dan deteksi.

### Stakeholder

- Admin IT: mengelola user, perangkat, log, dan konfigurasi sistem.
- Teknisi IT: memantau perangkat, menjalankan network tools, dan menindaklanjuti alert.
- Direksi: melihat ringkasan kondisi jaringan, tren gangguan, kualitas layanan IT, dan dampaknya terhadap operasional perusahaan.
- Head Divisi: melihat status jaringan serta gangguan yang memengaruhi aktivitas divisinya.
- Talent lintas divisi: mengirim feedback atau keluhan jaringan dari unit kerja masing-masing, seperti Marketing, IT, Keuangan, HR, Operasional, dan divisi lainnya.

### Deliverables

- Aplikasi dashboard SCINetwork.
- Backend API monitoring, device management, alert, feedback, dan user management.
- Database MySQL dan ClickHouse beserta skema migrasi.
- Scheduler monitoring otomatis.
- Modul deteksi anomali Isolation Forest beserta sidecar inference.
- Dokumentasi API dan cara menjalankan sistem.
- Laporan hasil pengujian teknis dan penerimaan pengguna sistem.

### Batas Waktu Usulan (Rencana Kerja 19 Minggu - Sampai Deployment)

Durasi proyek ditetapkan selama **19 minggu** tanpa alokasi tahap UI/UX design (tidak buat wireframe/Figma dari nol) dan **berakhir di tahap Deployment & Operasionalisasi** (tanpa pembuatan dokumen laporan akademis/skripsi). Setiap minggu dirunut secara terpisah dengan 1 fokus kegiatan dan 1 output spesifik:

- **Minggu 1**: Dokumen Analisis Masalah Gangguan Jaringan Kantor Syntax.
- **Minggu 2**: Dokumen Inventory & Matriks Spesifikasi Perangkat Jaringan.
- **Minggu 3**: Dokumen Peta Divisi & Distribusi Titik Jaringan.
- **Minggu 4**: Dokumen Business Requirement Document (BRD) SCINetwork.
- **Minggu 5**: Dokumen Software Requirement Specification (SRS) SCINetwork.
- **Minggu 6**: File DDL Script MySQL (`schema_mysql.sql`) & Diagram ERD.
- **Minggu 7**: File DDL Script ClickHouse (`schema_clickhouse.sql`) & TTL Policy.
- **Minggu 8**: Dokumen Arsitektur Backend & File Spesifikasi API (`swagger.yaml`).
- **Minggu 9**: Source Code Backend Base Go Fiber, Modul Auth JWT & RBAC Middleware.
- **Minggu 10**: Source Code REST API Management Perangkat, Divisi & User.
- **Minggu 11**: Source Code Engine Scheduler Ping, SNMP & HTTP Checker.
- **Minggu 12**: Source Code Batch Log Ingestion Pipeline ClickHouse & API Log.
- **Minggu 13**: Source Code Engine Alerting & Service Push Notification.
- **Minggu 14**: Source Code Python ML Isolation Forest Sidecar & Model File.
- **Minggu 15**: Source Code Integrasi ML Scoring API & Cron Auto-Retraining.
- **Minggu 16**: Source Code Modul Tiket Feedback & Workflow Keluhan IT.
- **Minggu 17**: Aplikasi Web SCINetwork Terintegrasi End-to-End.
- **Minggu 18**: Laporan Hasil Pengujian Teknis (Functional, Security, Stress, ML Test).
- **Minggu 19**: Sistem SCINetwork Live Operasional di Server Lokal Syntax & Manual Book.

*Rincian lengkap rencana kerja 19 minggu dirunut per minggu dapat dilihat pada [rencana-kerja-19-minggu-scinetwork.md](file:///home/egi/Documents/sci-network/docs/rencana-kerja-19-minggu-scinetwork.md).*

## 2. Business Requirement Document

### Ringkasan Bisnis

Tim IT Kantor Syntax membutuhkan sistem yang dapat memberikan visibilitas real-time terhadap kondisi jaringan yang digunakan oleh seluruh divisi. Sistem harus membantu teknisi mengetahui gangguan lebih cepat, mencatat histori performa jaringan, mengidentifikasi divisi atau area yang terdampak, dan menyediakan dashboard yang mudah dipahami oleh direksi maupun head divisi. SCINetwork menjawab kebutuhan tersebut melalui pemantauan perangkat, alert otomatis, pencatatan log, kanal feedback talent, dan deteksi anomali berbasis machine learning.

### Masalah Bisnis

Masalah utama adalah proses deteksi gangguan jaringan yang masih reaktif. Gangguan sering diketahui setelah talent melapor, bukan dari sistem pemantauan otomatis. Dampaknya adalah waktu respons teknisi lebih lama, status perangkat sulit dipantau secara konsisten, data histori performa tidak lengkap, dan evaluasi kualitas jaringan kurang berbasis metrik.

### Tujuan Bisnis

Tujuan bisnis proyek ini adalah meningkatkan kecepatan deteksi gangguan, memperbaiki proses penanganan insiden, dan menyediakan data performa jaringan yang dapat digunakan untuk evaluasi layanan IT.

### Kebutuhan Bisnis

| Kode | Kebutuhan Bisnis | Penjelasan |
| --- | --- | --- |
| BR-01 | Monitoring perangkat terpusat | Sistem harus menampilkan daftar perangkat, host/IP, tipe perangkat, status terakhir, dan konfigurasi monitoring. |
| BR-02 | Pemeriksaan otomatis berkala | Sistem harus menjalankan ping, SNMP, HTTP check, dan interface check sesuai interval yang dapat dikonfigurasi. |
| BR-03 | Alert otomatis | Sistem harus membuat alert saat metrik melewati threshold, seperti packet loss, latency, response time, availability, HTTP error, atau SNMP failure. |
| BR-04 | Dashboard manajemen | Sistem harus menyediakan ringkasan perangkat, open alert, availability, feedback, latency, packet loss, jitter, response time, dan histori performa. |
| BR-05 | Hak akses berbasis role | Sistem harus membatasi akses fitur berdasarkan role superadmin, admin IT, teknisi IT, direksi/head divisi, dan talent. |
| BR-06 | Pengelolaan divisi | Data pengguna, perangkat, lokasi, dan feedback harus dapat dikaitkan dengan divisi seperti Marketing, IT, Keuangan, HR, Operasional, Direksi, dan divisi lainnya. |
| BR-07 | Kanal feedback talent | Sistem harus memungkinkan talent mengirim keluhan jaringan dan memungkinkan tim IT menindaklanjuti statusnya. |
| BR-08 | Penyimpanan histori log | Sistem harus menyimpan log monitoring untuk kebutuhan audit, analisis tren, dan training model anomali. |
| BR-09 | Deteksi anomali | Sistem harus mampu memberi skor anomali dari data monitoring menggunakan model Isolation Forest. |
| BR-10 | Notifikasi gangguan | Sistem harus mendukung browser push notification dan opsi integrasi webhook, Telegram, atau email. |

### Kebutuhan Fungsional

- Pengguna dapat login dan mendapatkan akses sesuai role.
- Setiap talent dapat memiliki informasi divisi agar feedback, perangkat terdampak, dan laporan gangguan dapat dikelompokkan berdasarkan unit kerja.
- Admin/teknisi dapat menambah, mengubah, menghapus, dan melihat perangkat monitoring.
- Scheduler dapat menjalankan pengecekan perangkat secara otomatis.
- Sistem dapat menyimpan hasil monitoring ke log jaringan.
- Sistem dapat membuat, menampilkan, acknowledge, resolve, memberi catatan, dan menghapus alert.
- Talent dapat membuat feedback/keluhan, sementara tim IT dan role berwenang dapat mengelola tindak lanjutnya.
- Dashboard dapat menampilkan statistik dan histori jaringan berdasarkan rentang waktu.
- Modul ML dapat melakukan training harian dan menyediakan endpoint scoring anomali.

### Kebutuhan Non-Fungsional

- Availability aplikasi target minimal 95% selama masa uji coba.
- Latency dashboard untuk memuat data ringkasan maksimal 3 detik pada jaringan lokal.
- Interval scheduler default maksimal 60 detik untuk pemeriksaan umum.
- Data monitoring harus tersimpan dengan timestamp agar dapat ditelusuri.
- Akses API harus dilindungi JWT.
- Hak akses harus konsisten dengan permission pada masing-masing role.

### Kriteria Sukses Terukur

| Kriteria | Target Keberhasilan |
| --- | --- |
| Kecepatan deteksi gangguan | Gangguan perangkat down atau HTTP timeout terdeteksi maksimal 1 interval scheduler setelah terjadi. |
| Akurasi alert threshold | Minimal 90% skenario threshold menghasilkan alert yang sesuai severity-nya. |
| Waktu tampil dashboard | Halaman overview memuat statistik utama dalam waktu maksimal 3 detik pada uji lokal. |
| Kelengkapan log | Minimal 95% hasil pengecekan otomatis tercatat di network logs. |
| Penerimaan pengguna | Skor rata-rata kuesioner penerimaan minimal 4 dari skala 5. |
| Kemudahan teknisi | Minimal 80% responden teknisi menyatakan sistem membantu menemukan sumber gangguan lebih cepat. |
| Deteksi anomali ML | Model mampu menandai pola ekstrem seperti timeout, packet loss tinggi, atau response time sangat tinggi sebagai anomali pada minimal 80% skenario uji. |

### Risiko dan Mitigasi

| Risiko | Dampak | Mitigasi |
| --- | --- | --- |
| SNMP tidak aktif di perangkat | Metrik perangkat tidak lengkap | Gunakan ping/HTTP sebagai fallback dan aktifkan SNMP bertahap. |
| Data historis belum cukup untuk ML | Model anomali kurang stabil | Gunakan data simulasi awal dan training ulang harian setelah log terkumpul. |
| Threshold tidak sesuai kondisi jaringan | Alert terlalu banyak atau terlalu sedikit | Lakukan kalibrasi threshold berdasarkan observasi 1-2 minggu. |
| User mengabaikan alert | Gangguan tetap lambat ditangani | Gunakan status acknowledge/resolve dan notifikasi push. |
| Hak akses salah konfigurasi | Risiko keamanan operasional | Uji setiap role menggunakan skenario permission. |

## 3. Rumusan Masalah Penelitian

### Masalah Proyek

Tim IT membutuhkan sistem yang dapat mendeteksi gangguan jaringan secara lebih cepat dan berbasis data. Proyek SCINetwork bertujuan membangun artefak berupa sistem monitoring, alert, dashboard, feedback, dan deteksi anomali untuk mengurangi pola penanganan gangguan yang reaktif.

### Rumusan Masalah Penelitian Utama

Bagaimana merancang dan mengevaluasi sistem monitoring jaringan berbasis dashboard, alert otomatis, dan deteksi anomali untuk mempercepat deteksi gangguan jaringan di lingkungan Kantor Syntax?

### Pertanyaan Penelitian Turunan

- Bagaimana SCINetwork dapat mengintegrasikan ping, SNMP, HTTP checker, dan log historis untuk memantau kondisi perangkat jaringan?
- Sejauh mana alert berbasis threshold dapat mempercepat deteksi gangguan dibanding proses berbasis keluhan talent?
- Bagaimana model Isolation Forest dapat digunakan untuk mengidentifikasi anomali dari metrik jaringan seperti latency, packet loss, response time, jitter, status HTTP, CPU, memory, dan bandwidth?
- Bagaimana informasi divisi dapat membantu tim IT memetakan sumber keluhan dan dampak gangguan jaringan terhadap operasional Kantor Syntax?
- Bagaimana tingkat penerimaan teknisi dan talent terhadap dashboard monitoring, alert, dan fitur feedback SCINetwork?

### Objek Penelitian

Objek penelitian adalah proses monitoring dan penanganan gangguan jaringan di lingkungan Kantor Syntax yang digunakan oleh berbagai divisi.

### Subjek Penelitian

Subjek penelitian meliputi teknisi IT, admin jaringan, direksi atau head divisi, serta talent pengguna layanan jaringan dari divisi Marketing, IT, Keuangan, HR, Operasional, dan divisi lainnya.

### Artefak Penelitian

Artefak penelitian adalah sistem SCINetwork yang terdiri dari dashboard frontend, backend API, scheduler monitoring, database log, alerting service, feedback module, dan sidecar machine learning Isolation Forest.

## 4. Rancangan Metode Design Science Research

Metode yang digunakan adalah Design Science Research (DSR) karena penelitian berfokus pada perancangan, pembangunan, dan evaluasi artefak sistem informasi untuk menyelesaikan masalah nyata.

### Tahap 1: Identifikasi Masalah dan Motivasi

Kegiatan:

- Mengamati proses monitoring jaringan yang masih manual atau reaktif.
- Mengidentifikasi dampak gangguan jaringan terhadap aktivitas operasional dan proses kerja lintas divisi di Kantor Syntax.
- Menganalisis kebutuhan stakeholder IT, direksi, head divisi, dan talent pengguna jaringan.

Output:

- Daftar masalah utama.
- Daftar stakeholder.
- Justifikasi kebutuhan sistem monitoring otomatis.

### Tahap 2: Penetapan Tujuan Solusi

Kegiatan:

- Menentukan target sistem, seperti deteksi gangguan lebih cepat, dashboard terpusat, histori log, alert otomatis, dan feedback talent.
- Menetapkan metrik sukses yang terukur.

Output:

- Tujuan proyek.
- Kriteria sukses teknis dan penerimaan pengguna.
- Prioritas fitur.

### Tahap 3: Desain dan Pengembangan Artefak

Kegiatan:

- Merancang arsitektur SCINetwork: frontend, backend, database, scheduler, alert service, dan ML sidecar.
- Mengembangkan fitur device management, network tools, dashboard, feedback, alert, RBAC, push notification, dan Isolation Forest.
- Menentukan threshold awal untuk packet loss, latency, response time, availability, HTTP status, dan SNMP.

Output artefak:

- Dashboard monitoring.
- Backend API.
- Database MySQL dan ClickHouse.
- Scheduler monitoring.
- Alerting service.
- Modul feedback.
- Modul ML Isolation Forest.

### Tahap 4: Demonstrasi

Kegiatan:

- Mendaftarkan beberapa perangkat contoh seperti router, switch, server, gateway, access point, dan endpoint HTTP yang digunakan pada area atau divisi berbeda di Kantor Syntax.
- Menjalankan scheduler monitoring pada interval tertentu.
- Mensimulasikan gangguan, misalnya perangkat tidak merespons ping, HTTP timeout, packet loss tinggi, latency tinggi, atau service HTTP error.
- Menunjukkan dashboard, alert, log, dan feedback kepada stakeholder.

Output:

- Skenario demonstrasi.
- Screenshot atau catatan hasil demo.
- Bukti sistem menghasilkan alert dan log sesuai kondisi.

### Tahap 5: Evaluasi

Kegiatan:

- Menguji fungsi monitoring, alert, role access, feedback, dan dashboard.
- Mengukur metrik teknis seperti waktu deteksi, kelengkapan log, response time dashboard, dan kesesuaian alert.
- Menguji model Isolation Forest menggunakan data historis atau data simulasi.
- Menyebarkan kuesioner penerimaan kepada teknisi IT, admin IT, head divisi, dan talent.

Output:

- Hasil pengujian teknis.
- Hasil kuesioner penerimaan.
- Analisis kesenjangan terhadap kriteria sukses.

### Tahap 6: Komunikasi

Kegiatan:

- Menyusun laporan akhir proyek dan penelitian.
- Menjelaskan hubungan masalah, artefak, metode, hasil evaluasi, dan rekomendasi pengembangan.
- Mempresentasikan sistem kepada dosen/pembimbing serta stakeholder Kantor Syntax, seperti tim IT, head divisi, dan direksi.

Output:

- Laporan akhir.
- Slide presentasi.
- Dokumentasi penggunaan dan rekomendasi implementasi.

## 5. Rencana Pengujian dan Instrumen

### Tujuan Pengujian

Pengujian bertujuan memastikan SCINetwork dapat menjalankan fungsi monitoring jaringan, menghasilkan alert yang benar, menyimpan log, membatasi akses sesuai role, menampilkan dashboard, menerima feedback, dan memberikan hasil deteksi anomali yang layak.

### Skenario Pengujian Fungsional

| Kode | Skenario | Langkah Uji | Hasil yang Diharapkan |
| --- | --- | --- | --- |
| FT-01 | Login pengguna | Login dengan akun valid dan tidak valid | Akun valid mendapat token, akun tidak valid ditolak. |
| FT-02 | Manajemen perangkat | Tambah, ubah, lihat, dan hapus perangkat | Data perangkat tersimpan dan tampil di dashboard. |
| FT-03 | Scheduler monitoring | Aktifkan monitoring perangkat | Sistem menjalankan ping/SNMP/HTTP sesuai interval. |
| FT-04 | Alert availability | Simulasikan host tidak merespons ping | Alert critical availability dibuat. |
| FT-05 | Alert packet loss | Simulasikan packet loss melebihi threshold | Alert warning/critical sesuai ambang batas. |
| FT-06 | Alert HTTP | Simulasikan HTTP timeout atau status 500 | Alert HTTP availability/status dibuat. |
| FT-07 | Acknowledge dan resolve alert | Teknisi melakukan ack dan resolve | Status alert berubah sesuai aksi. |
| FT-08 | Feedback talent | Talent dari salah satu divisi membuat keluhan jaringan | Feedback tercatat, menyimpan informasi divisi pelapor, dan dapat ditindaklanjuti oleh tim IT. |
| FT-09 | RBAC | Coba akses fitur dengan role berbeda | Akses ditolak atau diterima sesuai permission. |
| FT-10 | ML scoring | Kirim data metrik normal dan ekstrem ke sidecar | Data ekstrem diberi label anomali. |

### Metrik Teknis

| Metrik | Definisi | Cara Ukur | Target |
| --- | --- | --- | --- |
| Time to Detect | Waktu dari gangguan disimulasikan sampai alert muncul | Catat timestamp gangguan dan timestamp alert | Maksimal 1 interval scheduler. |
| Alert Accuracy | Kesesuaian alert dengan skenario threshold | Jumlah alert benar dibagi total skenario | Minimal 90%. |
| Log Completeness | Persentase hasil monitoring yang masuk ke log | Bandingkan jumlah check dengan jumlah log | Minimal 95%. |
| Dashboard Load Time | Waktu halaman overview memuat data utama | Browser devtools atau stopwatch uji lokal | Maksimal 3 detik. |
| API Success Rate | Persentase request API berhasil pada skenario uji | Jumlah request 2xx dibagi total request | Minimal 95%. |
| RBAC Correctness | Kesesuaian akses role terhadap permission | Test matrix role dan endpoint | 100% sesuai permission. |
| ML Anomaly Detection Rate | Kemampuan model menandai skenario ekstrem | Jumlah anomali terdeteksi dibagi total data ekstrem | Minimal 80%. |
| False Positive ML | Data normal yang salah ditandai anomali | Jumlah false positive dibagi total data normal | Maksimal 20% pada uji awal. |

### Instrumen Observasi Teknis

Format lembar observasi:

| Tanggal | Perangkat | Skenario | Metrik Terdampak | Waktu Mulai Gangguan | Waktu Alert | Status Alert | Catatan |
| --- | --- | --- | --- | --- | --- | --- | --- |
| | | | | | | | |

### Kuesioner Penerimaan Pengguna Sistem

Skala penilaian:

1 = sangat tidak setuju  
2 = tidak setuju  
3 = netral  
4 = setuju  
5 = sangat setuju

Pertanyaan untuk teknisi/admin:

| Kode | Pernyataan | Skor 1-5 |
| --- | --- | --- |
| UAT-01 | Dashboard SCINetwork memudahkan saya melihat kondisi jaringan secara cepat. | |
| UAT-02 | Informasi perangkat, status, dan alert mudah dipahami. | |
| UAT-03 | Alert otomatis membantu saya mengetahui gangguan lebih cepat. | |
| UAT-04 | Fitur ack, resolve, dan catatan alert membantu proses tindak lanjut. | |
| UAT-05 | Data latency, packet loss, jitter, response time, dan availability berguna untuk analisis gangguan. | |
| UAT-06 | Hak akses pengguna sudah sesuai dengan kebutuhan kerja. | |
| UAT-07 | Fitur feedback membantu menghubungkan keluhan talent dengan pekerjaan teknisi. | |
| UAT-08 | Deteksi anomali membantu mengidentifikasi pola gangguan yang tidak mudah terlihat secara manual. | |
| UAT-09 | Sistem layak digunakan sebagai alat bantu monitoring jaringan di lingkungan Kantor Syntax. | |
| UAT-10 | Secara keseluruhan, saya puas dengan SCINetwork. | |

Pertanyaan untuk talent lintas divisi:

| Kode | Pernyataan | Skor 1-5 |
| --- | --- | --- |
| USER-01 | Saya sebagai talent mudah mengirim keluhan jaringan melalui sistem. | |
| USER-02 | Kategori dan prioritas keluhan mudah dipahami. | |
| USER-03 | Status tindak lanjut keluhan membantu saya mengetahui perkembangan masalah. | |
| USER-04 | Sistem ini membuat pelaporan masalah jaringan lebih jelas dibanding pelaporan manual. | |
| USER-05 | Saya bersedia menggunakan sistem ini untuk melaporkan gangguan jaringan. | |

### Rumus Penilaian Penerimaan

Skor penerimaan dihitung dengan rumus:

```text
Skor rata-rata = total seluruh skor responden / jumlah jawaban
Persentase penerimaan = (skor rata-rata / 5) x 100%
```

Kriteria interpretasi:

| Skor Rata-rata | Interpretasi |
| --- | --- |
| 4.21-5.00 | Sangat diterima |
| 3.41-4.20 | Diterima |
| 2.61-3.40 | Cukup |
| 1.81-2.60 | Kurang diterima |
| 1.00-1.80 | Tidak diterima |

### Keterhubungan Proyek dan Penelitian

Proyek menghasilkan artefak SCINetwork, sedangkan penelitian mengevaluasi apakah artefak tersebut efektif menyelesaikan masalah deteksi gangguan jaringan. Hubungannya dapat diringkas sebagai berikut:

| Elemen Proyek | Elemen Penelitian |
| --- | --- |
| Dashboard monitoring | Dievaluasi melalui kecepatan akses informasi dan penerimaan pengguna. |
| Scheduler ping/SNMP/HTTP | Dievaluasi melalui time to detect dan kelengkapan log. |
| Alert otomatis | Dievaluasi melalui akurasi alert dan kecepatan respons. |
| Feedback talent | Dievaluasi melalui kemudahan pelaporan dan tindak lanjut. |
| Isolation Forest | Dievaluasi melalui kemampuan mendeteksi anomali metrik jaringan. |
| RBAC | Dievaluasi melalui kesesuaian akses setiap role. |

Dengan demikian, SCINetwork bukan hanya proyek implementasi aplikasi, tetapi juga artefak penelitian DSR yang dapat diuji menggunakan metrik teknis dan instrumen penerimaan pengguna.