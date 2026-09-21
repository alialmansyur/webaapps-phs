# Audit Backup DB SIS-PHS 2026-06-11

## Ringkasan

- Backup sumber: `sis_phs11062026.sql`
- Database aktif saat audit: `sis_phs` pada container `sis-phs-mysql-backend`
- Backend aktif sudah memakai migration Laravel untuk auth, RBAC, scope wilayah, cache, jobs, dan sessions
- Backup lama membawa skema domain survei, referensi wilayah nasional, dan skema `users` lama yang tidak kompatibel dengan backend Laravel saat ini

## Tabel Saat Ini

Tabel aktif hasil migration backend:

- `users`
- `roles`
- `permissions`
- `role_permission`
- `menus`
- `role_menu`
- `districts`
- `puskesmas`
- `villages`
- `puskesmas_villages`
- `dinkes_puskesmas`
- `user_scopes`
- `activity_logs`
- `personal_access_tokens`
- `password_reset_tokens`
- `sessions`
- `cache`
- `cache_locks`
- `jobs`
- `job_batches`
- `failed_jobs`

## Tabel Di Backup

- `mstr_households`
- `mstr_periods`
- `mstr_puskesmas`
- `mstr_question_options`
- `mstr_questions`
- `mstr_respondents`
- `mstr_yearly_question_items`
- `mstr_yearly_questionnaires`
- `mstr_yearly_targets`
- `reg_districts`
- `reg_provinces`
- `reg_regencies`
- `reg_villages`
- `trx_survey_answers`
- `trx_surveys`
- `user_roles`
- `users`

## Temuan Audit

- Backup tidak bisa diimport mentah ke database baru karena foreign key lama mengarah ke `m_villages` dan `m_districts`, sedangkan dump yang tersedia hanya punya `reg_villages` dan `reg_districts`.
- Skema `users` di backup bertabrakan dengan tabel `users` Laravel yang aktif.
- `user_roles` di backup bertabrakan secara konsep dengan tabel `roles` pada modul RBAC baru.
- `mstr_puskesmas` di backup kosong dan tidak kompatibel dengan desain `puskesmas` backend saat ini.
- Data yang benar-benar bernilai dari backup saat ini adalah referensi wilayah nasional (`reg_*`) dan master survei (`mstr_*`) yang tidak bentrok dengan auth baru.

## Keputusan Merge

- Dipertahankan dan dimigrasikan ke backend:
  - `reg_provinces`
  - `reg_regencies`
  - `reg_districts`
  - `reg_villages`
  - `mstr_periods`
  - `mstr_questions`
  - `mstr_question_options`
  - `mstr_yearly_questionnaires`
  - `mstr_yearly_question_items`
  - `mstr_yearly_targets`
  - `mstr_households`
  - `mstr_respondents`
  - `trx_surveys`
  - `trx_survey_answers`
- Tidak diimport:
  - `users`
  - `user_roles`
  - `mstr_puskesmas`

## Artefak Yang Ditambahkan

- Migration Laravel:
  - `sis-phs/backend/database/migrations/2026_06_11_100000_create_survey_reference_and_transaction_tables.php`
- Script merge restore:
  - `scripts/merge_backup_11062026.sh`

## Cara Pakai

Jalankan dari root workspace:

```bash
bash scripts/merge_backup_11062026.sh
```

Script akan:

- menjalankan `php artisan migrate`
- membuat tabel survei/reference yang belum ada
- mengimpor data aman dari `sis_phs11062026.sql`
- menyinkronkan `reg_districts` ke `districts`
- menyinkronkan `reg_villages` ke `villages`

## Catatan Risiko

- Seeder `RegionScopeSeeder` saat ini masih berisi data contoh (`3201010`, `3201011`). Data contoh tetap aman, tetapi sekarang bercampur dengan data wilayah asli hasil backup.
- Jika nanti dibutuhkan integrasi penuh modul survei, endpoint/model untuk tabel `mstr_*` dan `trx_*` masih perlu dibangun di backend.
