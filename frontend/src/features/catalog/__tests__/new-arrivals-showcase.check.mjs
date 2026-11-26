import fs from 'node:fs';
import assert from 'node:assert';

const code = fs.readFileSync(new URL('../NewArrivalsShowcase.tsx', import.meta.url), 'utf8');

console.log('Testing New Arrivals section (Section 3)...');

const required = [
  // Atmosphere: blurred official ARM photos, lighter blur, darker overlay, edges fading into the page
  ['PRODUCTS.map(', 'backdrop uses the catalog product photos that ship with the repo'],
  ['backdropTiles(', 'backdrop tiles come from backdropTiles'],
  ['blur-lg', 'lighter blur so product shapes still read'],
  ['bg-[#0A0A0B]/55', 'overlay keeps text readable without erasing the photos'],
  ['from-[#0A0A0B]', 'top/bottom edges fade into the page background'],
  ['aria-hidden="true"', 'backdrop is decorative'],
  // Content: heading, one visible link to the catalog, four product cards (rail on phones, grid on desktop)
  ['id="new-arrivals-title"', 'heading id for aria-labelledby'],
  ["'See All New Arrival'", 'catalog link copy'],
  ['underline', 'catalog link looks clickable without hover'],
  ['snap-x', 'phones get a swipeable rail'],
  ['lg:grid-cols-4', 'desktop shows the four products in a row'],
  ['specLine(', 'spec line under each product name'],
  ['tileImageClass(', 'card photo fit comes from tileImageClass (flyer crop)'],
  ['useReducedMotion', 'entrance motion respects reduced motion'],
];
for (const [needle, message] of required) assert.ok(code.includes(needle), message);

// No pinned scroll anymore: one screen, nothing held under the header
// Photos downloaded for reference live in docs/ (not shipped): code must not point at them
for (const banned of ['useScroll', 'sticky', 'setInterval', 'AnimatePresence', 'arm-official']) {
  assert.ok(!code.includes(banned), `must not contain "${banned}"`);
}

console.log('PASS: New Arrivals section');
