import fs from 'node:fs';
import path from 'node:path';
import assert from 'node:assert';

const heroPath = path.resolve('frontend/src/shared/components/HeroCarousel.tsx');
const pagePath = path.resolve('frontend/src/app/page.tsx');

assert.ok(fs.existsSync(heroPath), 'HeroCarousel.tsx must exist');
assert.ok(fs.existsSync(pagePath), 'page.tsx must exist');

const heroCode = fs.readFileSync(heroPath, 'utf8');
const pageCode = fs.readFileSync(pagePath, 'utf8');

console.log('Testing Landing Page Dynamic Integration & Fallback Resilience...');

// 1. HeroCarousel Tests
// 1.1 Rock-solid fallback array CAMPAIGN_SLIDES must exist and be exported
assert.ok(heroCode.includes('export const CAMPAIGN_SLIDES'), 'HeroCarousel.tsx must export CAMPAIGN_SLIDES fallback');

// 1.2 Must fetch from /api/public/campaign-slides
assert.ok(
  heroCode.includes('/api/public/campaign-slides'),
  'HeroCarousel.tsx must fetch from /api/public/campaign-slides'
);

// 1.3 Must handle dynamic state with CAMPAIGN_SLIDES as initial fallback
assert.ok(
  heroCode.includes('useState<readonly HeroCampaignSlide[]>(CAMPAIGN_SLIDES)') ||
  heroCode.includes('useState(CAMPAIGN_SLIDES)') ||
  heroCode.includes('useState<HeroCampaignSlide[]>(CAMPAIGN_SLIDES)'),
  'HeroCarousel.tsx must initialize slides state with CAMPAIGN_SLIDES fallback'
);

// 1.4 Must safely catch network/fetch errors without crashing
assert.ok(
  heroCode.includes('.catch('),
  'HeroCarousel.tsx must catch fetch errors safely for fallback resilience'
);

// 1.5 Must maintain zoom-proof layout and clutter-free monochrome style
assert.ok(
  heroCode.includes('calc(100svh - 129px)') && heroCode.includes('460px'),
  'HeroCarousel.tsx must maintain zoom-proof layout (calc(100svh - 129px) and minHeight: 460px)'
);
assert.ok(!heroCode.includes('btnText'), 'HeroCarousel.tsx must NOT contain physical button btnText');
assert.ok(!heroCode.includes('bg-white px-4'), 'HeroCarousel.tsx must NOT contain white button box');

// 2. Events Section in page.tsx Tests
// 2.1 Must fetch from /api/public/community-events
assert.ok(
  pageCode.includes('/api/public/community-events'),
  'page.tsx must fetch from /api/public/community-events'
);

// 2.2 Must have default events fallback
assert.ok(
  pageCode.includes('DEFAULT_COMMUNITY_EVENTS'),
  'page.tsx must define or export DEFAULT_COMMUNITY_EVENTS fallback'
);

// 2.3 Must catch fetch errors safely for fallback resilience
assert.ok(
  pageCode.includes('.catch('),
  'page.tsx must catch fetch errors safely for fallback resilience'
);

// 2.4 Must render 4:3 aspect ratio cards with next/image
assert.ok(
  pageCode.includes('aspect-[4/3]'),
  'Events section must render cards with aspect-[4/3]'
);
assert.ok(
  pageCode.includes('<Image') || pageCode.includes('<img'),
  'Events section must render event images inside 4:3 container'
);

// 2.5 Must render category badge, event date, title, and description
assert.ok(
  pageCode.includes('ev.title') || pageCode.includes('item.title') || pageCode.includes('event.title'),
  'Events section must render event title'
);
assert.ok(
  pageCode.includes('description') || pageCode.includes('ev.desc') || pageCode.includes('item.description'),
  'Events section must render event description'
);

// 2.6 STRICT VIP INVITE-ONLY CONSTRAINT: Zero public reseller registration / signup banner
assert.ok(
  !pageCode.toLowerCase().includes('daftar jadi reseller') &&
  !pageCode.toLowerCase().includes('daftar reseller') &&
  !pageCode.toLowerCase().includes('gabung reseller') &&
  !pageCode.toLowerCase().includes('register reseller'),
  'page.tsx must strictly enforce VIP invite-only constraint with ZERO public reseller registration banner'
);

console.log('PASS: All landing dynamic fallback assertions passed successfully!');
