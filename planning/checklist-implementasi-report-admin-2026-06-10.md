# Checklist Implementasi Report Admin

Tanggal: 10 Juni 2026
Project: SIS-PHS
Fokus: checklist implementasi area `Reports` admin beserta ketentuan konsistensi UI/UX

## Tujuan Checklist

Dokumen ini dipakai sebagai acuan implementasi agar:

- arah UI/UX module `Reports` konsisten
- pembedaan `Master` dan `Reports` tetap jelas
- keputusan diskusi sebelumnya tidak berubah-ubah saat eksekusi

## Ketentuan Umum yang Wajib Dijaga

- Gunakan design system yang sama antara `Master` dan `Reports`.
- Pewarnaan harus konsisten, tidak dibuat tema warna yang berbeda antar module.
- Layout dasar halaman harus konsisten, tidak dibuat struktur halaman yang benar-benar berbeda.
- Komponen inti tetap seragam: header, tombol aksi, filter area, table, pagination, modal.
- Perbedaan `Master` dan `Reports` dibangun dari hirarki konten, bukan dari pergantian style system.

## Ketentuan Khusus Module Master

- `Master` wajib memakai pendekatan `table-first`.
- Tabel harus menjadi fokus utama halaman.
- Action operasional seperti `Tambah`, `Import`, `Edit`, `Kelola` harus terasa dominan.
- Ringkasan di atas tabel jika ada hanya bersifat operasional dan ringan.
- Jangan memasukkan chart atau panel insight besar pada halaman master.

## Ketentuan Khusus Module Reports

- `Reports` wajib memakai pendekatan `insight-first`.
- Area atas halaman harus membantu user membaca kondisi lebih cepat sebelum masuk ke tabel.
- Tabel tetap wajib ada dan tetap lengkap, tetapi tidak menjadi satu-satunya fokus.
- Aksi `Export` harus menjadi aksi penting yang mudah terlihat.
- KPI pada report tidak harus selalu angka statis; boleh memakai chart atau ringkasan visual.

## Standar Filter Semua Halaman Report

Filter yang wajib dipakai dan diseragamkan di semua halaman report:

- `Tahun`
- `Kecamatan`
- `Puskesmas`
- `Desa/Kelurahan`

Ketentuan tambahan:

- Jangan menambahkan filter utama lain di luar empat item tersebut tanpa keputusan lanjutan.
- Urutan filter harus konsisten di semua halaman report.
- Label filter harus konsisten, tidak boleh berganti istilah antar halaman.
- Perilaku cascade harus konsisten:
  - ganti `Kecamatan` mereset `Puskesmas` dan `Desa/Kelurahan`
  - ganti `Puskesmas` mereset `Desa/Kelurahan`

## Standar Struktur Halaman Report

Urutan blok yang harus dijaga:

- header halaman
- action area
- insight summary
- chart / visual summary bila diperlukan
- filter standar
- tabel detail
- pagination

Ketentuan tambahan:

- header tetap memakai pola admin yang sudah berlaku
- table tetap memakai komponen table reusable yang sama
- refresh harus tetap tersedia
- export harus tetap tersedia
- import atau tambah hanya muncul jika memang relevan dengan fungsi halaman

## Standar Visual Summary pada Reports

Komponen insight yang diperbolehkan:

- summary cards
- donut chart
- line chart
- bar chart / horizontal bar chart
- mini trend card
- insight card berbasis teks

Ketentuan tambahan:

- Maksimal 1 sampai 2 chart utama per halaman report.
- Jangan membuat report terasa seperti dashboard penuh.
- Chart harus mendukung isi tabel, bukan menggantikan tabel.
- Insight summary harus tetap ringkas dan mudah dipahami.

## Checklist Implementasi Per Halaman Report

### 1. Progress & Coverage Survey

- [ ] pastikan route dan label final sudah stabil
- [ ] pastikan filter hanya: Tahun, Kecamatan, Puskesmas, Desa/Kelurahan
- [ ] siapkan summary area untuk target, realisasi, validasi, backlog
- [ ] siapkan 1 chart utama untuk tren coverage
- [ ] siapkan 1 visual tambahan untuk status validasi/backlog
- [ ] pastikan tabel detail tetap lengkap
- [ ] pastikan export Excel mengikuti data hasil filter aktif

### 2. Capaian Indikator Survey

- [ ] pastikan route dan label final sudah stabil
- [ ] pastikan filter hanya: Tahun, Kecamatan, Puskesmas, Desa/Kelurahan
- [ ] siapkan summary area untuk distribusi sehat dan indikator prioritas
- [ ] siapkan 1 chart utama untuk perbandingan indikator
- [ ] siapkan 1 visual tambahan untuk distribusi sehat / tidak sehat
- [ ] pastikan tabel detail tetap lengkap
- [ ] pastikan export Excel mengikuti data hasil filter aktif

### 3. Rekap PHBS Kabupaten

- [ ] pastikan route dan label final sudah stabil
- [ ] pastikan struktur data mengikuti referensi `doc/PHS Kab.xlsx`
- [ ] pastikan filter hanya: Tahun, Kecamatan, Puskesmas, Desa/Kelurahan
- [ ] siapkan summary area untuk jumlah cakupan wilayah dan rerata sehat
- [ ] siapkan 1 chart utama untuk ranking kecamatan atau puskesmas
- [ ] siapkan 1 visual tambahan untuk sehat vs tidak sehat
- [ ] pastikan tabel rekap tetap lengkap dan siap ekspor
- [ ] pastikan export Excel mengikuti format laporan kabupaten

### 4. Laporan IKS Wilayah

- [ ] pastikan route dan label final sudah stabil
- [ ] pastikan filter hanya: Tahun, Kecamatan, Puskesmas, Desa/Kelurahan
- [ ] siapkan summary area untuk rerata IKS, keluarga sehat, backlog
- [ ] siapkan 1 chart utama untuk tren IKS
- [ ] siapkan 1 visual tambahan untuk ranking wilayah
- [ ] pastikan tabel detail tetap lengkap
- [ ] pastikan export Excel mengikuti data hasil filter aktif

## Checklist Konsistensi Cross-Module

- [ ] `Master` tetap tampil sebagai area `table-first`
- [ ] `Reports` tampil sebagai area `insight-first`
- [ ] warna tetap satu sistem yang sama
- [ ] layout dasar tetap satu sistem yang sama
- [ ] perbedaan hanya pada prioritas konten dan komponen insight
- [ ] style tombol aksi tetap konsisten antar halaman
- [ ] style table dan pagination tetap konsisten antar halaman
- [ ] style modal dan panel filter tetap konsisten antar halaman

## Checklist Teknis

- [ ] semua route report admin berfungsi
- [ ] menu sidebar report admin sinkron dengan route
- [ ] halaman lama `/admin/reports/raw-data` tidak lagi muncul
- [ ] skeleton loading tersedia di semua halaman report
- [ ] export Excel tersedia di semua halaman report
- [ ] semua halaman lolos `npm run build`

## Catatan Implementasi

- Bila nanti dibutuhkan filter tambahan, keputusan itu harus diperlakukan sebagai perubahan requirement, bukan ditambahkan langsung.
- Bila nanti chart ditambahkan, tetap jaga supaya halaman tidak terlalu penuh dan tidak kehilangan fokus pada tabel.
- Bila nanti report mulai terhubung ke backend nyata, struktur UI yang sudah disepakati di dokumen ini harus tetap dipertahankan.
