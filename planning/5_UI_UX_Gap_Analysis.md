# Ringkasan Percakapan, Gap Analysis, & Rencana UI/UX Frontend

Dokumen ini merangkum *progress* yang telah dilakukan, mengidentifikasi *mismatch* (ketidaksesuaian) atau *gap* (kekurangan) dari *template* yang ada saat ini dibandingkan dengan dokumen PRD, serta merinci seluruh kebutuhan halaman untuk fase pengerjaan UI/UX pada `sis-phs/frontend`.

## 1. Ringkasan Progress Saat Ini
- **Arsitektur Docker:** Telah disiapkan *container* untuk MySQL (9003), Backend Laravel 13 (9002), dan Frontend React Vite (9001) di dalam *directory* `sis-phs/`.
- **Backend:** Laravel 13 telah sukses diinstal pada *container* backend.
- **Frontend:** API `fetch` pada `src/services/api.js` telah dimodifikasi menjadi **MOCK STATIS**. Hal ini memampukan kita untuk membangun dan mendesain UI/UX secara utuh tanpa ketergantungan pada *endpoint* backend yang belum selesai.

---

## 2. Kebutuhan Halaman (Berdasarkan PRD & Role)

Sistem UI/UX akan dibagi menjadi dua pendekatan utama: **Mobile-First** (untuk Surveyor/Kader di lapangan) dan **Desktop-First** (untuk level Manajerial/Dashboard Analytics).

### A. Tampilan Umum
1. **Login Page:** Autentikasi dan *routing* dinamis berdasarkan *role* pengguna setelah sukses masuk.

### B. Tampilan Surveyor / Kader (Mobile-First)
2. **Dashboard Surveyor (Beranda Kader):**
   - *Widget* ringkas: Total survei selesai, target harian/tahunan (Progress Bar).
   - Akses cepat untuk "Mulai Survei Baru".
   - Riwayat data survei yang berstatus *Draft* (belum disubmit).
3. **Form Input Survei PHS (Wizard / Stepper Mode):**
   - **Step 1:** Identitas Responden (Nama, Alamat, Umur). Umur menjadi parameter *filter* dinamis.
   - **Step 2:** Instrumen Pertanyaan. Hanya muncul sesuai batas umur (misal: Pertanyaan Merokok hanya untuk >= 10 tahun).
   - **Step 3:** Hasil Kalkulasi Otomatis (Sehat / Tidak Sehat) dengan logika *All-or-Nothing*.
   - **Step 4:** *Review* dan *Submit* data ke Puskesmas.
4. **Dasbor Tindak Lanjut (Follow-Up Intervensi):**
   - Daftar warga desa berstatus "Tidak Sehat".
   - Fitur log pencatatan aksi intervensi (Edukasi, Promosi) hingga status menjadi "Sehat".

### C. Tampilan Puskesmas (Desktop / Tablet)
5. **Dashboard Puskesmas:** Monitoring kader dan capaian desa.
6. **Halaman Verifikasi Data:** Tabel daftar survei masuk dari kader untuk di-*approve*, *reject*, atau minta direvisi.

### D. Tampilan Dinkes / Admin / Eksekutif (Desktop-First)
7. **Dashboard Analytics & KPI Makro:** 
   - Summary Cards, Grafik Tren Antar Periode, Ranking Wilayah.
8. **Peta Interaktif (Map Analytics):** 
   - Pemetaan *Geospatial* menggunakan *color-coding* (Hijau, Kuning, Merah) dengan fitur *drilldown* dari Provinsi hingga Desa.
9. **Laporan Rekapitulasi (Reporting):** 
   - Tabel agregat berjenjang dan fitur *Export* (Excel, CSV, PDF).
10. **Master Data (Super Admin):** Pengaturan wilayah, user, periode survei.

---

## 3. Gap Analysis & Mismatch pada Template Saat Ini

Berdasarkan pengecekan awal pada `sis-phs/frontend/package.json` dan struktur *template* React saat ini, terdapat beberapa **gap teknis dan desain** yang harus kita selesaikan pada fase pengerjaan berikutnya:

### Gap Desain & UX (Sesuai Aesthetic PRD)
- **Tampilan Premium & Modern:** *Template* saat ini kemungkinan memiliki UI *dashboard* standar. Kita perlu merombak tema (*Tailwind Config*) untuk memasukkan warna harmonis, *glassmorphism*, dan tipografi modern (seperti *Inter* atau *Outfit*).
- **Ketiadaan Komponen Wizard/Stepper:** Form survei Kader harus bertahap (*step-by-step*) agar mudah ditekan di layar HP. Komponen *multi-step form* ini harus dibangun dari awal.
- **Micro-animations:** Kita perlu menambahkan transisi *smooth* antar halaman atau antar *step* survei (bisa menggunakan *Framer Motion* atau CSS murni).

### Gap Pustaka (Library)
- **Map / Peta Interaktif:** `package.json` saat ini hanya memiliki `apexcharts` untuk grafik batang/pie. **Mismatch:** Peta interaktif (GeoJSON) sangat diwajibkan di PRD. **Aksi Next:** Kita harus menginstal `leaflet` dan `react-leaflet`.
- **Form State Management:** Modul *Wizard Form* membutuhkan validasi dinamis berdasarkan umur. **Aksi Next:** Membutuhkan integrasi `react-hook-form` dan `yup`/`zod` agar *state* inputan kader tetap terjaga antar *step*.
- **Icon Set:** Membutuhkan pustaka ikon yang elegan (seperti `lucide-react` atau `heroicons`).

### Gap Data (Mocking)
- **Struktur Data Kompleks:** Modifikasi `api.js` saat ini hanya mengembalikan respon *dummy* kosong. **Aksi Next:** Kita perlu membuat struktur objek JSON palsu yang meniru pohon hierarki wilayah, master pertanyaan dinamis, dan hasil perhitungan *All-or-Nothing* agar visualisasi grafik dan peta bisa dirancang.

---

## 4. Tindakan Selanjutnya (Action Plan)
1. **Penyesuaian Dependency:** Menginstal pustaka peta (`leaflet`) dan form validasi ke dalam *frontend*.
2. **Setup Theming (Tailwind):** Merombak *styling* utama agar sesuai dengan standar estetika *premium*.
3. **Pembuatan Komponen Inti:** Fokus pertama pada membangun struktur `WizardForm` untuk kader dan `MapAnalytics` untuk admin.
