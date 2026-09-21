# Role-Based Access Control (RBAC) & Roadmap Pengembangan

## 1. Role-Based Access Control (RBAC)
Keamanan data dan hak akses diatur secara ketat berdasarkan tingkatan organisasi:

1. **Admin / Super Admin:**
   - **Akses:** Bebas penuh terhadap semua menu dan modul.
   - **Fitur Khusus:** Pengaturan master data wilayah (CRUD), manajemen akun pengguna/user (kader, puskesmas, dll), manajemen instrumen/pertanyaan (jika ada update di tahun berikutnya), dan pengaturan target KPI tahunan.
2. **Dinas Kesehatan (Dinkes):**
   - **Akses:** Read-only & agregat.
   - **Fitur Khusus:** Melihat rekapitulasi data per Kabupaten/Kota, ranking Puskesmas dengan capaian PHS terbaik/terburuk, mencetak laporan tingkat kota/kabupaten.
3. **Puskesmas:**
   - **Akses:** Manajemen dan verifikasi tingkat wilayah kerja (gabungan beberapa desa).
   - **Fitur Khusus:** Validasi data yang disubmit oleh kader (approve/reject/revisi), melihat agregat per desa di wilayah kerjanya, memantau kader yang belum memenuhi target, dashboard capaian puskesmas.
4. **Kader (Desa):**
   - **Akses:** Operasional tingkat lapangan.
   - **Fitur Khusus:** Input data responden (hanya untuk warga desanya sendiri), akses dasbor tindak lanjut untuk warganya, progress bar target pribadi, dan pengelolaan intervensi.
5. **Viewer / Eksekutif:**
   - **Akses:** Dasbor visualisasi ringkas, tanpa fitur manajemen.

## 2. Struktur Pelaporan Berjenjang
Format pelaporan diekspor dalam bentuk PDF, Excel (XLSX), dan CSV. Berdasarkan Dokumen PHS (Halaman 6):
- **Laporan Individu:** Detail profil responden dan jawaban indikator per orang.
- **Laporan Desa/Kelurahan:** Agregat persentase status PHS dan indikator per RT/RW (opsional) atau per desa.
- **Laporan Puskesmas:** Rekap seluruh desa dalam satu puskesmas.
- **Laporan Kecamatan:** Gabungan puskesmas.
- **Laporan Kabupaten/Kota:** Laporan tingkat dinas kesehatan yang menampilkan seluruh puskesmas dan kecamatan.

## 3. Roadmap Fase Pengembangan

### Fase 1: Minimum Viable Product (MVP)
- Setup Monorepo (Next.js & NestJS), Database PostgreSQL.
- Modul Autentikasi dan Manajemen Role (RBAC dasar).
- Modul Form Survei PHS (Wizard UI, Filter Umur, Kalkulasi Otomatis Status "Tidak Sehat").
- Halaman List Data & Rekap Standar (Ekspor Excel).
- Dasbor Tindak Lanjut (Menampilkan daftar responden "Tidak Sehat" untuk Kader).

### Fase 2: Dashboard & Visualisasi Kompleks
- Pembuatan Peta Interaktif (Leaflet/Mapbox) dengan polygon wilayah.
- Integrasi Dashboard Analytics (Recharts) dengan filter wilayah berjenjang.
- Progress Bar Target Tahunan per Kader.
- Laporan PDF yang di-generate otomatis oleh backend.

### Fase 3: Optimasi & Advanced Features
- **PWA (Progressive Web App):** Mode Offline untuk Kader saat berada di blank spot internet, data di-sync saat online.
- Audit Trail / Log Activity yang detail.
- Custom Report Builder (memungkinkan Dinkes memodifikasi bentuk laporan).
- Fitur notifikasi (email/WA) untuk pengingat tindak lanjut bagi Kader.
