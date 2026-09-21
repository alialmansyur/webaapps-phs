# Ringkasan Percakapan RBAC Admin UI/UX

Tanggal: 10 Juni 2026
Project: SIS-PHS
Fokus: sidebar admin dan halaman `/admin/settings/rbac`

## Tujuan Utama

- admin harus bisa mengakses seluruh halaman semua role
- sidebar admin menjadi sumber struktur menu utama
- halaman `/admin/settings/rbac` difokuskan untuk pembagian akses halaman per role
- implementasi tetap memakai struktur folder yang sudah ada
- tidak mengubah logic route/module lain di luar target

## Keputusan Sidebar Admin

- sidebar admin menampilkan semua menu lintas role
- struktur sidebar admin disederhanakan menjadi kategori tunggal, tidak ada grup serupa yang terpisah
- kategori final sidebar admin:
  - `Dashboard`
  - `Survei`
  - `Intervensi`
  - `Peta & Monitoring`
  - `Laporan`
  - `Master Data`
  - `Manajemen Pengguna`
  - `Profil & Sinkronisasi`
  - `Pengaturan Sistem`
- untuk menu dengan tampilan/halaman yang sama, cukup tampilkan satu entry saja
- dashboard cukup memakai parent `Dashboard`, detail per role berada di submenu

## Keputusan Halaman RBAC

- halaman `/admin/settings/rbac` disederhanakan menjadi workspace konfigurasi akses
- fokus halaman:
  - pilih role
  - tambah role
  - assign akses halaman per role
- tidak perlu layout dua panel atau summary dashboard-like
- struktur utama halaman:
  1. header ringkas
  2. action header: `Refresh`, `Tambah Role`
  3. control row: `Kategori`, `Role`, `Simpan`
  4. search
  5. tree table / collapse table

## Struktur Tree RBAC

- tree RBAC harus mengikuti struktur sidebar admin
- label kategori di RBAC harus sama dengan label sidebar admin
- tidak memakai istilah seperti `lintas role`
- tidak perlu deskripsi tambahan pada row kategori
- tidak perlu informasi asal menu pada row child
- child row cukup menampilkan:
  - nama halaman
  - route
  - checkbox akses

## Keputusan UI Table

- format utama adalah table tree diagram dengan expand/collapse
- row kategori bisa toggle semua child sekaligus
- row child bisa toggle akses satu per satu
- tabel dibuat compact
- garis strip/connector di child row dihilangkan
- padding row diperkecil agar lebih rapat
- checkbox aktif memakai warna primary/teal

## Keputusan Header dan Kontrol

- judul halaman: `Role Manager`
- deskripsi singkat dan general:
  - `Pengaturan akses role dan halaman sistem.`
- tombol `Simpan`:
  - tidak full width
  - lebar mengikuti konten
  - tinggi disamakan dengan field select di sampingnya
- filter `Kategori`, `Role`, dan tombol `Simpan` ditempatkan di blok terpisah di bawah header

## Keputusan Role Management

- tersedia modal `Tambah Role`
- role baru dibuat dengan akses halaman kosong
- setelah role dibuat, admin langsung bisa assign akses melalui tree table

## Batasan Implementasi

- gunakan struktur folder existing
- jangan mengubah route yang sudah benar
- jangan mengubah logic halaman lain di luar scope target
- utamakan UI/UX yang matang dan siap dihubungkan ke backend RBAC nanti

## Validasi yang Sudah Dilakukan

- perubahan sidebar admin sudah diterapkan
- perubahan halaman `/admin/settings/rbac` sudah diterapkan
- build frontend berhasil dengan `npm run build`
- warning ukuran chunk Vite masih ada, tetapi bukan blocker dan bukan akibat perubahan logic target

## Acuan untuk Halaman Selanjutnya

- jadikan sidebar admin sebagai source of truth untuk struktur menu
- hindari duplikasi kategori yang serupa
- jika ada halaman dengan tampilan/komponen sama, tampilkan satu entry saja dalam mapping akses
- untuk halaman admin operasional, prioritaskan layout yang ringkas, table-first, dan mudah dipindai
- action utama harus jelas, tetapi tidak boleh mendominasi layout
