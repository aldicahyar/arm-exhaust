import assert from 'node:assert';
import fs from 'node:fs';

const pagePath = 'frontend/src/app/page.tsx';
assert(fs.existsSync(pagePath), 'page.tsx must exist');
const pageContent = fs.readFileSync(pagePath, 'utf-8');

assert(pageContent.includes('DEFAULT_VALUE_PROPS'), 'page.tsx must define DEFAULT_VALUE_PROPS fallback');
assert(pageContent.includes('DEFAULT_NEW_ARRIVALS'), 'page.tsx must define DEFAULT_NEW_ARRIVALS fallback');
assert(pageContent.includes('/api/public/home-content'), 'page.tsx must fetch dynamic section content from /api/public/home-content');
assert(pageContent.includes('valueProps.map') || pageContent.includes('valueProps'), 'page.tsx must render dynamic value props state');
assert(pageContent.includes('newArrivals.map') || pageContent.includes('newArrivals'), 'page.tsx must render dynamic new arrivals state');
assert(!pageContent.includes('#2E6BFF'), 'page.tsx must not contain blue accent #2E6BFF');
console.log('✅ Task 5 homepage dynamic content check passed');
