# Audit Kader

Tanggal audit: 13 Juni 2026  
Environment: Docker Compose lokal (`frontend:9001`, `backend:9002`, `mysql:9003`)  
Akun uji: `sitikhodijah_VO9Q`

## Ringkasan Cakupan

Route target Kader yang terdaftar di frontend:

- `/kader/dashboard`
- `/kader/surveys/new`
- `/kader/surveys/history`
- `/kader/interventions/schedule`
- `/kader/interventions/log`
- `/kader/profile/wilayah`
- `/kader/profile/account`

Route backend yang aktif untuk scope ini:

- `GET /api/kader/dashboard`
- `GET|POST /api/kader/surveys/*`
- `GET|POST /api/kader/interventions`
- `GET|PUT /api/kader/profile`
- `GET|POST|PUT|DELETE /api/kader/profile/wilayah/*`

## Status Per Halaman

| Halaman | Status audit | Catatan utama |
|---|---|---|
| `/kader/dashboard` | Jalan, tetapi mismatch data | KPI total tampil, namun progres mingguan/bulanan dan tren mudah membingungkan. |
| `/kader/surveys/new` | Jalan | Fetch pertanyaan, validasi NIK, submit survei aktif. Tidak ada save draft. |
| `/kader/surveys/history` | Jalan, tetapi data/UX mismatch | Data live, export live, filter wilayah memakai master statis, intervensi masih hardcoded. |
| `/kader/interventions/schedule` | Jalan, tetapi bug kritikal | Data bocor lintas user, tidak scoped ke Kader login. |
| `/kader/interventions/log` | Belum terintegrasi | 100% pakai data mock lokal, tidak membaca backend. |
| `/kader/profile/wilayah` | CRUD jalan, tetapi metrik palsu | List/create/update/delete aktif, namun statistik area random dan tidak deterministik. |
| `/kader/profile/account` | Jalan, tetapi UX update lemah | View profile aktif; update profile/password rawan gagal tanpa validasi form yang jelas. |

## Temuan Utama

### 1. Kritikal: `/kader/interventions/schedule` menampilkan seluruh kasus tidak sehat, bukan milik Kader login

Ref:

- [backend/routes/api.php](/mnt/d/2. Project/WebApps SIS-PHS/sis-phs/backend/routes/api.php:126)
- [InterventionController.php](/mnt/d/2. Project/WebApps SIS-PHS/sis-phs/backend/app/Http/Controllers/Api/InterventionController.php:13)
- [InterventionSchedule.jsx](/mnt/d/2. Project/WebApps SIS-PHS/sis-phs/frontend/src/modules/interventions/InterventionSchedule.jsx:39)

Masalah:

- Query `index()` hanya memfilter `status = SUBMITTED` dan ada jawaban `!= 'Y'`, tetapi tidak pernah membatasi `surveyor_user_id`, `kader_id`, `village_id`, atau scope user.
- POST `store()` juga tidak memverifikasi bahwa `survey_id` memang boleh diintervensi oleh kader yang sedang login.

Bukti runtime:

- User uji punya `158` survei total, `133` survei `SUBMITTED` tidak sehat.
- API `GET /api/kader/interventions?tab=belum&perPage=5` mengembalikan `total: 5052`.
- Ini berarti halaman schedule sedang membaca backlog global, bukan backlog user.

Dampak:

- Kebocoran data lintas wilayah/user.
- Jadwal intervensi tidak bisa dipakai operasional.
- Risiko user mencatat intervensi ke survei milik kader lain.

### 2. Kritikal: aturan scoring summary backend tidak sinkron dengan jawaban survei live

Ref:

- [SurveyController.php](/mnt/d/2. Project/WebApps SIS-PHS/sis-phs/backend/app/Http/Controllers/Kader/SurveyController.php:66)
- [SurveySummaryService.php](/mnt/d/2. Project/WebApps SIS-PHS/sis-phs/backend/app/Services/SurveySummaryService.php:65)

Masalah:

- Endpoint pertanyaan live mengirim opsi `Y` dan `N`.
- `store()` menyimpan `answer_text` apa adanya, termasuk `N`.
- `SurveySummaryService` menghitung IKS dengan asumsi nilai indikator hanya `Y` dan `T`.
- Nilai `N` tidak dianggap `applicable` dan tidak menurunkan `is_healthy` pada summary.

Konsekuensi:

- `summary_surveys` dan `summary_survey_indicators` berpotensi salah untuk semua survei baru dengan jawaban `N`.
- Ini langsung bertentangan dengan aturan bisnis audit:
  - `score == 1` => `Sehat`
  - `score < 1` => `Tidak Sehat`

Catatan:

- History page saat ini menghitung persentase langsung dari jawaban `Y`, jadi page ini tampak “benar”.
- Tetapi laporan/dashboard berbasis summary berisiko salah.

### 3. Tinggi: `/kader/interventions/log` belum memakai backend sama sekali

Ref:

- [InterventionLog.jsx](/mnt/d/2. Project/WebApps SIS-PHS/sis-phs/frontend/src/modules/interventions/InterventionLog.jsx:10)
- [operationalData.js](/mnt/d/2. Project/WebApps SIS-PHS/sis-phs/frontend/src/services/operationalData.js:775)

Masalah:

- Komponen log memakai `getInterventionLogRecords()` dari `operationalData.js`.
- Tidak ada call ke endpoint `/api/kader/interventions`.
- Filter, pagination, detail modal, dan empty state semuanya berbasis dataset mock lokal.

Dampak:

- User melihat histori edukasi yang tidak berasal dari database.
- Data log tidak sinkron dengan hasil `Catat Edukasi` di schedule.
- Audit trail intervensi di sisi kader praktis tidak valid.

### 4. Tinggi: `/kader/profile/wilayah` menampilkan metrik acak dan berubah-ubah tiap request

Ref:

- [WilayahController.php](/mnt/d/2. Project/WebApps SIS-PHS/sis-phs/backend/app/Http/Controllers/Kader/WilayahController.php:46)
- [WilayahBinaan.jsx](/mnt/d/2. Project/WebApps SIS-PHS/sis-phs/frontend/src/modules/profile/WilayahBinaan.jsx:99)

Masalah:

- `index()` menghitung `surveyedHouseholds`, `avgIks`, dan `priorityCount` dengan `rand()`.
- `healthStatus` juga diturunkan dari nilai random tersebut.
- Export wilayah memakai response yang sama, sehingga file ekspor pun tidak stabil.

Bukti runtime:

- Record uji yang sama (`RT 099 / RW 099`) berubah dari `avgIks: 0.72` menjadi `0.85`, lalu `0.57` pada request berbeda.
- Status kesehatan berubah dari `PRA_SEHAT` ke `SEHAT` tanpa ada perubahan data.

Dampak:

- Angka coverage dan status wilayah tidak bisa dipercaya.
- Export wilayah menghasilkan laporan yang tidak repeatable.

### 5. Tinggi: filter wilayah di halaman Kader memakai master statis yang tidak cocok dengan data live

Ref:

- [operationalData.js](/mnt/d/2. Project/WebApps SIS-PHS/sis-phs/frontend/src/services/operationalData.js:1)
- [HistorySurveys.jsx](/mnt/d/2. Project/WebApps SIS-PHS/sis-phs/frontend/src/modules/surveys/HistorySurveys.jsx:49)
- [WilayahBinaan.jsx](/mnt/d/2. Project/WebApps SIS-PHS/sis-phs/frontend/src/modules/profile/WilayahBinaan.jsx:51)
- [InterventionLog.jsx](/mnt/d/2. Project/WebApps SIS-PHS/sis-phs/frontend/src/modules/interventions/InterventionLog.jsx:41)

Masalah:

- Daftar kecamatan/desa di frontend hardcoded ke kode `320101x`.
- Scope user uji dari backend adalah `district_id = 320416`, `village_id = 3204162003`.

Bukti runtime:

- `GET /api/kader/surveys/history?districtId=320416` masih mengembalikan data.
- `GET /api/kader/surveys/history?districtId=3201010` mengembalikan `total: 0`.

Dampak:

- Filter terlihat aktif tetapi praktis menyesatkan.
- User tidak bisa memfilter ke wilayah nyata miliknya lewat UI.

### 6. Tinggi: history survey masih meng-hardcode status intervensi dan catatan revisi

Ref:

- [SurveyController.php](/mnt/d/2. Project/WebApps SIS-PHS/sis-phs/backend/app/Http/Controllers/Kader/SurveyController.php:256)
- [HistorySurveys.jsx](/mnt/d/2. Project/WebApps SIS-PHS/sis-phs/frontend/src/modules/surveys/HistorySurveys.jsx:269)

Masalah:

- `interventionStatus` selalu diisi `"Menunggu validasi"`.
- `revisionNote` selalu `null`.
- Tidak ada join ke `trx_interventions`.
- Tidak ada pembacaan `notes` reviewer atau status revisi nyata.

Dampak:

- History detail tidak mencerminkan lifecycle sesungguhnya.
- Setelah survey diintervensi, status history tetap misleading.

### 7. Sedang: UI history masih menawarkan filter `PRA_SEHAT`, padahal backend hanya menghasilkan `SEHAT` atau `TIDAK_SEHAT`

Ref:

- [HistorySurveys.jsx](/mnt/d/2. Project/WebApps SIS-PHS/sis-phs/frontend/src/modules/surveys/HistorySurveys.jsx:221)
- [SurveyController.php](/mnt/d/2. Project/WebApps SIS-PHS/sis-phs/backend/app/Http/Controllers/Kader/SurveyController.php:244)
- [operationalData.js](/mnt/d/2. Project/WebApps SIS-PHS/sis-phs/frontend/src/services/operationalData.js:61)

Masalah:

- Filter UI menyediakan `PRA_SEHAT`.
- Backend `history()` tidak pernah mengembalikan `PRA_SEHAT`.
- Sesuai ketentuan audit, klasifikasi memang hanya `score == 1` atau `< 1`.

Dampak:

- Ada filter yang selalu kosong.
- User membaca model kesehatan yang berbeda antara history dan wilayah.

### 8. Sedang: profile account mudah gagal saat edit awal dan pesan error kurang ramah

Ref:

- [ProfileKader.jsx](/mnt/d/2. Project/WebApps SIS-PHS/sis-phs/frontend/src/modules/profile/ProfileKader.jsx:64)
- [UpdateProfileRequest.php](/mnt/d/2. Project/WebApps SIS-PHS/sis-phs/backend/app/Http/Requests/Kader/UpdateProfileRequest.php:22)
- [UpdatePasswordRequest.php](/mnt/d/2. Project/WebApps SIS-PHS/sis-phs/backend/app/Http/Requests/Kader/UpdatePasswordRequest.php:23)

Masalah:

- User uji saat ini punya `email = null` dan `phone = null`.
- Endpoint update profile mewajibkan `phone` dan `email`.
- Form frontend tidak melakukan validasi client-side.
- Saat invalid, API mengembalikan key terjemahan mentah seperti `validation.required`, `validation.current_password`.

Dampak:

- First-time profile completion terasa “rusak” dari sisi UX.
- User sulit tahu field mana yang wajib atau salah.

### 9. Sedang: backend route Kader hanya dilindungi `auth:sanctum`, belum ada pembatasan role/permission yang eksplisit

Ref:

- [api.php](/mnt/d/2. Project/WebApps SIS-PHS/sis-phs/backend/routes/api.php:119)

Masalah:

- Seluruh endpoint Kader berada dalam group `auth:sanctum`.
- Tidak terlihat middleware role/permission khusus untuk prefix `kader/*`.

Dampak:

- Kontrol akses saat ini lebih banyak bergantung pada frontend/menu.
- Jika user non-kader punya token valid dan tahu endpoint, backend belum jelas menolak di level route/controller.

### 10. Sedang: dashboard Kader valid secara teknis, tetapi angka progres dan tren tidak sinkron secara narasi

Ref:

- [DashboardController.php](/mnt/d/2. Project/WebApps SIS-PHS/sis-phs/backend/app/Http/Controllers/DashboardController.php:19)

Temuan:

- Response live menampilkan `158 dari target 35 selesai`, progres dibatasi 100%.
- Pada saat yang sama, tren 7 hari terakhir berisi semua `0`.

Ini bukan crash, tetapi dari perspektif user:

- Progress card terasa “sangat baik”.
- Chart mingguan terasa “tidak ada aktivitas”.

Kemungkinan penyebab:

- KPI utama memakai total kumulatif semua data user.
- Trend hanya memakai periode aktif saat ini.

### 11. Rendah: endpoint export list besar berpotensi berat

Ref:

- [HistorySurveys.jsx](/mnt/d/2. Project/WebApps SIS-PHS/sis-phs/frontend/src/modules/surveys/HistorySurveys.jsx:99)
- [WilayahBinaan.jsx](/mnt/d/2. Project/WebApps SIS-PHS/sis-phs/frontend/src/modules/profile/WilayahBinaan.jsx:99)

Temuan:

- Export history meminta `perPage=999`.
- Export wilayah meminta `per_page=999`.
- Pendekatan ini masih aman untuk dataset kecil, tetapi akan berat saat data tumbuh.

## Audit CRUD

### Wilayah Binaan

- `list`: aktif.
- `create`: aktif.
- `edit`: aktif.
- `delete`: aktif.
- Validasi duplicate RT/RW/desa: aktif.
- Masalah utama: metrik area masih palsu/random.

### Survey Baru

- `create`: aktif.
- `read questions`: aktif.
- `check duplicate NIK`: aktif.
- `edit/delete`: tidak tersedia untuk route target ini.
- `draft save`: belum ada di endpoint `store()` karena status langsung `SUBMITTED`.

### Intervensi

- `list schedule`: aktif tapi salah scope.
- `create log dari schedule`: aktif tapi tidak ada verifikasi ownership survey.
- `read log`: halaman ada, backend nyata belum dipakai.
- `edit/delete`: tidak tersedia untuk role Kader.

### Profile Account

- `read`: aktif.
- `update profile`: aktif.
- `change password`: aktif.
- Validasi backend aktif, validasi frontend belum memadai.

## Empty State, Loading State, Error Handling

- Loading state tersedia di seluruh halaman target.
- Empty state tersedia di history, intervention schedule/log, dan wilayah.
- Error handling ada, tetapi beberapa pesan terlalu generik.
- Untuk profile, error backend masih tampil sebagai key terjemahan mentah.

## Report / Export

- History survey: ada export Excel, source data live.
- Wilayah binaan: ada export Excel, tetapi source metrik random sehingga hasil export tidak dapat dipercaya.
- Dashboard, intervention schedule, intervention log, profile: tidak ada export.

## Catatan Runtime yang Dikonfirmasi

- Login akun uji berhasil ke backend lokal.
- `GET /api/kader/dashboard` aktif.
- `GET /api/kader/surveys/questions` aktif.
- `GET /api/kader/surveys/history` aktif.
- `GET /api/kader/interventions` aktif tetapi bocor lintas user.
- `GET /api/kader/profile` aktif.
- `GET /api/kader/profile/wilayah` aktif.
- Uji CRUD `wilayah` sempat dilakukan dengan record sementara dan sudah dibersihkan kembali pada sesi audit ini.
