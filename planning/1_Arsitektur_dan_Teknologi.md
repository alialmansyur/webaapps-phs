# Arsitektur & Teknologi Sistem Informasi Survei PHS

Sistem Informasi Survei Perilaku Hidup Sehat (SIS-PHS) ini dirancang menggunakan pendekatan **Monorepo** dengan arsitektur **API-Centric**. Pendekatan ini memungkinkan pemisahan antara frontend dan backend, namun tetap mudah dikelola dalam satu repository.

## 1. Arsitektur Monorepo
Kita akan menggunakan **Turborepo** atau **Nx** sebagai *build system* untuk mengelola monorepo. 
Struktur direktori:
```text
/sis-phs-monorepo
├── /apps
│   ├── /web-app      (Frontend Next.js untuk Admin, Dinkes, Puskesmas, Kader)
│   └── /api-server   (Backend REST API)
├── /packages
│   ├── /ui           (Shared UI components - shadcn/ui)
│   ├── /config       (Shared ESLint, TSConfig, dll)
│   └── /database     (Prisma Schema & Migrations)
```

## 2. Stack Teknologi Utama

### A. Frontend (Antarmuka Pengguna)
- **Framework:** **Next.js (App Router)** - Mendukung SSR (Server-Side Rendering) untuk performa dashboard yang cepat dan SEO yang baik (jika diperlukan untuk halaman publik).
- **Bahasa:** TypeScript.
- **Styling & UI:** **Tailwind CSS** dipadukan dengan **shadcn/ui** untuk pembuatan komponen antarmuka yang modern, responsif, dan konsisten.
- **State Management:** Zustand (untuk global state ringan) dan React Query (TansStack Query) untuk integrasi API, *caching*, dan optimasi data fetching.
- **Maps / Pemetaan:** **Leaflet.js** atau **Mapbox GL JS** (dengan `react-leaflet` atau `react-map-gl`) untuk visualisasi peta interaktif dan drilldown wilayah.
- **Visualisasi Data (Grafik):** **Recharts** atau **ECharts** untuk membuat KPI, diagram batang/lingkaran yang informatif di dashboard.

### B. Backend (Pemrosesan & API)
Mengingat ini API-centric dan akan disatukan dalam monorepo JS/TS, stack backend yang direkomendasikan adalah:
- **Framework:** **NestJS** (Node.js framework dengan arsitektur modular yang sangat rapi dan *scalable*). Sebagai alternatif yang sangat populer di instansi pemerintahan, **Laravel** (PHP) juga dapat digunakan sebagai backend terpisah yang menyediakan REST API.
- **Bahasa:** TypeScript (jika menggunakan NestJS) atau PHP (jika Laravel).
- **Autentikasi:** **JWT (JSON Web Tokens)** dengan sistem Role-Based Access Control (RBAC).

### C. Database & Storage
- **Relational Database:** **PostgreSQL** - Sangat kuat untuk pemrosesan data berlapis (hierarki wilayah dari Provinsi hingga Desa) dan mendukung data geospasial (PostGIS) jika peta akan dikembangkan lebih lanjut.
- **ORM (Object Relational Mapping):** **Prisma ORM** (jika menggunakan Node.js/NestJS) atau Eloquent (jika Laravel).
- **Penyimpanan Berkas (Export/Import):** AWS S3, MinIO, atau local storage untuk menyimpan dokumen hasil export (PDF/Excel).

## 3. Integrasi & Deployment
- **Containerization:** Docker & Docker Compose untuk lingkungan development dan production yang seragam.
- **CI/CD:** GitHub Actions / GitLab CI untuk otomatisasi testing dan deployment.
- **Hosting/Deployment:** VPS (Virtual Private Server) berbasis Linux (Ubuntu) atau layanan Cloud Infrastructure.
