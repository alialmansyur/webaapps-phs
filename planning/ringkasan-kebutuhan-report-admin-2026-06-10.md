# Ringkasan Kebutuhan Report Admin

Tanggal: 10 Juni 2026
Project: SIS-PHS
Fokus: penguatan group menu laporan admin, standardisasi filter, dan pembedaan UX antara module `Master` dan `Reports`

## Tujuan Umum

- Melanjutkan implementasi admin area khususnya pada group menu laporan.
- Menyusun struktur laporan survey yang lebih operasional dan siap dikembangkan ke data nyata.
- Menetapkan arah UI/UX agar module `Reports` punya karakter berbeda dari `Master`, namun tetap konsisten secara design system.

## Keputusan Struktur Menu Reports Admin

Menu `/admin/reports/raw-data` tidak lagi dibutuhkan dan harus dihapus dari area admin.

Group menu laporan admin difokuskan menjadi kumpulan laporan survey berikut:

- `/admin/reports/survey-progress`
  - label: `Progress & Coverage Survey`
- `/admin/reports/survey-indicators`
  - label: `Capaian Indikator Survey`
- `/admin/reports/phs-kabupaten`
  - label: `Rekap PHBS Kabupaten`
- `/admin/reports/iks-wilayah`
  - label: `Laporan IKS Wilayah`

## Kebutuhan Tiap Laporan

### 1. Progress & Coverage Survey

- fokus pada target vs realisasi survey
- menampilkan coverage per wilayah/puskesmas/desa
- menampilkan backlog validasi
- menampilkan konteks operasional untuk area yang tertinggal

### 2. Capaian Indikator Survey

- fokus pada hasil survey per indikator PHBS/IKS
- menampilkan distribusi sehat, pra-sehat, dan tidak sehat
- membantu membaca indikator dominan yang bermasalah
- tetap menyediakan detail data dalam tabel

### 3. Rekap PHBS Kabupaten

- mengikuti struktur dokumen referensi `doc/PHS Kab.xlsx`
- hirarki data: kecamatan, puskesmas, desa/kelurahan
- memuat jumlah ART disurvei dan capaian indikator PHBS
- memuat status sehat dan tidak sehat
- harus siap diekspor sebagai laporan kabupaten

### 4. Laporan IKS Wilayah

- fokus pada ringkasan IKS per wilayah
- mendukung pembacaan performa wilayah untuk monitoring dan ranking internal
- tetap menyediakan tabel detail yang siap diekspor

## Standardisasi Filter Semua Halaman Report

User menetapkan bahwa semua halaman report admin harus memakai filter yang seragam dan sederhana.

Filter yang dipakai di semua halaman report:

- `Tahun`
- `Kecamatan`
- `Puskesmas`
- `Desa/Kelurahan`

Filter khusus lain seperti:

- periode
- status
- indikator
- jenis responden
- level wilayah
- ranking status

tidak perlu ditampilkan sebagai filter utama pada UI report.

## Kebutuhan Fitur Tetap di Halaman Report

Hal-hal berikut tetap harus ada di halaman report:

- header halaman
- tabel lengkap
- tombol refresh
- tombol export
- aksi lain sesuai fungsi halaman

Catatan:

- `import` atau `tambah` tidak wajib di semua report, hanya muncul bila sesuai fungsi halaman
- export Excel perlu disiapkan pada laporan admin

## Arah UI/UX Module Master vs Reports

User menegaskan bahwa:

- pewarnaan harus tetap konsisten antar module
- layout dasar harus tetap konsisten antar module
- pembedaan `Master` dan `Reports` tidak dilakukan lewat warna atau layout yang sepenuhnya berbeda

Perbedaan utama disepakati pada pendekatan konten:

- `Master` menggunakan konsep `table-first`
- `Reports` menggunakan konsep `insight-first`

## Implikasi UX untuk Module Master

Karakter halaman `Master`:

- langsung mengarahkan user ke pengelolaan data
- tabel menjadi komponen utama dan paling dominan
- action seperti `Tambah`, `Import`, `Edit`, dan `Kelola` lebih menonjol
- ringkasan di atas tabel jika ada bersifat ringan dan operasional

Urutan blok yang disarankan:

- header
- action bar
- filter
- tabel utama
- pagination / modal / detail

## Implikasi UX untuk Module Reports

Karakter halaman `Reports`:

- memberi insight atau pembacaan cepat sebelum user masuk ke detail tabel
- tabel tetap ada, tetapi bukan satu-satunya fokus
- export menjadi aksi yang menonjol
- KPI tidak harus selalu angka statis

Urutan blok yang disarankan:

- header
- insight summary
- chart / visual summary
- filter
- tabel detail

## Saran Komponen Visual Khusus Reports

Agar module `Reports` terasa berbeda dari `Master` namun tetap konsisten secara visual, disepakati bahwa halaman report boleh memakai komponen analitis seperti:

- `donut chart`
  - untuk distribusi sehat / pra-sehat / tidak sehat
  - untuk valid / belum valid
- `line chart`
  - untuk tren coverage
  - untuk tren IKS atau tren survey
- `bar chart`
  - untuk perbandingan antar kecamatan / puskesmas
  - untuk ranking indikator atau wilayah
- `mini trend card`
  - angka ringkas dengan tren kecil
- `insight card`
  - kartu teks singkat yang menyorot temuan penting

## Arah Implementasi Reports yang Direkomendasikan

Agar halaman report tidak terlalu padat tetapi tetap terasa berbeda dari master, komposisi blok yang direkomendasikan:

- baris atas: 2 sampai 4 summary card
- baris berikutnya: 1 chart utama + 1 panel insight
- setelah itu: filter standar
- lalu: tabel detail

Catatan penting:

- jangan semua report dipenuhi chart sekaligus
- maksimal 1 sampai 2 chart utama per halaman agar tetap ringan dan fokus

## Contoh Pemetaan Chart per Report

- `Progress & Coverage Survey`
  - line chart tren coverage
  - donut chart status validasi / backlog
- `Capaian Indikator Survey`
  - bar chart capaian antar indikator
  - donut chart distribusi sehat
- `Rekap PHBS Kabupaten`
  - bar chart ranking kecamatan
  - donut chart sehat vs tidak sehat
- `Laporan IKS Wilayah`
  - line chart tren IKS
  - horizontal bar chart ranking wilayah

## Status Ringkasan

Dokumen ini merangkum keputusan dan arahan kebutuhan dari percakapan lanjutan mengenai area report admin pada tanggal 10 Juni 2026, dan dapat dipakai sebagai acuan implementasi tahap berikutnya.
