# ARM Exhaust (Amphibi Racing Muffler) 🏁

Platform e-commerce & katalog knalpot racing custom premium dengan sistem manajemen pesanan (CRM), autentikasi bertingkat (RBAC Superadmin, VIP Reseller, Customer), dan proteksi keamanan modern.

---

## 🛠️ Tech Stack

### **Frontend**
- **Framework**: [Next.js 15](https://nextjs.org/) (App Router, Turbopack, React 19)
- **Styling**: [Tailwind CSS](https://tailwindcss.com/)
- **Animation**: [Framer Motion](https://www.framer.com/motion/) & Lenis Smooth Scroll
- **Icons**: Lucide React

### **Backend**
- **Framework**: [NestJS](https://nestjs.com/) (Node.js)
- **Database & ORM**: PostgreSQL & [Prisma ORM](https://www.prisma.io/)
- **Security & Auth**: Google OAuth SSO, OTP Verification, AES-256 Payload Encryption, Cloudflare Turnstile, Dynamic Rate Limiting
- **Payment**: Stripe Integration

---

## 🚀 Fitur Utama

- 🏎️ **Katalog Produk Dinamis**: Eksplorasi produk knalpot unggulan (Neptune V2, Luster V2, Warrior Black, dll.) dengan galeri foto beresolusi tinggi.
- 🔐 **Autentikasi Minimalis & Aman**: Dukungan login standar email/password, Google One-Tap SSO, OTP email security, dan proteksi Turnstile bot protection.
- 📊 **Admin CRM & Telemetry Portal**: Dashboard manajemen pesanan, tracking status produksi, customer drawer dengan integrasi WhatsApp langsung, dan RBAC role manager.
- 🤝 **Program VIP Reseller**: Sistem klaim undangan reseller, kebijakan diskon dinamis (decoupled discount policies), dan kuota diskon bertingkat.
- 📱 **Desain Responsif & Tactile**: Navigasi mobile responsif, custom tactile checkbox, dan smooth state transitions.

---

## 💻 Cara Menjalankan Proyek Lokal

### 1. Prasyarat
- Node.js (v18+)
- PostgreSQL

### 2. Frontend
```bash
cd frontend
npm install
npm run dev
```
Akses di browser: `http://localhost:3000`

### 3. Backend
```bash
cd backend
npm install
npx prisma generate
npx prisma migrate dev
npm run start:dev
```
Backend berjalan di: `http://localhost:4000`

---

## 📄 Lisensi
Hak Cipta © 2026 ARM Exhaust. All rights reserved.
