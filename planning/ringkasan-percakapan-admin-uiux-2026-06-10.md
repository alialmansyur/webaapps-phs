# Ringkasan Percakapan Admin UI/UX dan Master Data

Tanggal: 10 Juni 2026
Project: SIS-PHS
Fokus: audit dan standardisasi UI/UX admin, terutama area `sis-phs/frontend`

## Tujuan Utama

- Bertindak sebagai fullstack developer untuk audit kebutuhan tiap menu admin.
- Memastikan halaman admin tidak lagi bertumpu pada mockup statis.
- Menambahkan kebutuhan UI dasar seperti modal input/import, pagination, filter panel, dan tampilan data yang lebih realistis.
- Menyelesaikan prioritas area master data terlebih dahulu.

## Arah Implementasi yang Disepakati

- Pengerjaan dilakukan bertahap.
- Database target adalah database di container aktif dengan nama `sis_phs`.
- Jika dibutuhkan migrasi atau seed baru, rencananya dijalankan lewat container.
- Untuk fase yang sudah berjalan, fokus utama ada di frontend dan standardisasi UI bersama.

## Halaman yang Sudah Menjadi Fokus

- `/admin/users/admin`
- `/admin/users/kader`
- `/admin/master/questions`
- `/admin/master/scoring`

Beberapa halaman admin lain juga sudah disentuh sebagai fondasi shared component dan pola UI data management.

## Pekerjaan yang Sudah Dilakukan

### 1. Fondasi shared component admin

Komponen reusable telah diperluas agar mendukung kebutuhan halaman data management:

- `DataTable`
  - dukungan pagination meta
  - callback perpindahan halaman
  - empty state
  - pengaturan lebar minimum tabel
- `FilterBar`
  - dukungan slot kiri
  - layout filter/action lebih fleksibel
- `FilterPanel`
  - panel filter yang bisa buka-tutup
- `Modal`
  - modal generik untuk form dan import

### 2. Mock structured admin data

Sudah dibuat helper data admin terpusat untuk berbagai halaman agar transisi dari mockup statis ke data-driven UI lebih terarah, termasuk untuk:

- validasi survei
- database survei/keluarga
- user kader
- wilayah
- faskes
- user admin internal
- master pertanyaan
- master scoring

### 3. Sinkronisasi menu admin

Menu admin telah diperbarui agar rute penting yang sebelumnya belum sinkron ikut muncul, termasuk:

- `/admin/maps/hotspot`
- `/admin/surveys/database`
- `/admin/master/scoring`

### 4. Rebuild halaman admin prioritas

Beberapa halaman sudah diubah dari scaffold statis menjadi halaman yang lebih operasional, dengan pola:

- filter state
- pagination
- modal detail
- modal form tambah/edit
- modal import pada halaman yang membutuhkan
- tampilan statistik ringkas

### 5. Standardisasi visual master data

Sudah dilakukan standardisasi visual pada halaman master data dan user admin/kader:

- rounded card dan border diseragamkan
- tombol tambah data diseragamkan ke warna primary
- background icon diseragamkan ke primary soft

Standardisasi ini diterapkan pada halaman master data dan juga disamakan untuk:

- `/admin/users/admin`
- `/admin/users/kader`

## Perubahan Standardisasi Global Terbaru

User meminta agar rounded header dan card table disamakan dengan rounded KPI card dan, bila perlu, dibuat global dengan `!important`.

Tindak lanjut yang sudah dilakukan:

- dibuat standardisasi global di `src/styles/global.css`
- komponen reusable utama dihubungkan ke class global
- ditambahkan override global untuk container lama yang masih memakai `rounded-2xl` atau `rounded-[2rem]`

Class global yang diperkenalkan:

- `app-panel-shell`
- `app-panel-header`
- `app-panel-body`
- `app-panel-icon`
- `master-card-shell`
- `master-primary-btn`
- `master-primary-icon`

Komponen reusable yang sudah mengikuti standar global:

- `StatCard`
- `DataTable`
- `FilterBar`
- `FilterPanel`

## Nilai Rounded Global Terakhir

Awalnya rounded global dipasang `2rem`, lalu atas permintaan user diubah menjadi:

- rounded global panel/card/header/body: `1.25rem`
- rounded icon container: tetap `1rem`

Perubahan ini sudah diterapkan pada CSS global dan build frontend berhasil.

## Status Verifikasi

- `npm run build` frontend berhasil setelah perubahan standardisasi global.
- Masih ada beberapa halaman lain di luar prioritas master data yang belum dirapikan penuh satu per satu, tetapi fondasi global sudah dibuat agar efek standardisasi langsung terasa lebih luas.

## Catatan Lanjutan

- Prioritas berikutnya bisa melanjutkan perapian visual dan perilaku form/modal di sisa halaman master data.
- Jika backend/database mulai diaktifkan penuh dari container, data mock terstruktur yang sekarang dipakai bisa diganti bertahap ke API nyata.
- Perlu audit lanjutan terhadap halaman non-master yang masih memakai shell/card lama agar konsistensi UI benar-benar merata.

## Audit Dashboard Group Menu

Fokus tambahan pada 10 Juni 2026:

- `/admin/dashboard`
- `/dinkes/dashboard`
- `/puskesmas/dashboard`
- `/kader/dashboard`

### Kondisi Saat Ini Sebelum Rework

- `/admin/dashboard`
  - masih memakai dashboard analitik generik
  - belum benar-benar mencerminkan kebutuhan admin sebagai command center lintas modul
  - CTA ke validasi, database, monitoring, dan laporan belum cukup menonjol
- `/dinkes/dashboard`
  - masih berbagi komponen yang sama dengan admin
  - kebutuhan komparasi antar puskesmas/wilayah belum dipisahkan dari kebutuhan operasional harian
- `/puskesmas/dashboard`
  - masih berupa scaffold MVP
  - sudah memberi arah, tetapi belum terasa sebagai dashboard kerja harian yang hidup
  - filter desa, performa kader, dan antrean prioritas belum bekerja sebagai satu alur UI
- `/kader/dashboard`
  - sudah ada ringkasan dasar
  - masih terlalu minimal untuk kebutuhan lapangan
  - fokus personal workflow, rasa aman draft, dan status sinkronisasi belum cukup kuat

### Pemetaan Kebutuhan Seharusnya Per Dashboard

- Admin
  - fokus pada monitoring eksekutif dan kualitas proses
  - wajib menampilkan KPI proses: survei masuk, backlog validasi, intervensi aktif, status sinkronisasi unit
  - wajib punya quick action ke modul inti: validasi, database keluarga, monitoring intervensi, laporan progress
  - wajib ada ringkasan risiko wilayah agar admin cepat tahu bottleneck utama
- Dinkes
  - fokus pada perspektif strategis level kabupaten
  - wajib menonjolkan perbandingan antar puskesmas, capaian IKS, coverage, dan desa prioritas
  - wajib punya filter periode/tahun dan konteks wilayah
  - wajib mudah diarahkan ke laporan agregat, ranking, dan peta geospasial
- Puskesmas
  - fokus pada command center operasional
  - wajib menampilkan antrean verifikasi, desa tertinggal, keluarga prioritas intervensi, dan performa kader
  - filter desa harus nyata memengaruhi isi dashboard
  - perlu ruang baca yang cepat untuk redistribusi beban kerja kader
- Kader
  - fokus pada tindakan personal dan alur kerja harian
  - CTA utama harus selalu dekat: mulai survei, lanjut draft, buka jadwal intervensi, sinkronisasi
  - draft survei harus terasa aman dan jelas status progresnya
  - status sinkronisasi harus terlihat karena itu memengaruhi rasa percaya diri user lapangan

### Arah Rework UI/UX Dashboard

- Pisahkan experience dashboard per role, jangan memakai satu pola analitik generik untuk semua.
- Gunakan data mock terstruktur yang mudah diganti ke API nyata.
- Pertahankan struktur folder frontend yang sudah ada agar integrasi berikutnya tetap aman.
- Fokus awal tetap UI/UX dan perilaku antarmuka:
  - filter dan toggle aktif
  - CTA bisa dinavigasikan
  - daftar/tabel merespons filter lokal
  - visual hierarchy jelas per persona

### Status Rework Dashboard

- Dashboard admin diubah menjadi command center dengan period switch, funnel proses, alert feed, quick action, dan snapshot wilayah.
- Dashboard dinkes dipisah dari admin dan diarahkan menjadi dashboard strategis dengan ranking puskesmas, fokus indikator, dan agenda kabupaten.
- Dashboard puskesmas diubah menjadi dashboard operasional dengan filter desa, antrean kerja, tabel capaian desa, dan performa kader.
- Dashboard kader diubah menjadi dashboard personal workflow dengan CTA dominan, daftar draft, agenda lapangan, dan status sinkronisasi yang lebih kuat.

## Tambahan Daftar Kebutuhan Laporan Survey

- Tambah group menu `Laporan Survey` pada area admin.
- Pertahankan menu yang sudah ada:
  - `/admin/reports/iks-wilayah`
  - `/admin/reports/raw-data`
- Tambah kebutuhan laporan baru:
  - `Laporan Progress dan Coverage Survey`
    - fokus pada target vs realisasi survey, coverage per wilayah/puskesmas, status validasi, dan performa pelaksana
    - filter utama: periode, wilayah, puskesmas, desa/kelurahan, petugas/kader, status survey, rentang tanggal
  - `Laporan Capaian Indikator Survey`
    - fokus pada rekap hasil survey per indikator IKS/PHBS, persentase sehat, pra-sehat, tidak sehat, dan indikator dominan bermasalah
    - filter utama: periode, wilayah, puskesmas, desa/kelurahan, status validasi, indikator, jenis responden
  - `Laporan Rekap PHBS Kabupaten`
    - mengikuti struktur dokumen referensi `doc/PHS Kab.xlsx`
    - hirarki data: kecamatan, puskesmas, desa/kelurahan
    - memuat kolom jumlah ART disurvei per kelompok umur, capaian indikator PHBS, serta status sehat dan tidak sehat
    - filter utama: tahun/periode, wilayah, kecamatan, puskesmas, desa/kelurahan
    - output utama: tabel rekap kabupaten yang siap diekspor ke Excel/PDF
