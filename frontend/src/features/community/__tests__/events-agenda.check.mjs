import fs from 'node:fs';
import assert from 'node:assert';

const code = fs.readFileSync(new URL('../EventsAgenda.tsx', import.meta.url), 'utf8');

console.log('Testing Events agenda (Section 4)...');

const required = [
  ["font-['Montserrat']", 'same type family as the rest of the homepage'],
  ['px-4 sm:px-10', 'same page gutter as sections 2 and 3'],
  ['agendaDate(', 'date column comes from agendaDate'],
  ['<time', 'dates are marked up as <time>'],
  ['border-t border-[#1E1E21]', 'hairline-divided agenda rows'],
  ['onMouseEnter', 'hovering a row shows its photo'],
  ['onFocus', 'keyboard focus on a row shows its photo'],
  ['lg:hidden', 'phones show a small photo inside each row instead'],
  ['aria-labelledby="events-title"', 'section is labelled by its heading'],
];
for (const [needle, message] of required) assert.ok(code.includes(needle), message);

for (const banned of ['Space_Grotesk', 'font-mono', 'rounded-lg', 'max-w-6xl']) {
  assert.ok(!code.includes(banned), `must not contain "${banned}" (old, inconsistent section style)`);
}

console.log('PASS: Events agenda');
