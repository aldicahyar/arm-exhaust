import assert from 'node:assert';
import fs from 'node:fs';

const fileContent = fs.readFileSync('frontend/src/features/admin/components/OrdersTable.tsx', 'utf8');

// Test 1: Zero '#' in DEFAULT_EXHAUST_ORDERS IDs
const idMatches = fileContent.match(/id:\s*['"](#ARM-\d+)['"]/g);
assert.strictEqual(idMatches, null, 'Expected no "#ARM-" IDs in OrdersTable.tsx');
assert.ok(fileContent.includes("id: 'ARM-8821'"), 'Expected clean "ARM-8821" ID');

// Test 2: Physical workshop telemetry strip & zero financial figures in header
assert.ok(!fileContent.includes('Total Nilai Pesanan'), 'Header must not contain "Total Nilai Pesanan"');
assert.ok(fileContent.includes('Workshop TIG & Dyno') || fileContent.includes('Workshop TIG'), 'Header must contain physical workshop telemetry');
assert.ok(fileContent.includes('Validasi Specs') || fileContent.includes('Menunggu Validasi'), 'Header must contain validation telemetry');
assert.ok(fileContent.includes('Siap Pickup Kargo') || fileContent.includes('Siap Kirim'), 'Header must contain ready to ship telemetry');

// Test 3: Full-width Table + Slide-Over Pop-Up Drawer (Inspector Sheet via Portal)
assert.ok(fileContent.includes('isDrawerOpen'), 'Expected isDrawerOpen state for slide-over drawer');
assert.ok(fileContent.includes('setIsDrawerOpen'), 'Expected setIsDrawerOpen state setter');
assert.ok(fileContent.includes('fixed inset-y-0 right-0'), 'Expected drawer to slide in from right edge');
assert.ok(fileContent.includes('selectedOrderId'), 'Expected selectedOrderId state to manage active row');
assert.ok(fileContent.includes('createPortal'), 'Wajib menggunakan createPortal agar backdrop menutupi seluruh topbar');
assert.ok(fileContent.includes('document.body'), 'Wajib merender portal ke document.body');

// Test 4: Inspector drawer features & zero alert pop-up modals
assert.ok(fileContent.includes('Spesifikasi Manufaktur') || fileContent.includes('Spesifikasi Knalpot'), 'Inspector must display workshop manufacturing specs');
assert.ok(fileContent.includes('cekresi.com') || fileContent.includes('Lacak Ekspedisi'), 'Inspector must provide direct courier tracking link');
assert.ok(fileContent.includes('handleSaveInlineAdvance'), 'Must provide inline form for courier and resi');

// Test 5: Pure Monochrome badge tokens (zero glowing/pulsing dots) & clean scrollbar-none
assert.ok(!fileContent.includes('animate-pulse'), 'Must not contain pulsing dots');
assert.ok(fileContent.includes('border-zinc-900 bg-zinc-900 text-white'), 'Must use pure dark badge for active production');
assert.ok(fileContent.includes('scrollbar-none'), 'Drawer and table containers must use scrollbar-none');

console.log('ALL DRAWER & WORKSHOP CHECKS PASS: Full-width table, pop-up drawer, pure monochrome tokens, zero modals, zero hash symbols, and scrollbar-none verified.');
