import assert from 'node:assert';
import fs from 'node:fs';

// Verify file existence
assert(
  fs.existsSync('frontend/src/features/admin/components/TaxConfigPanel.tsx'),
  'frontend/src/features/admin/components/TaxConfigPanel.tsx must exist'
);

const content = fs.readFileSync('frontend/src/features/admin/components/TaxConfigPanel.tsx', 'utf-8');

// 1. Core Tax configuration form fields
assert(content.includes('taxPercent') || content.includes('PPN'), 'Wajib memuat form konfigurasi tarif PPN');
assert(content.includes('11') && content.includes('12') && content.includes('0'), 'Wajib menyediakan preset persentase cepat (0%, 11%, 12%)');

// 2. Mode PPN (Include vs Exclude)
assert(content.includes('include') || content.includes('Include Tax'), 'Wajib memuat opsi Include Tax');
assert(content.includes('exclude') || content.includes('Exclude Tax'), 'Wajib memuat opsi Exclude Tax');

// 3. Faktur Pajak B2B & NPWP company identity
assert(content.includes('fakturPajak') || content.includes('NPWP'), 'Wajib memuat pengaturan faktur pajak / NPWP');
assert(content.includes('PT ARM Karya Knalpot Indonesia') || content.includes('Nama Wajib Pajak'), 'Wajib memuat identitas perusahaan / nama wajib pajak');

// 4. API Backend integration
assert(content.includes('/api/admin/tax'), 'Wajib memanggil endpoint /api/admin/tax');
assert(content.includes('PUT'), 'Wajib memanggil method PUT untuk menyimpan konfigurasi');

// 5. Feedback notification
assert(content.includes('useNotice'), 'Wajib mengintegrasikan feedback notifikasi useNotice');

// 6. UI & Icons
assert(content.includes('Receipt') || content.includes('Percent'), 'Wajib mengimpor icon yang relevan (Receipt/Percent)');
assert(content.includes('export function TaxConfigPanel') || content.includes('export const TaxConfigPanel'), 'Wajib mengexport TaxConfigPanel');

// 7. Barrel export in index.ts
const indexContent = fs.readFileSync('frontend/src/features/admin/index.ts', 'utf-8');
assert(indexContent.includes('TaxConfigPanel'), 'frontend/src/features/admin/index.ts wajib mengexport TaxConfigPanel');

// 8. Robustness & Bounds checking
assert(content.includes('Math.min(100') && content.includes('Math.max(0'), 'Wajib membatasi input tarif PPN antara 0-100%');
assert(content.includes('max={100}'), 'Wajib mengonfigurasi slider dengan max 100%');
assert(!/fetchTaxConfig = useCallback\([\s\S]*?\[[^\]]*isForbidden[^\]]*\]\);/.test(content), 'fetchTaxConfig dependency array tidak boleh menyertakan isForbidden untuk mencegah loop render');

console.log('PASS: TaxConfigPanel contract passed.');
