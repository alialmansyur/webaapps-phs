# Cleanup Duplicate Tables 2026-06-11

## Fokus

Menjadikan tabel referensi utama kembali mengacu ke backup `sis_phs11062026.sql`, terutama:

- `reg_districts` sebagai sumber kecamatan
- `reg_villages` sebagai sumber desa

## Hasil Audit

Tabel duplikat/logical overlap yang ditemukan:

- `districts` duplikat terhadap `reg_districts`
- `villages` duplikat terhadap `reg_villages`

Tabel tambahan yang bukan duplikat langsung, tetapi bukan bagian dari backup utama:

- `puskesmas`
- `roles`
- `permissions`
- `role_permission`
- `menus`
- `role_menu`
- `user_scopes`
- `dinkes_puskesmas`
- `activity_logs`
- `personal_access_tokens`
- `password_reset_tokens`
- `sessions`
- `cache`
- `cache_locks`
- `jobs`
- `job_batches`
- `failed_jobs`
- `migrations`

## Data Contoh Yang Menyebabkan Duplikasi

Seeder lama menambahkan data contoh:

- district: `3201010`, `3201011`
- village: `3201010001`, `3201010002`, `3201011001`, `3201011003`
- puskesmas: `PKM-SKM`, `PKM-HRP`

Data ini tidak ada di backup dan membuat lapisan duplikat terhadap data wilayah asli.

## Perbaikan Yang Diterapkan

- relasi `users.district_id` dipindah ke `reg_districts`
- relasi `users.village_id` dipindah ke `reg_villages`
- relasi `user_scopes.district_id` dipindah ke `reg_districts`
- relasi `user_scopes.village_id` dipindah ke `reg_villages`
- relasi `puskesmas.district_id` dipindah ke `reg_districts`
- relasi `puskesmas_villages.village_id` dipindah ke `reg_villages`
- relasi `mstr_households.village_id` dipindah ke `reg_villages`
- tabel duplikat `districts` dan `villages` di-drop
- data contoh `puskesmas` yang tidak punya padanan di backup dibersihkan
- seeder contoh wilayah dinonaktifkan agar duplikasi tidak terulang

## Artefak

- migration cleanup:
  - `sis-phs/backend/database/migrations/2026_06_11_110000_cleanup_duplicate_reference_tables.php`
- catatan audit ini:
  - `planning/db-duplicate-cleanup-2026-06-11.md`
