# Report Admin Implementation Guide

Tanggal: 10 Juni 2026
Project: SIS-PHS
Fokus: panduan ringkas implementasi module `Reports` admin yang siap dieksekusi

## Tujuan

Dokumen ini menjadi acuan implementasi area report admin agar:

- struktur menu report jelas
- kebutuhan tiap halaman report jelas
- perbedaan `Master` dan `Reports` tetap konsisten
- implementasi UI/UX tidak melebar dari keputusan diskusi

## Struktur Menu Report Admin

Menu report admin yang dipakai:

- `/admin/reports/survey-progress`
  - `Progress & Coverage Survey`
- `/admin/reports/survey-indicators`
  - `Capaian Indikator Survey`
- `/admin/reports/phs-kabupaten`
  - `Rekap PHBS Kabupaten`
- `/admin/reports/iks-wilayah`
  - `Laporan IKS Wilayah`

Menu yang tidak dipakai lagi:

- `/admin/reports/raw-data`

## List Menu Master Admin yang Dipakai

Menu master admin yang dipakai:

- `/admin/master/regions`
  - `Master Wilayah`
- `/admin/master/faskes`
  - `Fasilitas Kesehatan`
- `/admin/master/questions`
  - `Instrumen & Skoring`
- `/admin/master/scoring`
  - `Algoritma Skoring`
- `/admin/users/kader`
  - `Pengguna Kader`
- `/admin/users/admin`
  - `Admin Internal`

## Ketentuan Umum UI/UX

- Warna harus konsisten dengan design system yang sama.
- Layout dasar harus konsisten dengan halaman admin lainnya.
- Komponen dasar tetap sama: header, action bar, filter area, table, pagination, modal.
- Perbedaan `Master` dan `Reports` tidak dibuat lewat warna atau layout yang berbeda total.

## Pembedaan Master vs Reports

### Master

Gunakan pendekatan `table-first`.

Ketentuan:

- tabel menjadi fokus utama
- aksi operasional seperti `Tambah`, `Import`, `Edit`, `Kelola` lebih dominan
- ringkasan atas tabel jika ada hanya ringan dan operasional
- tidak perlu chart atau insight besar

### Reports

Gunakan pendekatan `insight-first`.

Ketentuan:

- user harus mendapat ringkasan kondisi sebelum masuk ke tabel
- tabel tetap wajib lengkap, tetapi bukan satu-satunya fokus
- aksi `Export` harus menonjol
- KPI report boleh berupa angka, insight card, atau chart

## Standar Filter Semua Report

Semua halaman report admin wajib memakai filter yang sama:

- `Tahun`
- `Kecamatan`
- `Puskesmas`
- `Desa/Kelurahan`

Ketentuan:

- jangan tambahkan filter utama lain tanpa keputusan lanjutan
- urutan filter harus sama di semua report
- label filter harus sama di semua report
- perilaku cascade harus sama:
  - ganti `Kecamatan` mereset `Puskesmas` dan `Desa/Kelurahan`
  - ganti `Puskesmas` mereset `Desa/Kelurahan`

## Struktur Halaman Report

Urutan blok implementasi:

1. header halaman
2. action area
3. insight summary
4. chart / visual summary bila diperlukan
5. filter standar
6. tabel detail
7. pagination

Hal yang wajib tetap ada:

- header
- table lengkap
- refresh
- export

Hal yang opsional tergantung fungsi halaman:

- import
- tambah

## Standar Visual untuk Reports

Komponen insight yang boleh dipakai:

- summary cards
- donut chart
- line chart
- bar chart / horizontal bar chart
- mini trend card
- insight text card

Batasan:

- maksimal 1 sampai 2 chart utama per halaman
- report tidak boleh terasa seperti dashboard penuh
- chart harus mendukung isi tabel, bukan menggantikan tabel

## Kebutuhan Per Halaman

### 1. Progress & Coverage Survey

Fokus:

- target vs realisasi survey
- coverage per wilayah
- validasi dan backlog

Komponen yang disarankan:

- summary untuk target, realisasi, validasi, backlog
- line chart tren coverage
- visual tambahan untuk validasi / backlog
- tabel detail lengkap
- export Excel berdasarkan filter aktif

### 2. Capaian Indikator Survey

Fokus:

- hasil survey per indikator
- distribusi sehat, pra-sehat, tidak sehat
- indikator prioritas

Komponen yang disarankan:

- summary indikator dan distribusi sehat
- bar chart per indikator
- visual tambahan sehat vs tidak sehat
- tabel detail lengkap
- export Excel berdasarkan filter aktif

### 3. Rekap PHBS Kabupaten

Fokus:

- mengikuti referensi `doc/PHS Kab.xlsx`
- hirarki kecamatan, puskesmas, desa/kelurahan
- rekap ART, indikator PHBS, sehat / tidak sehat

Komponen yang disarankan:

- summary cakupan wilayah dan rerata sehat
- chart ranking kecamatan atau puskesmas
- visual tambahan sehat vs tidak sehat
- tabel rekap lengkap
- export Excel format kabupaten

### 4. Laporan IKS Wilayah

Fokus:

- ringkasan performa IKS per wilayah
- monitoring dan ranking internal

Komponen yang disarankan:

- summary rerata IKS, keluarga sehat, backlog
- line chart tren IKS
- horizontal bar ranking wilayah
- tabel detail lengkap
- export Excel berdasarkan filter aktif

## Checklist Implementasi

- [ ] hapus penuh `/admin/reports/raw-data` dari area admin
- [ ] pastikan 4 route report aktif dan sinkron dengan sidebar
- [ ] samakan filter semua report: Tahun, Kecamatan, Puskesmas, Desa/Kelurahan
- [ ] pastikan semua report punya header, refresh, export, table, pagination
- [ ] pastikan semua report memakai pendekatan `insight-first`
- [ ] pastikan semua halaman master tetap `table-first`
- [ ] tambahkan maksimal 1 sampai 2 chart utama per halaman report
- [ ] pastikan export Excel mengikuti hasil filter aktif
- [ ] pastikan skeleton loading tersedia di semua halaman report
- [ ] verifikasi akhir dengan `npm run build`

## Catatan Eksekusi

- Jika nanti perlu filter tambahan, perlakukan itu sebagai perubahan requirement.
- Jika nanti report dihubungkan ke backend nyata, struktur UI dalam dokumen ini tetap dipertahankan.
- Jika perlu dokumen yang lebih detail, gunakan dokumen ringkasan dan checklist sebelumnya sebagai referensi pendukung.
