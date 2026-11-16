import assert from 'node:assert';
import fs from 'node:fs';

const valPath = 'frontend/src/features/admin/components/ValuePropsManagementPanel.tsx';
const arrPath = 'frontend/src/features/admin/components/NewArrivalManagementPanel.tsx';
const eventPath = 'frontend/src/features/admin/components/EventManagementPanel.tsx';

assert(fs.existsSync(valPath), 'ValuePropsManagementPanel.tsx must exist');
assert(fs.existsSync(arrPath), 'NewArrivalManagementPanel.tsx must exist');
assert(fs.existsSync(eventPath), 'EventManagementPanel.tsx must exist');

const valContent = fs.readFileSync(valPath, 'utf-8');
const arrContent = fs.readFileSync(arrPath, 'utf-8');
const eventContent = fs.readFileSync(eventPath, 'utf-8');

// 1. ValueProps Linear Stack
assert(!valContent.includes('grid-cols-1 md:grid-cols-2 lg:grid-cols-3'), 'ValuePropsManagementPanel must not use 3-column card grid');
assert(valContent.includes('flex flex-col gap-2'), 'ValuePropsManagementPanel must use linear stack layout');
assert(valContent.includes('Array.isArray(items)'), 'ValuePropsManagementPanel must use defensive Array.isArray guard');
assert(valContent.includes('persistOrder'), 'ValuePropsManagementPanel must have persistOrder pipeline');
assert(valContent.includes('transition-colors duration-150'), 'ValuePropsManagementPanel sortable row must use transition-colors duration-150');
assert(valContent.includes('handleGripKeyDown'), 'ValuePropsManagementPanel sortable row must support keyboard navigation on grip');
assert(valContent.includes("String(index + 1).padStart(2, '0')"), 'ValuePropsManagementPanel must format step badge dynamically from index');
assert(valContent.includes('w-5 font-mono text-[11px] font-semibold text-zinc-500 tabular-nums'), 'ValuePropsManagementPanel must use standardized transparent number index matching Hero Carousel');
assert(!valContent.includes('rounded bg-[#0A0A0B] px-2 py-0.5 text-[10px]'), 'ValuePropsManagementPanel must not use solid boxed number badge');
assert(!valContent.includes('<ArrowUp'), 'ValuePropsManagementPanel must not render <ArrowUp /> button');
assert(!valContent.includes('<ArrowDown'), 'ValuePropsManagementPanel must not render <ArrowDown /> button');
assert(!valContent.includes('lastCommittedRef.current = items;'), 'ValuePropsManagementPanel must not overwrite lastCommittedRef in useEffect');
console.log('✅ ValueProps linear stack test passed');

// 2. NewArrival Linear Stack
assert(!arrContent.includes('<div className="grid grid-cols-1 md:grid-cols-2 gap-4">'), 'NewArrivalManagementPanel must not use 2-column card grid');
assert(arrContent.includes('flex flex-col gap-2'), 'NewArrivalManagementPanel must use linear stack layout');
assert(arrContent.includes('Array.isArray(items)'), 'NewArrivalManagementPanel must use defensive Array.isArray guard');
assert(arrContent.includes('persistOrder'), 'NewArrivalManagementPanel must have persistOrder pipeline');
assert(arrContent.includes('transition-colors duration-150'), 'NewArrivalManagementPanel sortable row must use transition-colors duration-150');
assert(arrContent.includes('handleGripKeyDown'), 'NewArrivalManagementPanel sortable row must support keyboard navigation on grip');
assert(!arrContent.includes('<ArrowUp'), 'NewArrivalManagementPanel must not render <ArrowUp /> button');
assert(!arrContent.includes('<ArrowDown'), 'NewArrivalManagementPanel must not render <ArrowDown /> button');
assert(!arrContent.includes('lastCommittedRef.current = items;'), 'NewArrivalManagementPanel must not overwrite lastCommittedRef in useEffect');
assert(!arrContent.includes('py-0.2'), 'NewArrivalManagementPanel must not use invalid py-0.2 class');
assert(arrContent.includes("String(index + 1).padStart(2, '0')"), 'NewArrivalManagementPanel must format step badge dynamically from index');
assert(arrContent.includes('w-5 font-mono text-[11px] font-semibold text-zinc-500 tabular-nums'), 'NewArrivalManagementPanel must use standardized transparent number index matching Hero Carousel');
assert(!arrContent.includes('rounded bg-[#0A0A0B] px-2 py-0.5 text-[10px]'), 'NewArrivalManagementPanel must not use solid boxed number badge');
console.log('✅ NewArrival linear stack test passed');

// 3. EventManagement Linear Stack
assert(!eventContent.includes('<div className="grid grid-cols-1 md:grid-cols-2 gap-4">'), 'EventManagementPanel must not use 2-column card grid');
assert(eventContent.includes('flex flex-col gap-2'), 'EventManagementPanel must use linear stack layout');
assert(eventContent.includes('persistOrder'), 'EventManagementPanel must have persistOrder pipeline');
assert(eventContent.includes('transition-colors duration-150'), 'EventManagementPanel sortable row must use transition-colors duration-150');
assert(eventContent.includes('handleGripKeyDown'), 'EventManagementPanel sortable row must support keyboard navigation on grip');
assert(!eventContent.includes('<ArrowUp'), 'EventManagementPanel must not render <ArrowUp /> button');
assert(!eventContent.includes('<ArrowDown'), 'EventManagementPanel must not render <ArrowDown /> button');
assert(!eventContent.includes('lastCommittedRef.current = events;'), 'EventManagementPanel must not overwrite lastCommittedRef in useEffect');
assert(!eventContent.includes('py-0.2'), 'EventManagementPanel must not use invalid py-0.2 class');
assert(eventContent.includes("String(index + 1).padStart(2, '0')"), 'EventManagementPanel must format step badge dynamically from index');
assert(eventContent.includes('w-5 font-mono text-[11px] font-semibold text-zinc-500 tabular-nums'), 'EventManagementPanel must use standardized transparent number index matching Hero Carousel');
assert(!eventContent.includes('rounded bg-[#0A0A0B] px-2 py-0.5 text-[10px]'), 'EventManagementPanel must not use solid boxed number badge');
console.log('✅ EventManagement linear stack test passed');

// 4. A11y & Semantic Checks
const panels = [
  { name: 'ValuePropsManagementPanel', content: valContent },
  { name: 'NewArrivalManagementPanel', content: arrContent },
  { name: 'EventManagementPanel', content: eventContent },
];

for (const p of panels) {
  // Ensure no un-typed button exists
  const unTypedButtonMatch = p.content.match(/<button(?![^>]*type=)/);
  assert(!unTypedButtonMatch, `${p.name} contains button without explicit type attribute`);

  // Ensure reorder buttons have aria-label
  assert(p.content.includes('aria-label='), `${p.name} must include aria-label for accessibility`);
  assert(p.content.includes('role="switch"'), `${p.name} must include role="switch" for status toggles`);
}

console.log('✅ All A11y and semantic button audits passed');
