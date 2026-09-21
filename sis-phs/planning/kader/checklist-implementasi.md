# Checklist Implementasi Kader

## Phase 1: Keamanan dan Kebenaran Data

- [ ] Batasi `GET /api/kader/interventions` ke data dalam scope user kader.
- [ ] Validasi ownership/scope pada `POST /api/kader/interventions`.
- [ ] Pastikan intervensi tidak bisa dicatat ke survey milik user lain.
- [ ] Samakan definisi jawaban sehat/tidak sehat di backend summary dengan nilai live `Y/N`.
- [ ] Tambahkan test untuk rule `score == 1 => Sehat` dan `score < 1 => Tidak Sehat`.
- [ ] Review endpoint Kader lain agar tidak hanya bergantung pada `auth:sanctum`.

## Phase 2: Integrasi Frontend-Backend

- [ ] Ubah `/kader/interventions/log` agar memakai endpoint backend, bukan `operationalData.js`.
- [ ] Tambahkan endpoint log intervensi jika endpoint existing belum cukup.
- [ ] Sinkronkan status intervensi di history survey dengan data `trx_interventions`.
- [ ] Tampilkan catatan revisi/feedback reviewer nyata di history detail.
- [ ] Pastikan create intervensi langsung tercermin di log intervensi.

## Phase 3: Lookup dan Filter

- [ ] Hapus dependency filter wilayah pada dataset hardcoded `operationalData.js`.
- [ ] Pakai lookup backend untuk kecamatan/desa yang relevan ke scope user.
- [ ] Pastikan dropdown filter hanya menampilkan wilayah nyata user.
- [ ] Hapus opsi `PRA_SEHAT` dari history survey jika rule tetap biner.
- [ ] Review label status kesehatan agar konsisten antar halaman.

## Phase 4: Wilayah Binaan

- [ ] Ganti `rand()` pada `WilayahController@index` dengan agregasi nyata.
- [ ] Hitung `totalHouseholds` per `village_id + rt + rw`.
- [ ] Hitung `surveyedHouseholds` dari survey live/summary.
- [ ] Hitung `avgIks` dari summary yang sudah dibetulkan.
- [ ] Hitung `priorityCount` dari rule prioritas yang disepakati.
- [ ] Pastikan export wilayah memakai angka yang stabil dan repeatable.
- [ ] Tambahkan test agar dua request list wilayah yang sama menghasilkan angka yang sama.

## Phase 5: Profile Account

- [ ] Tambahkan validasi frontend untuk form edit profile.
- [ ] Tambahkan validasi frontend untuk form ubah password.
- [ ] Tampilkan error per field, bukan hanya toast generik.
- [ ] Pastikan pesan validasi backend sudah terbaca user, bukan key translation mentah.
- [ ] Review kebutuhan bisnis apakah `email` dan `phone` harus selalu mandatory.

## Phase 6: Dashboard dan History

- [ ] Sinkronkan narasi KPI dashboard dengan periode trend yang dipilih.
- [ ] Tentukan apakah progress dashboard bersifat kumulatif atau periodik.
- [ ] Review kembali status keluarga di tabel dashboard agar sesuai status survey aktual.
- [ ] Optimalkan history list agar detail jawaban tidak selalu dibawa di list payload.
- [ ] Review kebutuhan endpoint detail survey jika modal riwayat tetap dipertahankan.

## Phase 7: Performa dan Database

- [ ] Tambahkan index pada `trx_surveys (surveyor_user_id, status, submitted_at)`.
- [ ] Tambahkan index pada `trx_survey_answers (survey_id, answer_text)`.
- [ ] Tambahkan index pada `trx_interventions (survey_id)` dan `(kader_id, next_visit_at)`.
- [ ] Tambahkan index pada `mstr_households (village_id, rt, rw)` dan `no_kk`.
- [ ] Tambahkan index pada `mstr_respondents (nik)` dan `household_id`.
- [ ] Ubah query dashboard trend menjadi agregasi bulk, bukan loop query.
- [ ] Ubah export besar agar tidak mengandalkan `perPage=999` bila dataset makin besar.

## Phase 8: Verifikasi Akhir

- [ ] Uji login akun `sitikhodijah_VO9Q` setelah perubahan.
- [ ] Verifikasi semua route target tetap bisa dibuka:
- [ ] `/kader/dashboard`
- [ ] `/kader/surveys/new`
- [ ] `/kader/surveys/history`
- [ ] `/kader/interventions/schedule`
- [ ] `/kader/interventions/log`
- [ ] `/kader/profile/wilayah`
- [ ] `/kader/profile/account`
- [ ] Verifikasi loading state, empty state, dan error state tiap halaman.
- [ ] Verifikasi export history dan export wilayah.
- [ ] Verifikasi tidak ada perubahan di luar modul Kader yang menjadi breaking change.
