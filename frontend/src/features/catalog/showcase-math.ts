/**
 * Logika murni Section 3 (New Arrival) — tanpa import, agar bisa diuji langsung dengan Node.
 */

/** Isi grid latar blur: foto (tanpa yang kosong) diulang berurutan sampai `n` ubin. */
export function backdropTiles(images: readonly string[], n: number): string[] {
  const usable = images.filter((src) => src.length > 0);
  if (usable.length === 0) return [];
  return Array.from({ length: n }, (_, i) => usable[i % usable.length]);
}

/** Foto bawaan lama di data admin: foto contoh, atau flyer di kanvas gelap 800x600 (`*-grid.jpg`). */
function isLegacyPlaceholder(src: string): boolean {
  return src === '/assets/products/sample-hero.jpg' || src.endsWith('-grid.jpg');
}

/**
 * Foto untuk kartu New Arrival: foto dari admin dipakai, kecuali masih foto bawaan lama dan produknya
 * punya foto katalog (foto resmi ARM) — maka foto katalog yang dipakai. Foto unggahan admin selalu menang.
 */
export function preferCatalogImage(adminImage: string | undefined, catalogImage: string | undefined): string | undefined {
  if (!adminImage) return catalogImage;
  if (catalogImage && isLegacyPlaceholder(adminImage)) return catalogImage;
  return adminImage;
}

/** `*-grid.jpg` yang sudah dibersihkan menjadi foto penuh berlatar putih (bukan flyer di kanvas gelap). */
const FULL_BLEED_GRID_IMAGES = new Set(['/assets/products/fs-nmax-turbo-grid.jpg']);

/**
 * Kelas gambar untuk ubin kartu persegi (termasuk zoom saat disorot):
 * - flyer 480x480 di tengah kanvas gelap 800x600 (`*-grid.jpg`) → cover + scale 1.25 memotong tepat ke flyer;
 * - foto penuh berlatar putih → contain, produk tampil utuh di ubin putih;
 * - gambar lain → cover biasa.
 */
export function tileImageClass(src: string): string {
  if (FULL_BLEED_GRID_IMAGES.has(src)) return 'object-contain motion-safe:group-hover:scale-[1.03]';
  if (src.endsWith('-grid.jpg')) return 'object-cover scale-[1.25] motion-safe:group-hover:scale-[1.29]';
  return 'object-cover motion-safe:group-hover:scale-[1.03]';
}

/** Satu baris spesifikasi di bawah nama produk; bagian kosong dilewati (tanpa pemisah menggantung). */
export function specLine(inlet: string, material: string): string {
  const parts = [inlet.trim() ? `Inlet ${inlet.trim()}` : '', material.trim()].filter(Boolean);
  return parts.join(' · ');
}
