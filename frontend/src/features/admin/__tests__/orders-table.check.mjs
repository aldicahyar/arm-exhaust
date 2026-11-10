import assert from 'node:assert';
import fs from 'node:fs';

const content = fs.readFileSync('frontend/src/features/admin/components/OrdersTable.tsx', 'utf-8');

// 1. Order Types & Manufacturing
assert(content.includes('READY STOCK') && content.includes('PRE-ORDER / CUSTOM'), 'Wajib memuat tipe pesanan Ready Stock vs Pre-Order / Custom');

// 2. WhatsApp Integration
assert(content.includes('wa.me') && content.includes('MessageSquare'), 'Wajib memuat integrasi WhatsApp untuk transparansi kustomer');
assert(content.includes('buildWhatsAppOrderUrl'), 'Wajib menyediakan fungsi helper URL WhatsApp');

// 3. Status Tabs
assert(
  content.includes('Menunggu Konfirmasi') &&
  content.includes('Antrean Produksi & QC') &&
  content.includes('Siap Kirim') &&
  content.includes('Selesai'),
  'Wajib memuat tab status manufaktur lengkap'
);

// 4. Lucide Icons
const requiredIcons = ['Package', 'Clock', 'Truck', 'CheckCircle2', 'MessageSquare', 'Filter', 'Search'];
for (const icon of requiredIcons) {
  assert(content.includes(icon), `Wajib mengimport dan menggunakan icon ${icon}`);
}

// 5. Component & Module Exports
assert(content.includes('export function OrdersTable'), 'Wajib mengexport OrdersTable component');
assert(content.includes('export const DEFAULT_EXHAUST_ORDERS'), 'Wajib mengexport data default pesanan');

const indexContent = fs.readFileSync('frontend/src/features/admin/index.ts', 'utf-8');
assert(indexContent.includes('OrdersTable'), 'index.ts wajib mengexport OrdersTable');

const typesContent = fs.readFileSync('frontend/src/features/admin/types.ts', 'utf-8');
assert(typesContent.includes('ExhaustOrder'), 'types.ts wajib mendefinisikan interface ExhaustOrder');

console.log('PASS: OrdersTable full operational contract passed.');
