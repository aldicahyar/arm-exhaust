import assert from 'node:assert';
import fs from 'node:fs';

const heroPanelPath = 'frontend/src/features/admin/components/HeroManagementPanel.tsx';
const eventPanelPath = 'frontend/src/features/admin/components/EventManagementPanel.tsx';
const modalSubmitPath = 'frontend/src/features/admin/components/AdminModalSubmit.tsx';
const adminShellPath = 'frontend/src/features/admin/components/AdminShell.tsx';
const indexPath = 'frontend/src/features/admin/index.ts';

// 1. Verify existence of panel files
assert(
  fs.existsSync(heroPanelPath),
  'frontend/src/features/admin/components/HeroManagementPanel.tsx must exist'
);
assert(
  fs.existsSync(eventPanelPath),
  'frontend/src/features/admin/components/EventManagementPanel.tsx must exist'
);
assert(
  fs.existsSync(modalSubmitPath),
  'frontend/src/features/admin/components/AdminModalSubmit.tsx must exist'
);

const heroContent = fs.readFileSync(heroPanelPath, 'utf-8');
const eventContent = fs.readFileSync(eventPanelPath, 'utf-8');
const modalSubmitContent = fs.readFileSync(modalSubmitPath, 'utf-8');
const shellContent = fs.readFileSync(adminShellPath, 'utf-8');
const indexContent = fs.readFileSync(indexPath, 'utf-8');

// 2. Verify exports in index.ts
assert(
  indexContent.includes('HeroManagementPanel'),
  'frontend/src/features/admin/index.ts must export HeroManagementPanel'
);
assert(
  indexContent.includes('EventManagementPanel'),
  'frontend/src/features/admin/index.ts must export EventManagementPanel'
);
assert(
  indexContent.includes('AdminModalSubmit'),
  'frontend/src/features/admin/index.ts must export AdminModalSubmit'
);

// 3. Verify integration in AdminShell.tsx
assert(
  shellContent.includes('HeroManagementPanel'),
  'AdminShell.tsx must import and use HeroManagementPanel'
);
assert(
  shellContent.includes('EventManagementPanel'),
  'AdminShell.tsx must import and use EventManagementPanel'
);
assert(
  shellContent.includes('<HeroManagementPanel') || shellContent.includes('<HeroManagementPanel />'),
  'AdminShell.tsx must mount <HeroManagementPanel /> when activeTab is hero'
);
assert(
  shellContent.includes('<EventManagementPanel') || shellContent.includes('<EventManagementPanel />'),
  'AdminShell.tsx must mount <EventManagementPanel /> when activeTab is events'
);

// 4. HeroManagementPanel Contract & UI Requirements
assert(
  heroContent.includes('Manajemen Hero Carousel'),
  'HeroManagementPanel must include title "Manajemen Hero Carousel"'
);
assert(
  heroContent.includes('Tambah Slide') || heroContent.includes('+ Tambah Slide'),
  'HeroManagementPanel must include "+ Tambah Slide" action button'
);
assert(
  heroContent.includes('PRODUK') &&
  heroContent.includes('PROMO') &&
  heroContent.includes('ACARA') &&
  heroContent.includes('WORKSHOP'),
  'HeroManagementPanel must support categories: PRODUK, PROMO, ACARA, WORKSHOP'
);
assert(
  heroContent.includes('/api/admin/hero-slides'),
  'HeroManagementPanel must connect to /api/admin/hero-slides'
);
assert(
  heroContent.includes('reorder') && heroContent.includes('PATCH'),
  'HeroManagementPanel must call reorder endpoint with PATCH'
);
assert(
  heroContent.includes('toggle') || heroContent.includes('/toggle'),
  'HeroManagementPanel must call toggle endpoint'
);
assert(
  heroContent.includes('/api/admin/media/upload'),
  'HeroManagementPanel must integrate file dropzone posting to /api/admin/media/upload'
);
assert(
  heroContent.includes('strip_title') || heroContent.includes('stripTitle'),
  'HeroManagementPanel must handle strip_title field'
);
assert(
  heroContent.includes('aspect-video') || heroContent.includes('16/9'),
  'HeroManagementPanel must provide 16:9 thumbnail preview'
);

// 5. EventManagementPanel Contract & UI Requirements
assert(
  eventContent.includes('Manajemen Event & Komunitas'),
  'EventManagementPanel must include title "Manajemen Event & Komunitas"'
);
assert(
  eventContent.includes('Tambah Event') || eventContent.includes('+ Tambah Event'),
  'EventManagementPanel must include "+ Tambah Event" action button'
);
assert(
  eventContent.includes('TRACK EVENT') || eventContent.includes('COMMUNITY') || eventContent.includes('WORKSHOP'),
  'EventManagementPanel must support event tags/categories like TRACK EVENT, COMMUNITY, WORKSHOP'
);
assert(
  eventContent.includes('/api/admin/community-events'),
  'EventManagementPanel must connect to /api/admin/community-events'
);
assert(
  eventContent.includes('reorder') && eventContent.includes('PATCH'),
  'EventManagementPanel must call reorder endpoint with PATCH'
);
assert(
  eventContent.includes('toggle') || eventContent.includes('/toggle'),
  'EventManagementPanel must call toggle endpoint'
);
assert(
  eventContent.includes('/api/admin/media/upload'),
  'EventManagementPanel must integrate file dropzone posting to /api/admin/media/upload'
);
assert(
  eventContent.includes('event_date') || eventContent.includes('eventDate'),
  'EventManagementPanel must handle event_date field'
);
assert(
  eventContent.includes('description') || eventContent.includes('deskripsi'),
  'EventManagementPanel must handle description field'
);
assert(
  eventContent.includes('aspect-[4/3]') || eventContent.includes('aspect-4/3') || eventContent.includes('4/3'),
  'EventManagementPanel must provide 4:3 thumbnail preview'
);

// 6. Light Monochrome Modals & Container Structure (.scrollbar-none + max-h-[88vh] + sticky footer)
assert(
  !heroContent.includes('bg-[#141416] p-6 text-white'),
  'HeroManagementPanel modal must NOT use dark surface class "bg-[#141416] p-6 text-white"'
);
assert(
  !eventContent.includes('bg-[#141416] p-6 text-white'),
  'EventManagementPanel modal must NOT use dark surface class "bg-[#141416] p-6 text-white"'
);
assert(
  heroContent.includes('max-h-[88vh]'),
  'HeroManagementPanel modal container must use "max-h-[88vh]"'
);
assert(
  eventContent.includes('max-h-[88vh]'),
  'EventManagementPanel modal container must use "max-h-[88vh]"'
);
assert(
  heroContent.includes('overflow-y-auto scrollbar-none'),
  'HeroManagementPanel modal body must use "overflow-y-auto scrollbar-none"'
);
assert(
  eventContent.includes('overflow-y-auto scrollbar-none'),
  'EventManagementPanel modal body must use "overflow-y-auto scrollbar-none"'
);
assert(
  heroContent.includes('shrink-0 border-b border-zinc-200'),
  'HeroManagementPanel modal must feature clean header with "shrink-0 border-b border-zinc-200"'
);
assert(
  eventContent.includes('shrink-0 border-b border-zinc-200'),
  'EventManagementPanel modal must feature clean header with "shrink-0 border-b border-zinc-200"'
);
assert(
  heroContent.includes('shrink-0 border-t border-zinc-200'),
  'HeroManagementPanel modal must feature sticky footer with "shrink-0 border-t border-zinc-200"'
);
assert(
  eventContent.includes('shrink-0 border-t border-zinc-200'),
  'EventManagementPanel modal must feature sticky footer with "shrink-0 border-t border-zinc-200"'
);
assert(
  heroContent.includes('bg-zinc-950/45'),
  'HeroManagementPanel modal backdrop must use "bg-zinc-950/45"'
);
assert(
  eventContent.includes('bg-zinc-950/45'),
  'EventManagementPanel modal backdrop must use "bg-zinc-950/45"'
);

// 7. Stateful Animated Save Button & Motion Safety (DRY Shared AdminModalSubmit Lifecycle)
assert(
  heroContent.includes('AdminModalSubmit') && heroContent.includes('AdminModalSubmitButton') && heroContent.includes('useModalSubmit'),
  'HeroManagementPanel must import and use the shared AdminModalSubmit helper & hook'
);
assert(
  eventContent.includes('AdminModalSubmit') && eventContent.includes('AdminModalSubmitButton') && eventContent.includes('useModalSubmit'),
  'EventManagementPanel must import and use the shared AdminModalSubmit helper & hook'
);
assert(
  modalSubmitContent.includes('useReducedMotion'),
  'AdminModalSubmit must import and use useReducedMotion'
);
assert(
  modalSubmitContent.includes('Tersimpan!'),
  'AdminModalSubmit must provide "Tersimpan!" stateful button feedback'
);
assert(
  heroContent.includes('Tersimpan!'),
  'HeroManagementPanel must provide "Tersimpan!" stateful button feedback'
);
assert(
  eventContent.includes('Tersimpan!'),
  'EventManagementPanel must provide "Tersimpan!" stateful button feedback'
);
assert(
  modalSubmitContent.includes('SubmitVisualState') || (modalSubmitContent.includes("'idle'") && modalSubmitContent.includes("'saving'") && modalSubmitContent.includes("'success'")),
  'AdminModalSubmit must define submit visual states (idle, saving, success)'
);
assert(
  heroContent.includes('SubmitVisualState') || (heroContent.includes("'idle'") && heroContent.includes("'saving'") && heroContent.includes("'success'")),
  'HeroManagementPanel must define submit visual states (idle, saving, success)'
);
assert(
  eventContent.includes('SubmitVisualState') || (eventContent.includes("'idle'") && eventContent.includes("'saving'") && eventContent.includes("'success'")),
  'EventManagementPanel must define submit visual states (idle, saving, success)'
);
assert(
  modalSubmitContent.includes('try') && modalSubmitContent.includes('catch'),
  'AdminModalSubmit must wrap submission in try/catch to prevent unhandled rejection lockups'
);
assert(
  heroContent.includes('role="dialog"') && heroContent.includes('aria-modal="true"') && heroContent.includes('aria-labelledby='),
  'HeroManagementPanel modal must specify role="dialog", aria-modal="true", and aria-labelledby'
);
assert(
  eventContent.includes('role="dialog"') && eventContent.includes('aria-modal="true"') && eventContent.includes('aria-labelledby='),
  'EventManagementPanel modal must specify role="dialog", aria-modal="true", and aria-labelledby'
);

// 8. Trace Instrumentation on notify calls ({ source, action, detail })
assert(
  heroContent.includes("source: 'Hero Carousel'") || heroContent.includes('HERO_NOTICE_SOURCE'),
  'HeroManagementPanel notify calls must be instrumented with source: "Hero Carousel"'
);
assert(
  eventContent.includes("source: 'Event & Komunitas'") || eventContent.includes('EVENT_NOTICE_SOURCE'),
  'EventManagementPanel notify calls must be instrumented with source: "Event & Komunitas"'
);
assert(
  heroContent.includes('action:') && heroContent.includes('detail:'),
  'HeroManagementPanel notify calls must pass action and detail metadata'
);
assert(
  eventContent.includes('action:') && eventContent.includes('detail:'),
  'EventManagementPanel notify calls must pass action and detail metadata'
);

console.log('🎉 PASS: All Content Panels contracts and UI requirements verified successfully!');
