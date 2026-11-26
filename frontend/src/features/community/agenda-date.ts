/**
 * Logika murni tanggal agenda Section 4 — tanpa import, agar bisa diuji langsung dengan Node.
 */

const MONTHS = [
  'Januari', 'Februari', 'Maret', 'April', 'Mei', 'Juni',
  'Juli', 'Agustus', 'September', 'Oktober', 'November', 'Desember',
];

export interface AgendaDate {
  readonly day: string;
  readonly month: string;
  readonly year: string;
  /** Tanggal lengkap untuk pembaca layar, mis. "15 Maret 2026". */
  readonly label: string;
}

/**
 * `YYYY-MM-DD` (atau timestamp ISO) → hari 2 digit + bulan singkat bahasa Indonesia.
 * Teks lain (mis. "UPCOMING") atau tanggal mustahil ditampilkan apa adanya.
 */
export function agendaDate(raw: string): AgendaDate {
  const match = /^(\d{4})-(\d{2})-(\d{2})/.exec(raw);
  const monthIndex = match ? Number(match[2]) - 1 : -1;
  const day = match ? Number(match[3]) : 0;
  if (!match || monthIndex < 0 || monthIndex > 11 || day < 1 || day > 31) {
    return { day: '', month: raw, year: '', label: raw };
  }
  const monthName = MONTHS[monthIndex];
  return {
    day: match[3],
    month: monthName.slice(0, 3).toUpperCase(),
    year: match[1],
    label: `${day} ${monthName} ${match[1]}`,
  };
}
