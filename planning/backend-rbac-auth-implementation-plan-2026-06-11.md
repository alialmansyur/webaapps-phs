# Planning Implementasi Backend, Database, Auth, dan RBAC SIS-PHS

Tanggal: 11 Juni 2026
Project: SIS-PHS
Fokus fase pertama:

- aktivasi schema role
- auth/login nyata
- reset password
- aktivasi halaman frontend:
  - `/admin/settings/rbac`
  - `/admin/users/admin`
  - `/admin/users/kader`

## 1. Ringkasan Kondisi Saat Ini

Hasil inspeksi codebase saat ini:

- monorepo terdiri dari `sis-phs/frontend` dan `sis-phs/backend`
- backend memakai Laravel
- frontend React masih memakai mock data dan mock auth
- `docker-compose.yml` sudah menyiapkan `frontend`, `backend`, dan `mysql`
- migrasi Laravel saat ini masih default bawaan:
  - `users`
  - `password_reset_tokens`
  - `sessions`
  - `cache`
  - `jobs`
- `DatabaseSeeder` masih sample bawaan Laravel
- source frontend untuk halaman target sudah ada, tetapi seluruh data masih berasal dari:
  - `frontend/src/services/adminData.js`
  - `frontend/src/services/settingsAdminData.js`
  - `frontend/src/services/mockAuth.js`
  - `frontend/src/services/api.js`

Temuan penting database:

- terdapat `schema.sql` dengan naming `m_*`, `c_*`, `t_*`
- terdapat dump `sis_phs10062026.sql` dengan naming campuran:
  - `mstr_users`, `mstr_roles`, `mstr_puskesmas`, dst
  - `reg_districts`, kemungkinan juga `reg_regencies`, `reg_villages`, dll
- artinya saat ini ada mismatch besar antara:
  - skema yang direncanakan
  - dump database yang pernah dipakai
  - skema Laravel aktif

Kesimpulan kondisi:

- aplikasi belum punya single source of truth untuk user, role, dan scope wilayah
- halaman frontend target sudah siap dijahit ke backend
- fase pertama sebaiknya membangun fondasi auth + RBAC + hierarchical scope sebelum modul lain ikut diaktifkan

## 2. Problem Utama yang Harus Diselesaikan

### 2.1 Mismatch skema user

Saat ini ada minimal tiga versi konsep user:

- Laravel default: `users(name, email, password)`
- rancangan schema root: `m_users(role_id, puskesmas_id, village_id, username, password_hash, ...)`
- dump lama: `mstr_users(...)`

Jika mismatch ini tidak disatukan lebih dulu:

- auth akan rapuh
- relasi role tidak jelas
- filter data per wilayah sulit konsisten
- frontend admin user tidak bisa diaktifkan dengan aman

### 2.2 Belum ada model scope akses berjenjang

Kebutuhan bisnis:

- 1 desa = 1 kader
- 1 puskesmas memiliki beberapa desa
- 1 dinkes memiliki beberapa puskesmas
- admin bebas tanpa filter

Saat ini kebutuhan ini belum direpresentasikan secara eksplisit dan aman di skema aktif Laravel.

### 2.3 RBAC frontend masih mock

Halaman `/admin/settings/rbac` saat ini:

- hanya memetakan role ke route frontend
- belum tersimpan di database
- belum menjadi dasar enforcement backend

### 2.4 Auth dan reset password belum nyata

Saat ini login frontend masih dummy dan backend belum menyediakan flow login operasional yang siap dipakai UI.

## 3. Prinsip Implementasi Best Practice

Prinsip yang saya sarankan untuk fase ini:

1. gunakan tabel `users` Laravel sebagai canonical identity table
2. jangan mempertahankan tabel user ganda seperti `m_users` vs `mstr_users` vs `users`
3. pisahkan:
   - identitas user
   - role
   - permission/menu
   - scope wilayah
4. enforce access scope di backend, bukan hanya sembunyikan menu di frontend
5. buat migrasi incremental dan repeatable dari Laravel
6. siapkan seed minimal yang cukup untuk demo, QA, dan aktivasi frontend
7. buat API contract yang stabil supaya frontend bisa lepas dari mock data

## 4. Target Desain Data

### 4.1 Tabel inti yang direkomendasikan

Tetap gunakan `users` sebagai tabel utama login, lalu tambahkan tabel berikut:

- `roles`
- `permissions`
- `role_permission`
- `menus`
- `role_menu`
- `user_scopes`
- `puskesmas_villages`
- `dinkes_puskesmas`
- `password_reset_tokens` tetap gunakan bawaan Laravel
- `activity_logs` untuk audit minimum

### 4.2 Struktur `users`

Perluasan tabel `users`:

- `username` unique
- `full_name`
- `email` nullable unique
- `phone`
- `is_active`
- `last_login_at`
- `must_reset_password`
- `role_id`

Catatan:

- `name` Laravel sebaiknya dipertahankan sementara untuk kompatibilitas, lalu diisi sinkron dari `full_name`, atau diganti secara terkontrol setelah seluruh backend stabil
- `password` tetap gunakan kolom Laravel dengan hashing bawaan

### 4.3 Struktur `roles`

Minimal seed awal:

- `admin`
- `dinkes`
- `puskesmas`
- `kader`

Opsional tapi bagus disiapkan dari awal:

- `auditor`
- `analis`

Kolom:

- `id`
- `code` unique
- `name`
- `description`
- `is_active`
- timestamps

### 4.4 Struktur `menus`

Tujuan:

- menyuplai halaman `/admin/settings/rbac`
- menjadi sumber sidebar dinamis di masa lanjut

Kolom:

- `id`
- `parent_id` nullable
- `code` unique
- `title`
- `path`
- `sort_order`
- `is_active`
- `context_group`

Contoh menu minimal untuk fase ini:

- `admin-users-admin`
- `admin-users-kader`
- `admin-settings-rbac`

### 4.5 Struktur `role_menu`

Tujuan:

- menentukan role mana boleh mengakses menu apa

Kolom:

- `role_id`
- `menu_id`
- unique composite

### 4.6 Struktur `user_scopes`

Ini tabel paling penting untuk kontrol data lintas wilayah.

Kolom:

- `id`
- `user_id`
- `scope_type`
- `province_id` nullable
- `regency_id` nullable
- `district_id` nullable
- `puskesmas_id` nullable
- `village_id` nullable
- `is_primary`
- timestamps

Aturan:

- `admin`: tidak wajib punya scope
- `dinkes`: minimal punya mapping puskesmas melalui `dinkes_puskesmas` dan boleh punya scope tingkat kabupaten
- `puskesmas`: minimal punya `puskesmas_id`
- `kader`: wajib punya `village_id` dan `puskesmas_id`

### 4.7 Struktur mapping wilayah

#### `puskesmas_villages`

Tujuan:

- memetakan desa yang berada dalam cakupan satu puskesmas

Kolom:

- `id`
- `puskesmas_id`
- `village_id`
- unique composite

#### `dinkes_puskesmas`

Tujuan:

- memetakan user atau entitas dinkes ke daftar puskesmas di bawahnya

Kolom:

- `id`
- `dinkes_user_id`
- `puskesmas_id`
- unique composite

Catatan:

- bila sistem hanya punya satu dinkes per kabupaten, tabel ini tetap berguna agar desain tidak hardcoded

## 5. Aturan Bisnis yang Harus Ditegakkan di Backend

### 5.1 Aturan user kader

- satu `village_id` hanya boleh memiliki satu user aktif dengan role `kader`
- kader hanya boleh melihat dan mengelola data miliknya sendiri atau data di desanya sendiri
- user kader wajib terhubung ke:
  - `role = kader`
  - `village_id`
  - `puskesmas_id`

Implementasi constraint:

- validasi aplikasi
- unique index parsial secara logika aplikasi

Karena MySQL tidak mendukung partial unique index seperti PostgreSQL, pendekatan aman:

- validasi service layer saat create/update
- tambahkan unique index komposit untuk skenario yang masuk akal bila desain final memakai `kader_profiles` atau kolom aktif terpisah

### 5.2 Aturan user puskesmas

- puskesmas hanya bisa melihat desa yang terhubung ke puskesmas tersebut
- puskesmas hanya bisa CRUD user kader di desa cakupannya
- puskesmas tidak boleh assign kader ke desa di luar mapping `puskesmas_villages`

### 5.3 Aturan user dinkes

- dinkes hanya bisa melihat puskesmas pada mapping `dinkes_puskesmas`
- seluruh data kader dan desa yang tampil harus diturunkan dari mapping itu
- default akses dinkes untuk fase awal sebaiknya read-only untuk data survei, tetapi tetap boleh melihat user dan scope

### 5.4 Aturan admin

- admin bypass seluruh filter scope
- admin boleh kelola role, menu, user admin, user kader, dan reset password

## 6. Strategi Normalisasi dan Migrasi Database

### 6.1 Keputusan strategis

Jangan mengaktifkan tabel `mstr_users` sebagai pusat auth baru.

Lebih aman:

- pertahankan `users` Laravel sebagai pusat login
- migrasikan atau seed data referensi dari dump lama ke tabel canonical baru

### 6.2 Opsi migrasi data lama

Fase implementasi sebaiknya memakai pendekatan dua tahap:

#### Tahap A: Stabilkan schema baru

- buat migrasi Laravel untuk seluruh tabel inti baru
- seed role, menu, permission, contoh scope
- backend langsung memakai schema baru

#### Tahap B: Import data lama terkontrol

- buat command/importer untuk membaca tabel dump lama
- lakukan mapping:
  - `mstr_roles` -> `roles`
  - `mstr_users` -> `users`
  - `mstr_puskesmas` -> `puskesmas` atau tabel referensi aktif
  - `reg_*` / `m_villages` -> master wilayah aktif

Untuk fase pertama, Tahap A cukup untuk aktivasi halaman target.

## 7. Desain Backend Laravel yang Direkomendasikan

### 7.1 Layer yang perlu dibuat

- Models:
  - `User`
  - `Role`
  - `Menu`
  - `UserScope`
  - `PuskesmasVillage`
  - `DinkesPuskesmas`
- Requests:
  - `LoginRequest`
  - `ForgotPasswordRequest`
  - `ResetPasswordRequest`
  - `StoreAdminUserRequest`
  - `UpdateAdminUserRequest`
  - `StoreKaderUserRequest`
  - `UpdateKaderUserRequest`
  - `SyncRoleMenuRequest`
- Services:
  - `AuthService`
  - `ScopeResolverService`
  - `UserManagementService`
  - `RoleMenuService`
- Policies / Gates:
  - `manage-rbac`
  - `manage-admin-users`
  - `manage-kader-users`
  - `view-scope-data`

### 7.2 Guard dan auth strategy

Untuk fase ini, paling pragmatis:

- gunakan Laravel Sanctum atau token API sederhana berbasis personal access token

Rekomendasi:

- pakai `Sanctum`

Alasan:

- cocok untuk SPA frontend React
- implementasi login/logout/me lebih rapi
- memudahkan proteksi endpoint admin

### 7.3 Response auth `/me`

Endpoint `/me` harus mengembalikan:

- identitas user
- role aktif
- daftar permission/menu
- scope ringkas

Contoh field:

- `id`
- `username`
- `full_name`
- `email`
- `phone`
- `role`
- `roles`
- `permissions`
- `menus`
- `scope`
- `is_active`

## 8. API Contract Minimum untuk Fase Pertama

### 8.1 Auth

- `POST /api/auth/login`
- `POST /api/auth/logout`
- `GET /api/auth/me`
- `POST /api/auth/forgot-password`
- `POST /api/auth/reset-password`

### 8.2 RBAC

- `GET /api/admin/rbac/roles`
- `POST /api/admin/rbac/roles`
- `GET /api/admin/rbac/menus`
- `GET /api/admin/rbac/matrix`
- `PUT /api/admin/rbac/matrix`

### 8.3 Admin users

- `GET /api/admin/users/admin`
- `POST /api/admin/users/admin`
- `GET /api/admin/users/admin/{id}`
- `PUT /api/admin/users/admin/{id}`
- `POST /api/admin/users/admin/{id}/reset-password`
- `PATCH /api/admin/users/admin/{id}/status`

### 8.4 Kader users

- `GET /api/admin/users/kader`
- `POST /api/admin/users/kader`
- `GET /api/admin/users/kader/{id}`
- `PUT /api/admin/users/kader/{id}`
- `POST /api/admin/users/kader/{id}/reset-password`
- `PATCH /api/admin/users/kader/{id}/status`
- `POST /api/admin/users/kader/import`

### 8.5 Lookup/filter support

- `GET /api/lookups/roles`
- `GET /api/lookups/districts`
- `GET /api/lookups/puskesmas`
- `GET /api/lookups/villages`

Catatan:

- endpoint lookup wajib mendukung filter berjenjang
- contoh:
  - `district_id`
  - `puskesmas_id`
  - `scope=mine`

## 9. Mapping Kebutuhan Frontend ke Backend

### 9.1 `/admin/settings/rbac`

Butuh data:

- daftar role
- daftar menu bertingkat
- matrix akses role-menu
- create role baru
- save perubahan mapping

Backend minimal:

- role CRUD ringan
- menu master read-only dulu
- sync matrix role-menu

### 9.2 `/admin/users/admin`

Butuh data:

- list user admin internal
- filter:
  - role
  - status
  - kecamatan
  - puskesmas
- detail user
- create/update admin
- reset password
- import batch opsional tahap berikut

Role yang masuk halaman ini untuk fase awal:

- `admin`
- `dinkes`
- `puskesmas`

Saya sarankan jangan campur role `kader` di endpoint ini.

### 9.3 `/admin/users/kader`

Butuh data:

- list user kader
- filter:
  - kecamatan
  - desa
  - puskesmas
  - status
- detail user
- create/update user kader
- reset password
- import batch

Data list ideal:

- kode kader
- username
- nama kader
- puskesmas
- desa
- area tugas
- jumlah survei
- last sync / last login
- status aktif

## 10. Seeder Minimum yang Harus Disiapkan

### 10.1 RoleSeeder

Seed:

- admin
- dinkes
- puskesmas
- kader

### 10.2 MenuSeeder

Seed menu minimal yang berhubungan dengan halaman aktif saat ini.

### 10.3 RoleMenuSeeder

Seed:

- admin dapat semua menu target
- dinkes read menu laporan dan user read-only bila dibutuhkan
- puskesmas dapat menu kader wilayah
- kader hanya menu operasionalnya

### 10.4 RegionScopeSeeder

Seed minimum untuk 1 skenario utuh:

- 1 dinkes
- 2 puskesmas
- beberapa desa
- 1 kader per desa

### 10.5 UserSeeder

Seed akun uji:

- `admin`
- `dinkes`
- `puskesmas`
- beberapa `kader`

Semua password seed harus:

- di-hash
- dicatat di dokumentasi dev
- diberi flag `must_reset_password = true` untuk akun non-demo bila perlu

## 11. Urutan Implementasi yang Direkomendasikan

### Fase 1. Audit dan stabilisasi schema

- inventaris tabel lama yang benar-benar akan dipakai
- tentukan naming canonical
- buat ERD final ringan untuk auth + role + scope
- putuskan strategi transisi dari dump lama

Output:

- schema canonical disepakati

### Fase 2. Bangun auth foundation

- install dan konfigurasi Sanctum
- extend tabel `users`
- implement login, logout, me
- implement forgot/reset password
- log `last_login_at`

Output:

- frontend bisa login ke backend nyata

### Fase 3. Bangun RBAC dan scope

- migrasi `roles`, `menus`, `role_menu`, `user_scopes`, mapping wilayah
- seed role dan menu
- buat `ScopeResolverService`
- enforce authorization di endpoint

Output:

- backend tahu siapa bisa lihat data apa

### Fase 4. Aktivasi `/admin/settings/rbac`

- ganti sumber data mock ke API
- list role dari DB
- list menu dari DB
- simpan matrix role-menu ke DB

Output:

- halaman RBAC tersambung ke backend

### Fase 5. Aktivasi `/admin/users/admin`

- endpoint list/detail/create/update admin internal
- filter sesuai role, status, wilayah
- reset password admin internal

Output:

- halaman user admin aktif penuh

### Fase 6. Aktivasi `/admin/users/kader`

- endpoint list/detail/create/update kader
- enforce one village one kader
- validasi `village_id` dalam cakupan `puskesmas_id`
- reset password kader
- import batch dasar

Output:

- halaman user kader aktif penuh

### Fase 7. Hardening dan audit

- audit log aksi sensitif
- rate limit login dan reset password
- test integration auth/RBAC
- rapikan frontend auth session dan route guard

Output:

- fondasi siap dipakai modul lain

## 12. Checklist Validasi Teknis

- migrasi Laravel bisa jalan dari nol
- seeder menghasilkan akun dan scope yang konsisten
- login berhasil untuk seluruh role utama
- `/me` menampilkan role dan scope benar
- admin melihat semua user
- dinkes hanya melihat puskesmas yang dimapping
- puskesmas hanya melihat kader di desanya
- kader tidak bisa mengakses halaman admin
- satu desa tidak bisa punya dua kader aktif
- reset password menghasilkan token valid
- frontend tidak lagi memakai `mockAuth` untuk login utama

## 13. Risiko dan Cara Menghindarinya

### Risiko 1: naming tabel lama bercampur

Mitigasi:

- jangan query langsung ke banyak varian tabel lama dari controller
- pilih satu schema canonical

### Risiko 2: logic scope bocor

Mitigasi:

- semua query list penting wajib melewati `ScopeResolverService`
- jangan mengandalkan filter dari frontend

### Risiko 3: RBAC hanya kosmetik menu

Mitigasi:

- selain menu mapping, tetap enforce gate/policy di API

### Risiko 4: reset password tidak aman

Mitigasi:

- pakai broker Laravel
- token expiry default
- rate limit endpoint

### Risiko 5: migrasi data lama mengotori auth baru

Mitigasi:

- aktifkan schema baru dulu
- importer data lama dibuat terpisah dan idempotent

## 14. Rekomendasi Keputusan Implementasi

Saya merekomendasikan keputusan berikut untuk eksekusi:

1. jadikan `users` Laravel sebagai tabel auth final
2. buat tabel baru `roles`, `menus`, `role_menu`, `user_scopes`, `puskesmas_villages`, `dinkes_puskesmas`
3. jangan aktifkan `mstr_users` sebagai auth source
4. gunakan Sanctum untuk login SPA
5. aktifkan tiga halaman frontend target dengan API nyata bertahap:
   - RBAC
   - admin users
   - kader users
6. data dump lama diperlakukan sebagai sumber migrasi referensi, bukan schema operasional utama

## 15. Next Step Eksekusi yang Paling Aman

Jika plan ini disetujui, urutan kerja implementasi yang paling aman adalah:

1. finalisasi schema canonical dan naming tabel
2. buat migrasi + model inti auth/RBAC/scope
3. buat seeder role/menu/user/scope
4. implement auth login/reset password
5. implement endpoint RBAC
6. implement endpoint admin user
7. implement endpoint kader user
8. ganti frontend dari mock ke API nyata

## 16. Catatan Lingkungan Kerja Saat Ini

Saya belum bisa menjalankan inspeksi container live atau migrasi Docker dari environment ini karena Docker daemon tidak tersedia pada sesi saat ini.

Implikasinya:

- planning ini sudah disusun dari codebase, compose file, dan dump SQL
- saat fase eksekusi nanti, kita tetap perlu verifikasi ulang:
  - status container
  - isi database aktif
  - hasil migrasi
  - hasil seeder

