# Rencana Implementasi UI/UX & Pemetaan Menu Dinamis SIS-PHS

## Konteks & Tujuan
Sebagai Senior UI/UX Web Designer, fokus pada fase ini adalah merancang antarmuka frontend (UI/UX) berbasis **responsive web** dengan pendekatan template tunggal *(Single Unified Template)*. Sistem akan mengakomodasi multi-role (Kader, Puskesmas, Dinkes, Admin) di mana menu navigasi akan diload secara dinamis dari database sesuai dengan hak akses (RBAC), yang pengaturannya dapat dikelola melalui halaman Setting.

---

## 1. Analisis Kondisi Saat Ini vs Kondisi Seharusnya (Mismatch)

Berdasarkan analisis arsitektur, database (`schema.sql`), dan dokumen rancangan sebelumnya, berikut adalah pemetaan *gap* atau *mismatch* terkait UI/UX dan struktur menu:

| Aspek | Kondisi Saat Ini (Mismatch) | Kondisi Seharusnya (Ideal State) |
| :--- | :--- | :--- |
| **Konsep Template & Layout** | Kemungkinan masih membedakan layout berdasarkan role (hardcoded), atau desain UI yang standar/kaku. | **Single Unified Template**: Satu layout responsif dengan tema **Modern Flat Rounded** (desain datar tanpa bayangan tebal, sudut melengkung/rounded corners tegas, dan tipografi modern) yang beradaptasi secara dinamis. |
| **Sistem Menu & Navigasi** | Rute dan Sidebar Menu bersifat *hardcoded* di komponen Frontend (React Router). | **Data-Driven Menu**: Menu diload dari database (mock API untuk sementara) saat user login. Sidebar akan me-*render* item sesuai data JSON yang diterima. |
| **Manajemen Hak Akses Menu** | Belum ada rancangan UI untuk mengatur akses menu per role. Role hanya dibatasi di level sistem/tabel dasar. | **Halaman Pengaturan Role & Menu**: Harus ada antarmuka khusus (untuk Admin) guna memetakan `Role` <-> `Menu Akses` melalui *checkbox/toggle*. |
| **Responsivitas Berbasis Role** | Belum dioptimasi secara spesifik berdasarkan *use-case* lapangan. | **Adaptive Responsiveness**: Form Survei Kader dioptimasi penuh untuk Mobile (tombol besar, *stepper*). Dashboard Dinkes/Puskesmas dioptimasi untuk Desktop (tabel data lebar, peta geospasial). |

---

## 2. Pemetaan Menu & Halaman Lengkap

Karena template akan sama untuk semua entitas, perbedaan hanya terletak pada item menu yang muncul di *Sidebar*. Berikut adalah rancangan struktur *database-driven* menu yang diperlukan:

### A. Grup Menu: Beranda & Dashboard
*Analitik dan ringkasan data yang menyesuaikan dengan role login.*
- **Dashboard Kader**: Ringkasan target pribadi, tombol mulai survei cepat. *(Role: Kader)*
- **Dashboard Puskesmas**: Pantauan kinerja kader dan capaian desa di bawah puskesmas. *(Role: Puskesmas, Admin)*
- **Dashboard Analytics Dinkes**: KPI Makro, grafik tren tingkat kabupaten/provinsi. *(Role: Dinkes, Admin)*
- **Peta Geospasial**: Peta interaktif dengan *color-coding* capaian PHS (Drilldown). *(Role: Dinkes, Admin)*

### B. Grup Menu: Operasional Survei (Mobile-Optimized)
*Menu transaksional utama untuk input data di lapangan.*
- **Mulai Survei Baru**: Form *Wizard/Stepper* dinamis berbasis umur. *(Role: Kader)*
- **Draft Survei**: Daftar survei yang belum di-submit. *(Role: Kader)*
- **Riwayat Survei Saya**: Daftar survei yang telah selesai. *(Role: Kader)*
- **Verifikasi Data**: Tabel persetujuan/penolakan data dari Kader. *(Role: Puskesmas)*

### C. Grup Menu: Tindak Lanjut & Intervensi
*Menu untuk memantau warga yang terdeteksi "Tidak Sehat".*
- **Pantauan Intervensi**: Daftar keluarga/responden tidak sehat dan input log edukasi. *(Role: Kader, Puskesmas)*

### D. Grup Menu: Laporan (Desktop-Optimized)
*Rekapitulasi data.*
- **Laporan Capaian Desa**: *(Role: Puskesmas, Dinkes, Admin)*
- **Laporan Agregat Wilayah**: Export ke PDF/Excel. *(Role: Dinkes, Admin)*

### E. Grup Menu: Master Data
*Pengelolaan referensi data sistem.*
- **Master Wilayah**: Prov, Kab, Kec, Desa, Puskesmas. *(Role: Admin)*
- **Master Pengguna**: Manajemen akun user. *(Role: Admin, Puskesmas [terbatas])*
- **Master Instrumen/Soal**: Manajemen pertanyaan dan logika umur. *(Role: Admin)*

### F. Grup Menu: Pengaturan Sistem (Settings)
*Menu pengaturan kunci.*
- **Periode & Target Tahunan**: Buka/tutup tahun survei. *(Role: Admin)*
- **Manajemen Role & Menu (RBAC)**: Interface pemetaan (Role A bisa akses Menu X, Y). *(Role: Admin)*

---

## 3. Rencana Eksekusi Implementasi (Action Plan)

Kita akan membangun *framework* UI/UX frontend ini dengan tahapan berikut:

### Fase 1: Setup Tema Global & Unified Layout
1. **Tailwind Config & Aesthetics**: Merancang warna tema (Teal/Biru Kesehatan modern), font (Inter/Outfit), dan utilitas UI untuk tema **Modern Flat Rounded** (pengaturan `borderRadius` besar seperti `rounded-2xl` atau `rounded-3xl`, warna solid/flat tanpa gradien berlebih, bayangan sangat halus atau flat border).
2. **Unified Layout Shell**: Membuat komponen `MainLayout`, `Sidebar`, dan `Topbar` yang responsif. Sidebar akan membaca *state* global untuk me-render daftar navigasi.

### Fase 2: Implementasi Dynamic Menu (Data-Driven)
3. **Mocking Data Menu**: Menyusun JSON *mock* di `api.js` untuk merespons struktur menu bertingkat yang bergantung pada `role_id` user yang login.
4. **Dynamic Sidebar Component**: Mengubah Sidebar agar memetakan JSON tersebut menjadi link navigasi secara rekursif (termasuk *dropdown* menu).

### Fase 3: Pembuatan Halaman Inti UI/UX (Mockup to Code)
5. **UI Settings Role & Menu**: Membuat halaman "Manajemen Role & Menu" (tabel matriks dengan *checkbox*) untuk memvisualisasikan bagaimana menu diatur ke depannya.
6. **UI Dashboard & Peta**: Menyusun struktur visual *Dashboard Card* dan integrasi awal Peta (Leaflet) tanpa memusingkan *backend data* yang asli.
7. **UI Mobile Form Wizard**: Mendesain *multi-step form* khusus untuk Kader yang sangat ramah *mobile*.

## Open Questions untuk Review Anda:
> [!IMPORTANT]
> 1. Untuk struktur Database Menu, apakah Anda setuju jika kita buat mock *JSON tree* berjenjang (Parent -> Child) di frontend sementara waktu, sebelum backend siap?
> 2. Apakah fase pertama kita akan mulai merombak *Main Layout* dan *Sidebar Dinamis* di proyek React yang ada di dalam folder `sis-phs/frontend` saat ini?
