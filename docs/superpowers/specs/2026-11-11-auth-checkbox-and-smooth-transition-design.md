# Short Design: Custom Minimalist Checkbox & Fluid Auth Mode Transition

**Tanggal:** 2026-11-11  
**Status:** Menunggu Persetujuan Pengguna  
**Topik:** Perapian Checkbox "Remember Me" Kustom (Bencho Style) dan Transisi Halus (Smooth Transition) Mode Login <-> Register Menggunakan Framer Motion pada Halaman `/login` (ARM Exhaust)

---

## 1. Intent & Konteks (The Why)
Pengguna menginginkan pengalaman interaksi (UX) yang sempurna pada form autentikasi `/login`. Dua area utama yang ditingkatkan:
1. Mengganti elemen checkbox native "Remember me" dengan kontrol kustom yang rapi, tactile, dan minimalis sesuai estetika Bencho.
2. Menggantikan pergantian mode (Login <-> Register) yang sebelumnya terjadi seketika (0ms pop/snap) menjadi animasi transisi yang halus, elastis, dan organik (*fluid layout morphing*) tanpa lonjakan layout kasar.

---

## 2. Goals & Non-Goals

### Goals:
1. **Custom Minimalist Checkbox (Opsi A — Tactile Box)**:
   - Kotak custom 16x16px dengan kelengkungan sudut `rounded-[5px]`.
   - State Unchecked: background gelap `#141416`, border netral `#3A3A40`, efek hover halus `#52525A`.
   - State Checked: background solid white (`bg-white border-white`), menampilkan ikon checkmark hitam presisi yang muncul via micro-animation scale spring.
   - Aksesibilitas: Menggunakan input native `<input type="checkbox" className="sr-only">` tersembunyi agar 100% mendukung keyboard navigasi (`Tab` untuk fokus, `Space` untuk toggle, dan screen reader `aria-checked`).
   - Teks label `Remember me` `#9AA0A8` bertransisi ke `#FFFFFF` saat di-hover.
2. **Smooth Mode Transition (Pendekatan 1 — Fluid Layout Accordion via Framer Motion)**:
   - Menggunakan `framer-motion` (`AnimatePresence`, `motion.div`).
   - Field yang berubah secara kondisional:
     - `Full Name`: slide down & fade in saat masuk mode Register, melipat rapi (`height: 0, opacity: 0`) saat kembali ke Login.
     - `PasswordStrength` & `Confirm Password`: mengembang elastis saat mode Register aktif, melipat mulus saat beralih ke Login.
     - Checkbox `Remember Me`: melipat mulus saat beralih ke Register, mengembang halus saat beralih ke Login.
   - Subtitle header dan teks tombol submit bertransisi lembut via *cross-fade* animasi.
   - Transisi tinggi kontainer form berjalan mulus dengan kurva bezier/spring, mencegah layout tersentak (*zero layout snap*).
3. **Preservasi Fungsionalitas**:
   - Mempertahankan state `rememberMe` dan integrasi persistence ke `localStorage` (`arm_remember_email`).
   - Mempertahankan validasi form, `LabelInput`, Turnstile, dan proses submit autentikasi.

### Non-Goals:
- Menambahkan library animasi baru (`framer-motion` sudah terpasang di `package.json`).
- Mengubah logika otentikasi backend atau skema OTP.

---

## 3. Rincian Teknis Implementasi

### A. Komponen Checkbox Kustom: `frontend/src/features/auth/AuthCheckbox.tsx`
* **Props**:
  - `checked: boolean`
  - `onChange: (checked: boolean) => void`
  - `label: string`
  - `disabled?: boolean`
  - `id?: string`
* **Struktur**:
  ```tsx
  <label className="flex items-center gap-2.5 cursor-pointer select-none group py-0.5">
    <input type="checkbox" className="sr-only" checked={checked} onChange={(e) => onChange(e.target.checked)} />
    <span className={`w-4 h-4 rounded-[5px] border flex items-center justify-center transition-all duration-200 ${checked ? 'bg-white border-white text-black shadow-sm' : 'border-[#3A3A40] bg-[#141416] group-hover:border-[#52525A]'}`}>
      {checked && <svg className="w-2.5 h-2.5 stroke-[3] stroke-black" ... />}
    </span>
    <span className="text-[11.5px] text-[#9AA0A8] group-hover:text-white transition-colors">{label}</span>
  </label>
  ```

### B. Integrasi Transisi Halus pada `AuthCard.tsx`
* Bungkus field-field dinamis dengan `AnimatePresence` dan `motion.div`:
  - `initial={{ opacity: 0, height: 0, filter: 'blur(3px)' }}`
  - `animate={{ opacity: 1, height: 'auto', filter: 'blur(0px)' }}`
  - `exit={{ opacity: 0, height: 0, filter: 'blur(3px)' }}`
  - `transition={{ duration: 0.28, ease: [0.22, 1, 0.36, 1] }}`
* Gunakan `layout` prop pada elemen sekitarnya agar pergerakan posisi atas/bawah terinterpolasi halus tanpa lompatan.

---

## 4. Rencana Verifikasi
1. **Verifikasi Visual & Interaksi Checkbox**:
   - Klik label maupun kotak checkbox untuk memastikan toggle aktif/nonaktif lancar.
   - Pastikan checkmark hitam muncul dengan kontras tinggi di atas kotak putih solid.
   - Uji navigasi keyboard (`Tab` ke checkbox, tekan `Space` untuk toggle).
2. **Verifikasi Transisi Mode**:
   - Klik "Register" lalu klik "Sign In" berulang kali.
   - Pastikan field mengembang dan mengempis secara elastis tanpa lonjakan layout mendadak.
   - Pastikan tidak memicu scrollbar pada zoom 90%–110%.
3. **Build & Test Suite**:
   - Jalankan seluruh check suite autentikasi.
   - Jalankan `npm --prefix frontend run build` untuk menjamin 0 error TypeScript / Turbopack.
