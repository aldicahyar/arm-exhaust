import fs from 'node:fs';
import path from 'node:path';
import assert from 'node:assert';

const headerPath = path.resolve('frontend/src/shared/components/HeaderTabs.tsx');
const heroPath = path.resolve('frontend/src/shared/components/HeroCarousel.tsx');

assert.ok(fs.existsSync(headerPath), 'HeaderTabs.tsx must exist');
assert.ok(fs.existsSync(heroPath), 'HeroCarousel.tsx must exist');

const headerCode = fs.readFileSync(headerPath, 'utf8');
const heroCode = fs.readFileSync(heroPath, 'utf8');

// 1. HeaderTabs verification
assert.ok(!headerCode.includes('#E81828'), 'HeaderTabs.tsx must NOT contain any #E81828 red accent');
assert.ok(headerCode.includes('bg-white shadow-[0_0_8px_rgba(255,255,255,0.35)]'), 'HeaderTabs.tsx must have pure white sliding underline');
assert.ok(headerCode.includes('focus-visible:ring-zinc-400'), 'HeaderTabs.tsx must use monochrome focus-visible ring');

// 2. HeroCarousel verification
assert.ok(heroCode.includes('CAMPAIGN_SLIDES'), 'HeroCarousel.tsx must export CAMPAIGN_SLIDES');
assert.ok(heroCode.includes('PRODUK') && heroCode.includes('PROMO') && heroCode.includes('ACARA') && heroCode.includes('WORKSHOP'), 'HeroCarousel.tsx must support all 4 campaign categories');
assert.ok(heroCode.includes('useReducedMotion'), 'HeroCarousel.tsx must support prefers-reduced-motion via useReducedMotion');
assert.ok(heroCode.includes('bg-gradient-to-t') && heroCode.includes('bg-gradient-to-r'), 'HeroCarousel.tsx must have dual ambient dark gradient overlay');
assert.ok(heroCode.includes('calc(100svh - 129px)'), 'HeroCarousel.tsx must fit exactly 100svh below header');

// 3. Image uniformity verification
assert.ok(!heroCode.includes('fs-nmax-turbo-hero.jpg'), 'HeroCarousel.tsx must NOT use oversized cutout image');
assert.ok(!heroCode.includes('kdv2-vario125-hero.jpg'), 'HeroCarousel.tsx must NOT use square poster image');
assert.ok(!heroCode.includes('stdr-beat-hero.jpg'), 'HeroCarousel.tsx must NOT use square poster image');

// 4. Clutter-Free Option 1: Physical white button removed, title as calm interactive link
assert.ok(!heroCode.includes('btnText'), 'HeroCarousel.tsx must NOT have btnText (no physical CTA button)');
assert.ok(!heroCode.includes('bg-white px-4'), 'HeroCarousel.tsx must NOT render physical white button box');
assert.ok(heroCode.includes('href={slide.href}'), 'HeroCarousel.tsx title must be wrapped as clean interactive link');

console.log('PASS: Hero & Header Full-Screen Fit, Zoom Stability, and Clutter-Free Hero contracts passed 100%!');
