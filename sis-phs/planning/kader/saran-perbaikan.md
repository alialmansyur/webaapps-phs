# Saran Perbaikan Kader

## Prioritas 1

### 1. Scope-kan intervensi ke user Kader yang login

Target:

- `/kader/interventions/schedule`
- endpoint `GET/POST /api/kader/interventions`

Rekomendasi:

- Tambahkan scope minimum `where('surveyor_user_id', $request->user()->id)` pada query schedule bila memang intervensi hanya untuk survei milik kader itu sendiri.
- Jika rule bisnis sebenarnya berbasis wilayah/puskesmas, gunakan scope dari `district_id`, `puskesmas_id`, atau `village_id` secara eksplisit.
- Saat `POST`, validasi bahwa `survey_id`:
  - berada dalam scope kader,
  - belum punya intervensi ganda yang tidak diinginkan,
  - berada pada status survey yang valid untuk diintervensi.
- Tambahkan guard backend, jangan hanya mengandalkan filter frontend.

### 2. Samakan definisi jawaban sehat/tidak sehat di seluruh stack

Masalah inti:

- frontend/backend live memakai `Y/N`
- summary service masih membaca `Y/T`

Rekomendasi:

- Pilih satu standar canonical untuk jawaban biner, idealnya `Y/N` karena itu yang sudah dikirim API live.
- Update `SurveySummaryService` agar:
  - `Y` = healthy
  - `N` = unhealthy
  - `score == 1` => sehat
  - `score < 1` => tidak sehat
- Tambahkan test integrasi untuk memastikan:
  - semua `Y` => `iks_score = 1`, healthy
  - ada minimal satu `N` => `iks_score < 1`, unhealthy

### 3. Ubah `/kader/interventions/log` menjadi live data

Rekomendasi:

- Buat endpoint khusus log, misalnya `GET /api/kader/interventions/log`, atau perluas endpoint existing dengan mode `tab=sudah` plus filter tambahan.
- Pindahkan `InterventionLog.jsx` dari `operationalData` ke service API nyata.
- Samakan source data schedule dan log agar hasil `Catat Edukasi` langsung muncul di halaman log.

## Prioritas 2

### 4. Ganti master filter statis dengan lookup live

Target:

- history
- intervention log
- wilayah binaan

Rekomendasi:

- Pakai endpoint lookup backend (`/api/lookups/districts`, `/api/lookups/villages`, atau endpoint scope khusus kader).
- Atau minimal seed opsi filter dari `auth/me -> scope`.
- Hilangkan daftar hardcoded `320101x` dari `operationalData.js` untuk halaman live.

### 5. Ganti statistik wilayah random menjadi agregasi nyata

Rekomendasi:

- Untuk `totalHouseholds`: hitung dari `mstr_households` per `village_id + rt + rw`.
- Untuk `surveyedHouseholds`: hitung distinct `household_id` dari survey aktif/periode aktif.
- Untuk `avgIks`: ambil dari `summary_surveys` bila summary sudah dibetulkan.
- Untuk `priorityCount`: hitung jumlah household dengan `iks_score < 1` atau indikator prioritas tertentu.
- Hapus `rand()` sepenuhnya dari controller produksi.

Catatan:

- Bila agregasi ini berat, buat query summary per wilayah atau materialized summary table ringan.

### 6. Sinkronkan history survey dengan status intervensi dan review nyata

Rekomendasi:

- Isi `interventionStatus` dari relasi `trx_interventions`.
- Isi `revisionNote` dari `trx_surveys.notes` atau field feedback reviewer yang memang dipakai.
- Bila survey sudah diintervensi, tampilkan state yang jelas seperti:
  - `Belum Intervensi`
  - `Terjadwal`
  - `Selesai Edukasi`

### 7. Hilangkan `PRA_SEHAT` dari halaman yang memakai rule biner

Rekomendasi:

- Untuk history survey: hapus opsi filter `PRA_SEHAT`.
- Untuk wilayah binaan: bila bisnis memang biner, hilangkan `PRA_SEHAT`.
- Jika `PRA_SEHAT` memang dibutuhkan untuk area agregat, definisikan rule tertulis dan pisahkan dari rule survey individu.

## Prioritas 3

### 8. Rapikan UX profile account

Rekomendasi:

- Tambahkan validasi frontend untuk:
  - `full_name`
  - `phone`
  - `email`
  - password confirmation
- Tampilkan error per field, bukan hanya toast global.
- Pertimbangkan flow onboarding data akun saat `email/phone` masih kosong.
- Pastikan backend translation message untuk validation sudah user-friendly.

### 9. Perkuat otorisasi backend

Rekomendasi:

- Tambahkan middleware/authorization policy per prefix `kader/*`.
- Validasi role/permission di backend untuk endpoint sensitif.
- Untuk endpoint yang memakai UUID sumber daya lintas user, selalu cek ownership/scope.

## Optimasi Performa

### Frontend

- Export history/wilayah sebaiknya tidak mengambil `999` record langsung ke browser untuk dataset besar.
- Gunakan loading state per aksi export agar user tahu request sedang berjalan.
- Debounce pencarian pada history/intervention/wilayah agar tidak memicu request terlalu sering.

### Backend

- `DashboardController@kader` masih menembak banyak query kecil di loop harian/mingguan.
- `WilayahController@index` berpotensi N+1 karena count per record.
- `SurveyController@history` eager-load semua jawaban + pertanyaan untuk setiap row, padahal list page hanya butuh detail saat modal dibuka.

Rekomendasi:

- Dashboard:
  - ganti loop count harian/mingguan dengan agregasi `group by date/week`
  - pisahkan query summary card dan query chart
- History:
  - list endpoint cukup kirim summary row
  - detail jawaban pindahkan ke endpoint detail per survey bila perlu
- Wilayah:
  - agregasi bulk per batch RT/RW, bukan count satu per satu

### Database dan Indexing

Index yang disarankan karena belum tampak di migrasi transaksi utama:

- `trx_surveys (surveyor_user_id, status, submitted_at)`
- `trx_surveys (respondent_id, submitted_at)`
- `trx_survey_answers (survey_id, answer_text)`
- `trx_interventions (survey_id)`
- `trx_interventions (kader_id, next_visit_at)`
- `mstr_households (village_id, rt, rw)`
- `mstr_households (no_kk)`
- `mstr_respondents (nik)`
- `mstr_respondents (household_id)`

Manfaat:

- mempercepat history, dashboard, intervention schedule, dan agregasi wilayah
- mengurangi full table scan pada dataset besar

## Saran Testing

- Tambahkan feature test backend untuk:
  - Kader hanya bisa melihat intervensi dalam scope sendiri
  - Scoring `score == 1` sehat, `< 1` tidak sehat
  - CRUD wilayah tidak menghasilkan metrik acak
  - update profile/password mengembalikan pesan validasi yang konsisten
- Tambahkan test frontend untuk:
  - filter history memakai lookup live
  - intervention log menampilkan hasil catat edukasi terbaru
  - profile menandai field wajib sebelum submit

## Urutan Implementasi yang Minim Risiko

1. Betulkan scope dan authorization intervensi.
2. Samakan scoring `Y/N` di summary service.
3. Ganti halaman log intervensi ke data live.
4. Ganti lookup statis ke lookup backend.
5. Ganti wilayah random ke agregasi nyata.
6. Rapikan history intervensi/revisi.
7. Tambahkan index dan optimasi query.
