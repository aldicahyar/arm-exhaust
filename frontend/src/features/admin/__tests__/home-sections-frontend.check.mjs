import assert from 'node:assert';
import fs from 'node:fs';

const valPanelPath = 'frontend/src/features/admin/components/ValuePropsManagementPanel.tsx';
const arrPanelPath = 'frontend/src/features/admin/components/NewArrivalManagementPanel.tsx';
const shellPath = 'frontend/src/features/admin/components/AdminShell.tsx';
const typesPath = 'frontend/src/features/admin/types.ts';
const indexPath = 'frontend/src/features/admin/index.ts';

assert(fs.existsSync(valPanelPath), 'ValuePropsManagementPanel.tsx must exist');
assert(fs.existsSync(arrPanelPath), 'NewArrivalManagementPanel.tsx must exist');

const valContent = fs.readFileSync(valPanelPath, 'utf-8');
const arrContent = fs.readFileSync(arrPanelPath, 'utf-8');
const shellContent = fs.readFileSync(shellPath, 'utf-8');
const typesContent = fs.readFileSync(typesPath, 'utf-8');
const indexContent = fs.readFileSync(indexPath, 'utf-8');

assert(typesContent.includes("'value-props'"), "AdminShellTab must include 'value-props'");
assert(typesContent.includes("'new-arrivals'"), "AdminShellTab must include 'new-arrivals'");

assert(indexContent.includes('ValuePropsManagementPanel'), 'index.ts must export ValuePropsManagementPanel');
assert(indexContent.includes('NewArrivalManagementPanel'), 'index.ts must export NewArrivalManagementPanel');

assert(shellContent.includes('ValuePropsManagementPanel'), 'AdminShell must import ValuePropsManagementPanel');
assert(shellContent.includes('NewArrivalManagementPanel'), 'AdminShell must import NewArrivalManagementPanel');
assert(shellContent.includes('Pilar Keunggulan'), 'AdminShell must show "Pilar Keunggulan" in sidebar');
assert(shellContent.includes('Produk Beranda'), 'AdminShell must show "Produk Beranda" in sidebar');

assert(valContent.includes('Manajemen Pilar Keunggulan'), 'ValuePropsManagementPanel must have heading');
assert(valContent.includes('/api/admin/home/value-props'), 'ValuePropsManagementPanel must call value-props API');

assert(arrContent.includes('Manajemen Produk Beranda'), 'NewArrivalManagementPanel must have heading');
assert(arrContent.includes('/api/admin/home/new-arrivals'), 'NewArrivalManagementPanel must call new-arrivals API');
assert(arrContent.includes('PRODUCTS'), 'NewArrivalManagementPanel must integrate catalog picker');
console.log('✅ Task 4 frontend panels check passed');
