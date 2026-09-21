# Ringkasan Percakapan UI/UX Frontend Target

Tanggal catatan: 2026-06-11 06:37:48 WIB
Lokasi kerja: `/mnt/d/2. Project/WebApps SIS-PHS`
Fokus area: `sis-phs/frontend`

## Tujuan Utama

Percakapan ini berfokus pada audit dan penyempurnaan UI/UX halaman target frontend SIS-PHS agar:

- setiap halaman menampilkan data sesuai kebutuhan fungsinya
- tidak lagi bergantung pada mockup atau placeholder yang tidak operasional
- mendukung filter, modal input/import, pagination, skeleton, dan struktur aksi yang rapi
- konsisten secara visual tanpa membuat semua halaman terasa identik

## Halaman Target Awal

- `/admin/surveys/validation`
- `/admin/surveys/database`
- `/kader/surveys/drafts`
- `/kader/surveys/history`
- `/admin/surveys/interventions`
- `/kader/interventions/schedule`
- `/kader/interventions/log`
- `/kader/profile/wilayah`
- `/kader/profile/account`
- `/dinkes/reports/aggregate`
- `/puskesmas/reports/desa`

## Keputusan Penting

### 1. Fase awal difokuskan ke UI/UX

Implementasi diarahkan dulu ke fase UI/UX untuk seluruh halaman target sebelum audit backend lanjutan per endpoint.

### 2. Halaman `/kader/surveys/new`

Kebutuhan identitas diperjelas:

- `KK` dan `NIK` dipetakan ulang sebagai data identitas utama
- `RT` dan `RW` dipisahkan menjadi field tersendiri
- `alamat` diletakkan terpisah dari RT/RW

### 3. Deskripsi judul halaman disederhanakan

Untuk semua halaman baru yang dibangun:

- deskripsi header dipersingkat
- tujuan utamanya agar tombol aksi di header tidak turun ke bawah

### 4. Halaman `/kader/profile/account`

Konsep diubah menjadi nav tab, bukan layout biasa. Tab yang dipakai:

- `Profil`
- `Keamanan`
- `Status`
- `Perangkat`

### 5. Pemetaan KPI card

Tidak semua halaman perlu KPI card. Keputusan yang diterapkan:

Tetap memakai KPI:

- `/admin/surveys/validation`
- `/admin/surveys/database`
- `/admin/surveys/interventions`
- `/dinkes/reports/aggregate`
- `/puskesmas/reports/desa`

Tanpa KPI, cukup filter + table:

- `/kader/surveys/drafts`
- `/kader/surveys/history`
- `/kader/interventions/schedule`
- `/kader/interventions/log`
- `/kader/profile/wilayah`
- `/kader/profile/account`

## Implementasi UI/UX yang Sudah Dikerjakan

### A. Komponen umum

- dibuat komponen `TableActionButton` untuk aksi tabel icon-only
- `AdminDataPageSkeleton` diperbarui agar:
  - KPI skeleton hanya tampil bila memang ada KPI
  - table skeleton tidak dipaksa muncul pada halaman non-table seperti tab account
- `DataTable` sudah dirapikan sebelumnya untuk empty state

### B. Halaman target operasional dan report

Sudah dibangun/dirapikan:

- filter bar
- filter panel
- pagination
- modal detail / input / import
- skeleton loading
- struktur tabel lebih operasional
- header action lebih pendek dan stabil

### C. Action table dirapikan menjadi icon-only

Sudah diterapkan pada halaman target dan tambahan berikut:

- `/admin/surveys/validation`
- `/admin/surveys/database`
- `/admin/surveys/interventions`
- `/kader/surveys/drafts`
- `/kader/surveys/history`
- `/kader/interventions/schedule`
- `/kader/interventions/log`
- `/kader/profile/wilayah`
- `/dinkes/reports/aggregate`
- `/puskesmas/reports/desa`
- `/admin/reports/survey-progress`
- `/admin/reports/survey-indicators`
- `/admin/reports/phs-kabupaten`
- `/admin/reports/iks-wilayah`
- `/admin/master/regions`
- `/admin/master/faskes`
- `/admin/master/questions`
- `/admin/master/scoring`
- `/admin/settings/periods`
- `/admin/users/kader`
- `/admin/users/admin`

### D. Panel filter yang masih mockup dihapus/ganti

Prinsip yang disepakati:

- jika panel filter masih berisi catatan implementasi atau blok placeholder, harus dihapus atau diganti menjadi filter sungguhan
- jika hanya ada 3 filter, layout dibuat penuh satu baris

Perubahan yang diterapkan:

- `FilterPanel` dibuat adaptif untuk 3, 4, 5, dan 6 field
- halaman 3 filter dibagi penuh satu baris
- blok filter mockup pada halaman target diganti menjadi filter aktif

Penggantian filter nyata yang sudah dilakukan:

- `Survey Validation`: tambah filter `Puskesmas`
- `Survey Database`: tambah filter `Puskesmas`
- `Master Regions`: tambah filter `Struktur Node`
- `Master Faskes`: tambah filter `Ketersediaan Kader`
- `Master Questions`: tambah filter `Sifat Pertanyaan`
- `Master Scoring`: tambah filter `Versi Rule`
- `Settings Periods`: tambah filter `Target Operasional`

Semua filter tersebut sudah dihubungkan sampai level data filtering di service terkait.

## File/Area yang Banyak Terdampak

Komponen:

- `src/components/ui/TableActionButton.jsx`
- `src/components/ui/AdminDataPageSkeleton.jsx`
- `src/components/ui/FilterPanel.jsx`

Service:

- `src/services/operationalData.js`
- `src/services/adminData.js`
- `src/services/settingsAdminData.js`

Modul utama yang disentuh:

- `src/modules/surveys/*`
- `src/modules/interventions/*`
- `src/modules/profile/*`
- `src/modules/reports/*`
- `src/modules/master/*`
- `src/modules/settings/SystemSettings.jsx`
- `src/modules/users/*`

## Status Verifikasi

Build frontend sudah beberapa kali diverifikasi dan dinyatakan lolos dengan:

`npm run build`

Catatan:

- masih ada warning ukuran chunk besar dari Vite
- warning tersebut belum menjadi blocker untuk UI/UX pass ini

## Arah Lanjutan yang Disarankan

Tahap berikutnya yang paling masuk akal:

1. audit kebutuhan data per halaman target terhadap endpoint/backend nyata
2. hapus sisa teks deskripsi filter yang masih terlalu generik
3. sinkronkan modal form dan import dengan kontrak data backend
4. audit konsistensi icon action table di modul admin lain yang belum disentuh
