import assert from 'node:assert';
import fs from 'node:fs';

const fileContent = fs.readFileSync('frontend/src/features/admin/components/SidebarSearch.tsx', 'utf-8');
assert(fileContent.includes('⌘K') || fileContent.includes('Ctrl+K'), 'Wajib memuat hint keyboard shortcut ⌘K');
assert(fileContent.includes('Search'), 'Wajib memuat icon Search dari lucide-react');

const modalContent = fs.readFileSync('frontend/src/features/admin/components/CommandPaletteModal.tsx', 'utf-8');
assert(modalContent.includes('onSelectTab'), 'CommandPaletteModal wajib menerima callback perpindahan tab');
console.log('PASS: SidebarSearch & CommandPaletteModal contract checks passed.');
