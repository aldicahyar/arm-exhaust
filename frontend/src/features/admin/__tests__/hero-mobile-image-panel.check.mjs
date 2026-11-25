import fs from 'node:fs';
import path from 'node:path';
import assert from 'node:assert';

const typesPath = path.resolve('frontend/src/features/admin/types.ts');
const panelPath = path.resolve('frontend/src/features/admin/components/HeroManagementPanel.tsx');
assert.ok(fs.existsSync(typesPath), 'types.ts must exist');
assert.ok(fs.existsSync(panelPath), 'HeroManagementPanel.tsx must exist');

const typesCode = fs.readFileSync(typesPath, 'utf8');
const panelCode = fs.readFileSync(panelPath, 'utf8');

console.log('Testing hero mobile image admin panel...');

// 1. HeroSlide type exposes optional nullable mobile image
const heroSlideBlock = typesCode.slice(typesCode.indexOf('export interface HeroSlide'));
const heroSlideBody = heroSlideBlock.slice(0, heroSlideBlock.indexOf('}'));
assert.ok(
  heroSlideBody.includes('image_mobile_url?: string | null'),
  'HeroSlide must declare `image_mobile_url?: string | null`',
);

// 2. Form field + exact UI labels
assert.ok(panelCode.includes('image_mobile_url'), 'Panel must use `image_mobile_url`');
assert.ok(panelCode.includes('Gambar HP (9:16) — opsional'), 'Panel must render label `Gambar HP (9:16) — opsional`');
assert.ok(panelCode.includes('Tanpa gambar HP'), 'Panel must render list marker `Tanpa gambar HP`');
assert.ok(/>\s*Desktop\s*</.test(panelCode) || panelCode.includes("'Desktop'"), 'Preview must have a `Desktop` toggle');
assert.ok(/>\s*HP\s*</.test(panelCode) || panelCode.includes("'HP'"), 'Preview must have an `HP` toggle');
assert.ok(panelCode.includes('aria-pressed'), 'Preview toggle buttons must use aria-pressed');

// 3. Save payload sends null when the mobile image is cleared
assert.ok(
  panelCode.includes('image_mobile_url: formData.image_mobile_url.trim() || null'),
  'Save payload must contain `image_mobile_url: formData.image_mobile_url.trim() || null`',
);

// 4. Edit fills from slide with fallback for older slides / responses
assert.ok(
  panelCode.includes("slide.image_mobile_url ?? ''"),
  "Edit must populate form with `slide.image_mobile_url ?? ''`",
);

// 5. Upload handler parameterised by target
assert.ok(
  panelCode.includes("'image_url' | 'image_mobile_url'"),
  "Upload must be parameterised by target `'image_url' | 'image_mobile_url'`",
);

// 6. Mobile image is NOT required by validation
const validateStart = panelCode.indexOf('function validateHeroForm');
const validateBody = panelCode.slice(validateStart, panelCode.indexOf('\n}', validateStart));
assert.ok(!validateBody.includes('image_mobile_url'), 'validateHeroForm must not require image_mobile_url');

// 7. Add/edit modal shows a live phone (HP) preview built from the current formData
assert.ok(
  panelCode.includes('function HeroModalPhonePreview'),
  'Panel must define a `HeroModalPhonePreview` component for the modal',
);
const modalStart = panelCode.indexOf('function HeroSlideModal');
const modalBody = panelCode.slice(modalStart, panelCode.indexOf('\n}\n', modalStart));
assert.ok(
  /<HeroModalPhonePreview[^>]*formData=\{formData\}/.test(modalBody),
  'HeroSlideModal must render `<HeroModalPhonePreview formData={formData} />`',
);
const phoneStart = panelCode.indexOf('function HeroModalPhonePreview');
const phoneBody = panelCode.slice(phoneStart, panelCode.indexOf('\n}\n', phoneStart));
assert.ok(phoneBody.includes('formData.image_mobile_url'), 'Phone preview must read `formData.image_mobile_url`');
assert.ok(phoneBody.includes('formData.image_url'), 'Phone preview must read `formData.image_url` (fallback / visibility)');
assert.ok(phoneBody.includes('<HeroPreviewFrame device="mobile"'), 'Phone preview must reuse `<HeroPreviewFrame device="mobile">`');
assert.ok(phoneBody.includes('<HeroPreviewSlide'), 'Phone preview must reuse `<HeroPreviewSlide>`');
assert.ok(phoneBody.includes('return null'), 'Phone preview must render nothing when no image URL is filled');

// 8. Drop zone is not natively disabled while uploading (Chromium would drop drag events)
const fieldStart = panelCode.indexOf('function HeroImageField');
const fieldBody = panelCode.slice(fieldStart, panelCode.indexOf('\n}\n', fieldStart));
assert.ok(fieldBody.includes('aria-disabled={isUploading}'), 'Drop zone must use `aria-disabled={isUploading}`');
const dropZoneTag = fieldBody.slice(fieldBody.indexOf('onDragEnter='), fieldBody.indexOf('aria-label={uploadAriaLabel}'));
assert.ok(!/\sdisabled=/.test(dropZoneTag), 'Drop zone must not use native `disabled`');

// 9. Modal subtitle mentions the optional HP image
assert.ok(
  panelCode.includes('Visual desktop 16:9, gambar HP 9:16 (opsional), dan teks banner beranda.'),
  'Modal subtitle must mention the optional 9:16 HP image',
);

console.log('PASS: Hero mobile image panel assertions passed successfully!');
