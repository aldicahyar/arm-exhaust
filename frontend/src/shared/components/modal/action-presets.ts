export type ActionMode = 'confirm_and_undo' | 'direct_undo' | 'confirm_only';

export interface ActionPreset {
  readonly title?: string;
  readonly description?: string;
  readonly confirmText?: string;
  readonly cancelText?: string;
  readonly variant?: 'danger' | 'warning' | 'default';
  readonly mode: ActionMode;
  readonly successNoticeTitle?: string;
  readonly undoNoticeTitle?: string;
}

export const ACTION_PRESETS = {
  // --- Kategori DELETE ---
  HERO_SLIDE_DELETE: {
    title: 'Hapus Slide Hero?',
    description: 'Slide visual akan dihapus dari banner beranda storefront.',
    confirmText: 'Hapus Slide',
    variant: 'danger',
    mode: 'confirm_and_undo',
    successNoticeTitle: 'Slide Dihapus',
    undoNoticeTitle: 'Slide Dipulihkan',
  },
  COMMUNITY_EVENT_DELETE: {
    title: 'Hapus Event Komunitas?',
    description: 'Event akan dihapus dari kalender kegiatan storefront.',
    confirmText: 'Hapus Event',
    variant: 'danger',
    mode: 'confirm_and_undo',
    successNoticeTitle: 'Event Dihapus',
    undoNoticeTitle: 'Event Dipulihkan',
  },

  // --- Kategori REVOKE ---
  VIP_INVITE_REVOKE: {
    title: 'Batalkan Token VIP?',
    description: 'Token undangan reseller akan dinonaktifkan permanen dan tidak dapat diklaim lagi.',
    confirmText: 'Batalkan Token',
    variant: 'danger',
    mode: 'confirm_and_undo',
    successNoticeTitle: 'Token VIP Dibatalkan',
    undoNoticeTitle: 'Token VIP Dipulihkan',
  },

  // --- Kategori RESET ---
  SECURITY_CONFIG_RESET: {
    title: 'Reset Konfigurasi Keamanan?',
    description: 'Semua nilai OTP, batas percobaan, dan durasi penguncian akan dikembalikan ke setelan standar.',
    confirmText: 'Kembalikan Default',
    variant: 'warning',
    mode: 'confirm_and_undo',
    successNoticeTitle: 'Konfigurasi Direset',
    undoNoticeTitle: 'Konfigurasi Dipulihkan',
  },

  // --- Kategori TOGGLE STATUS (Cepat dengan Undo) ---
  HERO_SLIDE_TOGGLE: {
    mode: 'direct_undo',
    successNoticeTitle: 'Status Slide Diperbarui',
    undoNoticeTitle: 'Status Slide Dikembalikan',
  },
  COMMUNITY_EVENT_TOGGLE: {
    mode: 'direct_undo',
    successNoticeTitle: 'Status Event Diperbarui',
    undoNoticeTitle: 'Status Event Dikembalikan',
  },

  // --- Kategori SENSITIVE DIRECT (Modal saja) ---
  USER_ROLE_CHANGE: {
    title: 'Ubah Peran Pengguna?',
    description: 'Hak akses dan wewenang pengguna pada sistem akan langsung diperbarui.',
    confirmText: 'Terapkan Peran Baru',
    variant: 'warning',
    mode: 'confirm_only',
    successNoticeTitle: 'Peran Diperbarui',
  },
  ADMIN_LOGOUT: {
    title: 'Keluar dari Sesi Admin?',
    description: 'Sesi aktif Anda akan diakhiri dan dialihkan ke halaman login.',
    confirmText: 'Ya, Keluar',
    variant: 'default',
    mode: 'confirm_only',
    successNoticeTitle: 'Berhasil Keluar',
  },
} as const;
