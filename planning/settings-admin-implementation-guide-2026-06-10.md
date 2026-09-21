# Settings Admin Implementation Guide

Tanggal: 10 Juni 2026
Project: SIS-PHS
Fokus: panduan implementasi module `Settings` admin untuk halaman:

- `/admin/settings/periods`
- `/admin/settings/rbac`
- `/admin/settings/audit`

## Tujuan

Dokumen ini menjadi acuan implementasi area settings admin agar:

- struktur halaman konsisten dengan pola `Master Data`
- fungsi pengaturan tetap terasa operasional, bukan dashboard report
- layout, action bar, filter area, table, modal, dan loading state seragam
- semua halaman memiliki `skeleton loading` yang sesuai konteks
- implementasi tidak melebar ke perubahan logic lain di luar target halaman

## Kondisi Saat Ini

Mapping halaman saat ini:

- `/admin/settings/periods`
  - memakai komponen `SystemSettings`
  - masih berupa placeholder generic
- `/admin/settings/rbac`
  - memakai komponen `MasterRoleMenu`
  - sudah punya mock role-menu mapping, tetapi belum mengikuti pola master data admin saat ini
- `/admin/settings/audit`
  - memakai komponen `AuditLogs`
  - masih berupa placeholder generic

Kesimpulan:

- `periods` dan `audit` perlu dibangun ulang penuh
- `rbac` perlu dirapikan agar selaras dengan struktur visual master data yang sudah ada
- ketiga halaman harus memakai pola `AdminDataPageSkeleton`

## Prinsip UI/UX

### Pendekatan Utama

Untuk area `Settings`, gunakan pendekatan yang sama dengan `Master Data`, yaitu:

- `table-first`
- operasional lebih dominan dibanding insight
- action utama lebih jelas daripada chart
- ringkasan KPI boleh ada, tetapi ringan dan mendukung pekerjaan admin

### Konsistensi Layout

Setiap halaman wajib memakai urutan blok:

1. header halaman
2. action area
3. summary cards operasional
4. filter/search area
5. table utama
6. pagination
7. modal/detail drawer jika dibutuhkan

### Komponen Dasar yang Wajib Sama

- `master-card-shell`
- `StatCard`
- `FilterBar`
- `FilterPanel`
- `DataTable`
- `Modal`
- `AdminDataPageSkeleton`

### Batasan

- tidak membuat halaman settings terasa seperti dashboard analytics
- tidak menambah chart besar kecuali benar-benar diperlukan
- tidak mengubah logic route/menu yang sudah benar
- tidak mengubah struktur folder yang sudah ada

## Pola Skeleton Loading

Semua halaman settings wajib memiliki skeleton dengan pola berikut:

### Struktur Skeleton Standar

- header skeleton
- action button skeleton
- 3 sampai 4 summary card skeleton
- filter/search skeleton
- table skeleton
- pagination skeleton

### Ketentuan Skeleton

- gunakan `AdminDataPageSkeleton`
- jumlah kolom table mengikuti kompleksitas halaman
- `filterFieldCount` disesuaikan dengan kebutuhan per halaman
- untuk halaman yang punya panel kiri-kanan khusus seperti RBAC, tetap gunakan skeleton versi admin sebagai baseline, lalu tambahkan variasi bila perlu saat implementasi

## Halaman 1: `/admin/settings/periods`

### Nama Halaman

`Periode & Target Tahunan`

### Tujuan Halaman

Dipakai admin untuk:

- mengelola periode survey aktif
- membuka/menutup periode per tahun
- mengatur target tahunan
- melihat status periode berjalan dan kesiapan operasional

### Karakter Halaman

Halaman ini tetap `table-first`, tetapi punya ringkasan operasional di atas tabel.

### Struktur UI yang Disarankan

1. Header
   - title: `Periode & Target Tahunan`
   - description: ringkasan fungsi pembukaan periode, target tahunan, dan status operasional
2. Action bar
   - `Refresh Filter`
   - `Export Data`
   - `Tambah Periode`
3. Summary cards
   - `Periode Terdaftar`
   - `Periode Aktif`
   - `Target Tahunan`
   - `Periode Ditutup`
4. Filter/search area
   - Search
   - Tahun
   - Status Periode
   - Tipe Periode
5. Table utama
6. Pagination
7. Modal
   - Detail periode
   - Form tambah/edit periode
   - Konfirmasi buka/tutup periode

### Kolom Tabel yang Disarankan

- Tahun
- Periode
- Tanggal Mulai
- Tanggal Selesai
- Target Rumah Tangga / Keluarga
- Status
- Last Updated
- Aksi

### Aksi Per Baris

- `Detail`
- `Edit`
- `Buka/Tutup Periode`

### Filter yang Disarankan

- `Tahun`
- `Status`
- `Tipe Periode`

### Modal/Form Fields yang Disarankan

- Tahun
- Nama Periode
- Jenis Periode
- Tanggal Mulai
- Tanggal Selesai
- Target Tahunan
- Keterangan / Catatan Admin
- Status Aktif

### Skeleton Halaman

- `tableColumnCount`: 8
- `filterFieldCount`: 4
- `statCount`: 4
- `actionCount`: 3

### Catatan UX

- status periode harus sangat mudah dibaca
- gunakan badge `Aktif`, `Draft`, `Ditutup`
- aksi buka/tutup periode sebaiknya tidak langsung, harus lewat modal konfirmasi
- target tahunan harus terlihat jelas tanpa membuka detail

## Halaman 2: `/admin/settings/rbac`

### Nama Halaman

`Manajemen Role & Menu`

### Tujuan Halaman

Dipakai admin untuk:

- mengatur akses menu berdasarkan role
- melihat role aktif dan cakupan aksesnya
- memastikan menu sidebar sesuai hak akses
- menyiapkan baseline integrasi RBAC backend

### Karakter Halaman

Halaman ini bukan report. Fokusnya operasional dan konfiguratif.

Secara UI, halaman ini boleh sedikit berbeda dari master data biasa karena membutuhkan area pemetaan role-menu, tetapi tetap harus memakai pola komponen admin yang sama.

### Struktur UI yang Disarankan

1. Header
   - title: `Manajemen Role & Menu`
   - description: pemetaan role terhadap menu dan cakupan akses sistem
2. Action bar
   - `Refresh Data`
   - `Reset Perubahan`
   - `Simpan Perubahan`
3. Summary cards
   - `Total Role`
   - `Role Aktif`
   - `Total Menu`
   - `Menu Terpetakan`
4. Workspace utama dua kolom
   - panel kiri: daftar role
   - panel kanan: struktur menu dan akses
5. Filter/search kecil
   - search role/menu
   - status role
   - group menu
6. Panel detail role aktif
7. Sticky action footer bila diperlukan

### Struktur Panel Kiri

- daftar role sebagai selectable cards atau list
- menampilkan:
  - nama role
  - deskripsi singkat
  - jumlah menu aktif
  - status aktif/nonaktif

### Struktur Panel Kanan

- tree menu berdasarkan group
- checkbox parent-child
- count akses per group
- area detail ringkas role aktif

### Fitur yang Wajib Ada

- expand/collapse group menu
- toggle akses per menu
- toggle semua child dalam satu group
- indikator perubahan belum disimpan
- save confirmation state

### Filter yang Disarankan

- `Pencarian Role/Menu`
- `Status Role`
- `Grup Menu`

### Tabel Pendukung

Jika ingin tetap menjaga pola master data, bagian bawah halaman dapat menampilkan tabel ringkas:

- Role
- Total Menu Aktif
- Modul Utama
- Last Updated
- Updated By
- Aksi

Namun tabel ini opsional. Fokus utama tetap pada workspace pemetaan.

### Skeleton Halaman

Gunakan skeleton khusus berbasis `AdminDataPageSkeleton` dengan penyesuaian visual:

- header skeleton
- 4 summary card skeleton
- panel kiri role list skeleton
- panel kanan permission tree skeleton
- action button skeleton

Parameter dasar bila tetap memakai komponen global:

- `tableColumnCount`: 6
- `filterFieldCount`: 3
- `statCount`: 4
- `actionCount`: 3

Tambahan kebutuhan visual saat implementasi:

- 4 sampai 6 card role skeleton di panel kiri
- 3 sampai 5 group permission skeleton di panel kanan

### Catatan UX

- role aktif harus sangat jelas terlihat
- perubahan yang belum disimpan harus punya indicator
- jangan membuat admin scroll horizontal untuk tree menu
- gunakan hierarchy visual yang tenang dan mudah dipindai
- hindari terlalu banyak warna; badge dan active state saja yang menonjol

## Halaman 3: `/admin/settings/audit`

### Nama Halaman

`Audit Trail`

### Tujuan Halaman

Dipakai admin untuk:

- melacak aktivitas penting pengguna
- meninjau perubahan data, login, approval, export, dan perubahan akses
- melakukan audit operasional internal

### Karakter Halaman

Tetap `table-first` dan sangat cocok untuk gaya master data.

### Struktur UI yang Disarankan

1. Header
   - title: `Audit Trail`
   - description: pemantauan aktivitas dan perubahan penting dalam sistem
2. Action bar
   - `Refresh Filter`
   - `Export Log`
3. Summary cards
   - `Total Aktivitas`
   - `Login Hari Ini`
   - `Perubahan Data`
   - `Aktivitas Sensitif`
4. Filter/search area
5. Table utama
6. Pagination
7. Modal detail log

### Kolom Tabel yang Disarankan

- Waktu
- User
- Role
- Modul
- Aktivitas
- Objek / Entitas
- IP Address
- Status
- Aksi

### Filter yang Disarankan

- `Tanggal`
- `Role`
- `Modul`
- `Tipe Aktivitas`

Catatan:

- jika perlu menjaga kesederhanaan tahap awal, `Tanggal` bisa berupa preset sederhana
- filter tambahan lain dianggap change request lanjutan

### Modal Detail yang Disarankan

- timestamp lengkap
- nama user
- role user
- route/modul
- action type
- target entity
- old value / new value preview
- IP address
- device / browser summary
- correlation note jika ada

### Skeleton Halaman

- `tableColumnCount`: 9
- `filterFieldCount`: 4
- `statCount`: 4
- `actionCount`: 2

### Catatan UX

- teks aktivitas harus tetap mudah dibaca meskipun panjang
- kolom `Aktivitas` dan `Objek` bisa memakai 2-line layout
- `IP Address` dan metadata teknis cukup tampil mono kecil
- modal detail harus lebih informatif daripada tabel, bukan hanya pengulangan

## Standar Visual Settings vs Master Data

Karena user meminta “sama halnya seperti halaman master data”, maka halaman settings harus mengikuti prinsip berikut:

- header visual sama dengan master data admin
- summary cards ringkas dan operasional
- action utama berada di kanan atas
- table tetap menjadi pusat halaman
- modal form memakai gaya yang sama dengan master data
- filter panel tetap collapsible

Perbedaan yang diperbolehkan:

- halaman RBAC boleh memakai `split layout`
- halaman periods boleh menonjolkan badge status periode
- halaman audit boleh lebih padat secara informasi

## Mapping Komponen per Halaman

### Periods

- `StatCard`
- `FilterBar`
- `FilterPanel`
- `DataTable`
- `Modal`
- `AdminDataPageSkeleton`

### RBAC

- `StatCard`
- panel role selector custom
- panel permission tree custom
- `Modal` bila perlu detail role
- `AdminDataPageSkeleton` sebagai baseline loading

### Audit

- `StatCard`
- `FilterBar`
- `FilterPanel`
- `DataTable`
- `Modal`
- `AdminDataPageSkeleton`

## Checklist Implementasi

- [ ] pastikan route `/admin/settings/periods` tetap memakai struktur folder yang ada
- [ ] pastikan route `/admin/settings/rbac` tetap memakai struktur folder yang ada
- [ ] pastikan route `/admin/settings/audit` tetap memakai struktur folder yang ada
- [ ] samakan visual shell dengan halaman master data admin
- [ ] semua halaman punya `Refresh`
- [ ] semua halaman punya `search`
- [ ] semua halaman punya `table`
- [ ] semua halaman punya `pagination`
- [ ] semua halaman punya `skeleton loading`
- [ ] modal detail tersedia minimal pada `periods` dan `audit`
- [ ] halaman `rbac` punya state perubahan belum disimpan
- [ ] export tersedia minimal pada `periods` dan `audit`
- [ ] verifikasi akhir dengan `npm run build`

## Urutan Eksekusi yang Disarankan

1. Rapikan `SystemSettings` menjadi halaman `Periode & Target Tahunan`
2. Rapikan `AuditLogs` menjadi halaman `Audit Trail`
3. Refactor `MasterRoleMenu` agar menyatu dengan style master data admin
4. Tambahkan data mock/service bila perlu, terpisah dari logic modul lain
5. Tambahkan skeleton loading pada ketiga halaman
6. Sinkronkan label route dan header bila ada mismatch
7. Build dan verifikasi

## Catatan Implementasi

- Gunakan data mock/service terpisah untuk settings admin bila diperlukan.
- Jangan mencampur service report dengan service settings.
- Jangan ubah struktur route yang sudah benar.
- Pertahankan pola `useAdminPageSkeleton` yang sudah dipakai di master/report.
- Bila backend nyata belum tersedia, utamakan kualitas UI state:
  - loading
  - empty state
  - populated state
  - modal state
  - save state

## Output yang Diharapkan Setelah Implementasi

- `/admin/settings/periods` tampil sebagai halaman operasional pengelolaan periode yang matang
- `/admin/settings/rbac` tampil sebagai workspace pemetaan role-menu yang rapi dan aman dipakai admin
- `/admin/settings/audit` tampil sebagai tabel audit yang siap dipakai monitoring internal
- ketiganya konsisten dengan kualitas visual dan interaksi halaman master data yang sudah ada
