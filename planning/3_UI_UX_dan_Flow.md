# Desain UI/UX & Alur Sistem (Flow)

## 1. Konsep UI/UX
- **Aesthetic & Premium:** Tampilan tidak sekadar MVP, tetapi menggunakan palet warna yang harmonis (misal: nuansa biru, teal, dan putih untuk kesan kesehatan), modern typography (Inter/Outfit), micro-animations (framer-motion di React), hover states, dan *glassmorphism* di elemen kartu tertentu.
- **Mobile-First untuk Kader:** Antarmuka input data harus difokuskan pada mobile web, mengingat kader menginput data langsung di lapangan. Tombol besar, form mudah ditekan, teks terbaca jelas di bawah sinar matahari.
- **Desktop-First untuk Admin/Puskesmas:** Dashboard analitik yang kompleks (Tabel, Peta, Grafik) difokuskan pada resolusi desktop atau tablet.

## 2. Alur Pengisian Survei (Kader) - Mode Wizard
Menerapkan konsep *Wizard/Step-by-step* untuk memecah form panjang menjadi bagian-bagian kecil.

### Step 1: Identitas & Demografi (Filter Umur)
- Input: Nama Lengkap, Alamat, Umur, Jenis Kelamin.
- **Logika:** Sistem mengambil nilai umur untuk menentukan pertanyaan instrumen apa saja yang akan ditampilkan selanjutnya.

### Step 2: Instrumen Dinamis Berdasarkan Umur
Berdasarkan dokumen, batasan indikator:
- Cuci Tangan: >= 10 tahun
- Aktivitas Fisik: >= 10 tahun
- Tidak Merokok: >= 10 tahun
- Konsumsi Buah/Sayur: >= 5 tahun
- Cek Tekanan Darah: >= 15 tahun
- Cek Gula Darah: >= 15 tahun
- *Sistem hanya memunculkan pertanyaan yang memenuhi syarat umur.*

### Step 3: Review & Submit
- Menampilkan ringkasan jawaban.
- Tombol Submit (Simpan sebagai Final) atau Simpan Draft.

## 3. Logika Penilaian "All-or-Nothing"
- Jika responden menjawab *TIDAK* atau *NEGATIF* pada minimal 1 dari indikator yang disyaratkan (sesuai umurnya), maka **Status Akhir = Tidak Sehat**.
- Contoh: Budi (20 tahun). Dia rajin cuci tangan, aktivitas fisik bagus, cek darah dan gula rutin, tapi dia *merokok*. Hasil akhir = **Tidak Sehat**.

## 4. Alur Dasbor Tindak Lanjut (Follow-Up)
- **Tampilan Khusus Kader/Puskesmas:** Menampilkan tabel responden berstatus "Tidak Sehat".
- **Aksi Intervensi:**
  1. Kader mengeklik nama responden.
  2. Muncul *modal* atau *drawer* berisi indikator apa saja yang menyebabkan statusnya Tidak Sehat (contoh: "Merokok").
  3. Kader mencatat aksi intervensi (Edukasi bahaya merokok tanggal sekian).
  4. Responden akan masuk dalam daftar Pantauan.
  5. Setelah kurun waktu tertentu, dilakukan survei ulang parsial/total, jika perilaku membaik, status diperbarui menjadi **Sehat**.

## 5. Komponen Dashboard Pelaporan Integratif
- **Progress Bar Target Kader:** Menampilkan progres survei Kader (misal: "Anda telah mensurvei 120 dari target 250 warga desa ini").
- **Summary Cards (KPI):** Total Responden, % Perilaku Sehat, Total Puskesmas Terlibat.
- **Grafik Batang/Donut (Recharts/Chart.js):** Capaian tiap indikator (Cuci Tangan vs Merokok vs Aktivitas Fisik).
- **Peta Interaktif Wilayah:**
  - Layer warna: Hijau (Capaian Sehat >80%), Kuning (50-80%), Merah (<50%).
  - Peta di-*drilldown* dari level Provinsi -> Kabupaten -> Kecamatan -> Desa.
- **Filter Universal:** Filter tanggal/tahun, wilayah (berdasarkan hak akses), untuk mengontrol seluruh data di dashboard.
