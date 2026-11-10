# Desain Arsitektur Backend: Core, Features, & Shared (SonarQube-Compliant)

> **Status:** APPROVED per 2026-11-06  
> **Tujuan:** Menata ulang folder `backend/src/` ke dalam 3 layer enterprise (`core/`, `features/`, `shared/`) guna memaksimalkan reusabilitas kode, mencegah duplikasi (*zero duplication smell* SonarQube), dan memisahkan domain API dari infrastruktur sistem.

---

## 1. Struktur Folder Target

```text
backend/src/
├── main.ts                         # Bootstrap NestJS (Port 4000, prefix /api, ValidationPipe)
├── app.module.ts                   # Root aggregator module
│
├── core/                           # Layer 1: Infrastruktur Sistem (Singletons)
│   ├── database/                   # PostgreSQL connection pool (search_path transaction, master)
│   ├── prisma/                     # Prisma ORM multi-schema client & service
│   ├── security/                   # SecurityConfigService, RateLimiterService, TurnstileService, MailerService
│   ├── otp/                        # OtpService (CSPRNG, scrypt, AES-256-GCM)
│   └── core.module.ts              # Global aggregator module untuk layer Core
│
├── shared/                         # Layer 2: Reusable Components (Anti-Duplikasi SonarQube)
│   ├── decorators/                 # Decorator @Roles('admin'), @RateLimit('register')
│   ├── guards/                     # SessionAuthGuard, RolesGuard, RateLimitGuard, TurnstileGuard
│   ├── utils/                      # password-policy.util.ts, session.util.ts, formatters
│   ├── types/                      # Shared interfaces & domain contracts
│   └── shared.module.ts            # Global Module yang mengekspor seluruh Guards & Services bersama
│
└── features/                       # Layer 3: Modul Fitur Bisnis & API Endpoints
    ├── auth/                       # AuthModule, AuthController, AuthService, GoogleAuthService, DTOs
    ├── admin/                      # AdminModule, AdminController
    └── checkout/                   # CheckoutModule, CheckoutController, CheckoutService, ProductsCatalog
```

---

## 2. Aturan Dependensi (Directional Hierarchy)

Untuk mencegah *Circular Dependency* dan menjaga kode tetap bersih:
1. **`features/`** boleh meng-import dari **`shared/`** dan **`core/`**.
2. **`shared/`** hanya boleh meng-import dari **`core/`** (tidak boleh meng-import `features/`).
3. **`core/`** tidak boleh meng-import `shared/` maupun `features/` (bersifat murni infrastruktur dasar).

---

## 3. Rencana Pemindahan File

| Lokasi Saat Ini | Lokasi Baru di Target |
| :--- | :--- |
| `src/database/*` | `src/core/database/*` |
| `src/prisma/*` | `src/core/prisma/*` |
| `src/otp/*` | `src/core/otp/*` |
| `src/security/guards/*` | `src/shared/guards/*` |
| `src/security/*` (services) | `src/core/security/*` |
| `src/auth/guards/*` | `src/shared/guards/*` |
| `src/auth/decorators/*` | `src/shared/decorators/*` |
| `src/auth/*.util.ts` | `src/shared/utils/*` |
| `src/auth/*` | `src/features/auth/*` |
| `src/admin/*` | `src/features/admin/*` |
| `src/checkout/*` | `src/features/checkout/*` |

---

## 4. Kriteria Keberhasilan & Verifikasi

1. **Kompilasi TypeScript:** `npm run build` sukses 100% tanpa error import path yang putus.
2. **Unit Test Kriptografi & Config:** `npm run check:otp` lulus 7/7 pengujian.
3. **Integration Test End-to-End:** Seluruh 8 skenario (Register, Verify OTP, Lockout 423, Login, Turnstile, Admin Config GET/PUT, Prisma ORM) tetap berjalan 100% hijau.
4. **Zero Frontend Regression:** Port `4000` dan rute `/api/*` tetap identik sehingga Next.js frontend tidak terpengaruh.
