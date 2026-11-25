import fs from 'node:fs';
import path from 'node:path';
import assert from 'node:assert';

const heroPath = path.resolve('frontend/src/shared/components/HeroCarousel.tsx');
assert.ok(fs.existsSync(heroPath), 'HeroCarousel.tsx must exist');
const heroCode = fs.readFileSync(heroPath, 'utf8');

console.log('Testing Hero mobile image (art direction)...');

// 1. Public slide type exposes optional mobile image
assert.ok(
  heroCode.includes('readonly imageMobile?: string'),
  'HeroCampaignSlide must declare `readonly imageMobile?: string`',
);

// 2. API mapping reads snake_case field from backend
assert.ok(heroCode.includes('image_mobile_url'), 'HeroCarousel.tsx must map `image_mobile_url` from the API');

// 3. Art direction via getImageProps + <picture>
assert.ok(heroCode.includes('getImageProps'), 'HeroCarousel.tsx must use getImageProps for art direction');
assert.ok(heroCode.includes('<picture'), 'HeroCarousel.tsx must render a <picture> element for art direction');

// 4. Mobile breakpoint aligned with Tailwind md (>= 768px always desktop)
assert.ok(
  heroCode.includes('(max-width: 767px)'),
  'Mobile <source> must use media="(max-width: 767px)"',
);

// 4b. images.unoptimized: true => getImageProps returns no srcSet; <source> must fall back to src
assert.ok(
  /srcSet\s*\?\?\s*\w+\.src/.test(heroCode),
  'Mobile <source> srcSet must fall back to props.src when srcSet is absent (unoptimized images)',
);

// 5. Existing resilience preserved
assert.ok(heroCode.includes('export const CAMPAIGN_SLIDES'), 'HeroCarousel.tsx must still export CAMPAIGN_SLIDES');
assert.ok(heroCode.includes('.catch('), 'HeroCarousel.tsx must still catch fetch errors');

console.log('PASS: Hero mobile image assertions passed successfully!');
