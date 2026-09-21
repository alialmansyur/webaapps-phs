# SIS-PHS Backend API

Backend phase-1 ini dibangun dengan Laravel API + Sanctum untuk auth, RBAC, lookup wilayah, dan manajemen user admin/kader.

## Menjalankan stack

```bash
cd sis-phs
docker compose up --build -d
```

Endpoint default:

- API: `http://localhost:9002/api`
- MySQL: `localhost:9003`

Catatan:

- `docker compose up -d` tidak menjalankan `php artisan migrate` atau `php artisan db:seed` otomatis.
- Jalankan migration atau seeder secara manual hanya saat memang dibutuhkan.
- Backend tidak menunggu MySQL secara paksa saat startup. Jika ingin mode wait, set `WAIT_FOR_DB=true`.
- Jika MySQL terlihat hidup tetapi kredensial/database dari `.env` tidak bisa dipakai, cek volume `mysql_data`. Variabel `MYSQL_DATABASE`, `MYSQL_USER`, dan `MYSQL_PASSWORD` hanya dipakai saat inisialisasi volume pertama kali.

## Akun seed

- `admin` / `admin12345`
- `dinkes` / `dinkes12345`
- `puskesmas` / `puskesmas12345`
- `kader` / `kader12345`

## Endpoint utama

- `POST /api/auth/login`
- `GET /api/auth/me`
- `GET /api/admin/rbac/matrix`
- `GET /api/admin/users/admin`
- `GET /api/admin/users/kader`
- `GET /api/lookups/districts`
