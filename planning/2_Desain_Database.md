# Desain Database Sistem Informasi Survei PHS

Berdasarkan kebutuhan RBAC, hierarki wilayah, dan mekanisme All-or-Nothing dalam kuesioner, berikut adalah rancangan skema database relasional (PostgreSQL):

## 1. Master Data Wilayah & Puskesmas
Tabel-tabel ini mengelola data geografis dan wilayah kerja Puskesmas.

- `provinsi`: `id`, `nama_provinsi`
- `kabupaten_kota`: `id`, `provinsi_id`, `nama_kab_kota`
- `kecamatan`: `id`, `kab_kota_id`, `nama_kecamatan`
- `puskesmas`: `id`, `kecamatan_id`, `nama_puskesmas`, `kode_puskesmas`
- `desa_kelurahan`: `id`, `puskesmas_id`, `kecamatan_id`, `nama_desa`

## 2. Manajemen Pengguna (Users & Roles)
RBAC diimplementasikan di tabel ini.

- `roles`: `id`, `nama_role` (Admin, Dinkes, Puskesmas, Kader, Viewer), `deskripsi`
- `users`:
  - `id`, `username`, `password_hash`, `nama_lengkap`, `role_id`
  - `puskesmas_id` (Nullable, diisi jika role=Puskesmas/Kader)
  - `desa_id` (Nullable, diisi jika role=Kader)
  - `kab_kota_id` (Nullable, diisi jika role=Dinkes)
  - `is_active`, `created_at`, `updated_at`

## 3. Instrumen Survei (Dinamis)
- `instrumen_indikator`: `id`, `nama_indikator` (Aktivitas Fisik, Cuci Tangan, dll), `batasan_umur` (>=5, >=10, >=15), `deskripsi`
- `instrumen_pertanyaan`: `id`, `indikator_id`, `pertanyaan`, `tipe_jawaban` (boolean/pilihan), `urutan`

## 4. Pendataan & Hasil Survei
- `responden`:
  - `id`, `kader_id` (User yang input)
  - `desa_id`
  - `nama_lengkap`, `nik` (opsional), `umur`, `jenis_kelamin`, `alamat`
  - `status_phs` (Boolean: true=Sehat, false=Tidak Sehat) -> Dihitung otomatis (All-or-nothing).
  - `tanggal_survei`, `is_draft` (boolean)
- `jawaban_survei`:
  - `id`, `responden_id`, `pertanyaan_id`, `jawaban` (Teks / Nilai), `is_sehat` (Boolean: apakah jawaban ini sesuai kriteria sehat)

## 5. Modul Tindak Lanjut (Intervensi)
Ketika responden mendapatkan `status_phs = false`, mereka otomatis masuk ke tabel intervensi.

- `intervensi_follow_up`:
  - `id`, `responden_id`
  - `kader_id` (yang ditugaskan/bertanggung jawab)
  - `status_intervensi` (Pending, In Progress, Completed)
  - `bentuk_intervensi` (Edukasi, Promosi PHS, dll)
  - `catatan_kader`
  - `tanggal_tindak_lanjut`
  - `is_resolved` (Jika true, kader mensurvei ulang dan hasilnya menjadi Sehat).

## 6. Target & KPI Tahunan
- `target_survei`:
  - `id`, `tahun`, `desa_id` atau `puskesmas_id`
  - `target_jumlah_responden`
  - `realisasi` (Bisa berupa query kalkulasi atau cache table)
