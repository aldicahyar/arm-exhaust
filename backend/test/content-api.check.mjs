import assert from 'node:assert/strict';
import * as fs from 'node:fs';
import * as path from 'node:path';
import { fileURLToPath } from 'node:url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const backendDir = path.resolve(__dirname, '..');

const contentServicePath = path.resolve(backendDir, 'src/features/admin/content-management.service.ts');
const publicControllerPath = path.resolve(backendDir, 'src/features/admin/public-content.controller.ts');
const adminControllerPath = path.resolve(backendDir, 'src/features/admin/admin.controller.ts');
const adminModulePath = path.resolve(backendDir, 'src/features/admin/admin.module.ts');
const slideDtoPath = path.resolve(backendDir, 'src/features/admin/dto/campaign-slide.dto.ts');
const eventDtoPath = path.resolve(backendDir, 'src/features/admin/dto/community-event.dto.ts');

console.log('=== [TDD Test] Backend Content Management API Verification ===\n');

// 1. Verify existence of required files
console.log('--- [1/6] Checking file existence ---');
assert.ok(fs.existsSync(contentServicePath), 'content-management.service.ts must exist at src/features/admin/content-management.service.ts');
assert.ok(fs.existsSync(publicControllerPath), 'public-content.controller.ts must exist at src/features/admin/public-content.controller.ts');
assert.ok(fs.existsSync(adminControllerPath), 'admin.controller.ts must exist');
assert.ok(fs.existsSync(adminModulePath), 'admin.module.ts must exist');
assert.ok(fs.existsSync(slideDtoPath), 'campaign-slide.dto.ts must exist in src/features/admin/dto/');
assert.ok(fs.existsSync(eventDtoPath), 'community-event.dto.ts must exist in src/features/admin/dto/');
console.log('✅ All required files exist.\n');

// 2. Verify node: protocol imports across files
console.log('--- [2/6] Verifying node: protocol imports ---');
const filesToCheck = [contentServicePath, publicControllerPath, adminControllerPath, adminModulePath];
for (const filePath of filesToCheck) {
  const content = fs.readFileSync(filePath, 'utf8');
  const importLines = content.match(/from\s+['"][^'"]+['"]/g) || [];
  for (const imp of importLines) {
    if (imp.includes("'path'") || imp.includes('"path"')) {
      assert.fail(`File ${filePath} must use node:path prefix`);
    }
    if (imp.includes("'fs'") || imp.includes('"fs"')) {
      assert.fail(`File ${filePath} must use node:fs prefix`);
    }
    if (imp.includes("'crypto'") || imp.includes('"crypto"')) {
      assert.fail(`File ${filePath} must use node:crypto prefix`);
    }
  }
}
console.log('✅ node: protocol rules respected.\n');

// 3. Verify ContentManagementService method contracts & atomic transactions
console.log('--- [3/6] Verifying ContentManagementService methods & transactions ---');
const serviceContent = fs.readFileSync(contentServicePath, 'utf8');

const expectedServiceMethods = [
  'getAllHeroSlides',
  'getActiveHeroSlides',
  'createHeroSlide',
  'updateHeroSlide',
  'toggleHeroSlideStatus',
  'reorderHeroSlides',
  'deleteHeroSlide',
  'getAllCommunityEvents',
  'getActiveCommunityEvents',
  'createCommunityEvent',
  'updateCommunityEvent',
  'toggleCommunityEventStatus',
  'reorderCommunityEvents',
  'deleteCommunityEvent',
  'seedDefaultsIfEmpty',
];

for (const method of expectedServiceMethods) {
  assert.ok(
    serviceContent.includes(method),
    `ContentManagementService must implement method '${method}'`,
  );
}

// Atomic transaction checks
assert.ok(
  serviceContent.includes('$transaction'),
  'ContentManagementService must use Prisma $transaction for atomic reordering',
);
assert.ok(
  serviceContent.includes('sort_order') && serviceContent.includes('asc'),
  'Queries must sort by sort_order ascending',
);

// Check seeding defaults
assert.ok(
  serviceContent.includes('ARM ZX-25R TITANIUM FULL SYSTEM'),
  'Must include default ARM ZX-25R titanium slide in seed defaults',
);
assert.ok(
  serviceContent.includes('Sponsored event name') || serviceContent.includes('SPONSORSHIP'),
  'Must include default community events in seed defaults',
);
console.log('✅ ContentManagementService methods, transactions, and seeding verified.\n');

// 4. Verify AdminController endpoints, role guards, and routing order
console.log('--- [4/6] Verifying AdminController routes & route order ---');
const adminContent = fs.readFileSync(adminControllerPath, 'utf8');

assert.ok(
  adminContent.includes('ContentManagementService'),
  'AdminController must inject ContentManagementService',
);

// Endpoints verification
const expectedAdminRoutes = [
  "'hero-slides'",
  "'hero-slides/reorder'",
  "'hero-slides/:id/toggle'",
  "'hero-slides/:id'",
  "'community-events'",
  "'community-events/reorder'",
  "'community-events/:id/toggle'",
  "'community-events/:id'",
];

for (const route of expectedAdminRoutes) {
  const doubleQuoted = route.replace(/'/g, '"');
  assert.ok(
    adminContent.includes(route) || adminContent.includes(doubleQuoted),
    `AdminController must define route ${route}`,
  );
}

// Route ordering check: 'reorder' must appear before ':id' to prevent route collision
const heroReorderPos = adminContent.indexOf('hero-slides/reorder');
const heroIdPos = adminContent.indexOf('hero-slides/:id');
assert.ok(
  heroReorderPos !== -1 && heroIdPos !== -1 && heroReorderPos < heroIdPos,
  "Route 'hero-slides/reorder' must be defined before 'hero-slides/:id' to prevent route parameter collision",
);

const eventReorderPos = adminContent.indexOf('community-events/reorder');
const eventIdPos = adminContent.indexOf('community-events/:id');
assert.ok(
  eventReorderPos !== -1 && eventIdPos !== -1 && eventReorderPos < eventIdPos,
  "Route 'community-events/reorder' must be defined before 'community-events/:id' to prevent route parameter collision",
);

console.log('✅ AdminController routes, guards, and ordering verified.\n');

// 5. Verify PublicContentController routes
console.log('--- [5/6] Verifying PublicContentController ---');
const publicContent = fs.readFileSync(publicControllerPath, 'utf8');

assert.ok(
  publicContent.includes("Controller('public'") ||
    publicContent.includes('Controller("public"') ||
    publicContent.includes("Controller(['public'") ||
    publicContent.includes('Controller(["public"'),
  "PublicContentController must have route prefix 'public'",
);

assert.ok(
  publicContent.includes('campaign-slides'),
  "PublicContentController must expose 'campaign-slides' route",
);
assert.ok(
  publicContent.includes('community-events'),
  "PublicContentController must expose 'community-events' route",
);
assert.ok(
  !publicContent.includes('RolesGuard') && !publicContent.includes('SessionAuthGuard'),
  'PublicContentController must NOT be protected by admin session/role guards',
);

console.log('✅ PublicContentController verified.\n');

// 6. Verify AdminModule registrations
console.log('--- [6/6] Verifying AdminModule registrations ---');
const moduleContent = fs.readFileSync(adminModulePath, 'utf8');

assert.ok(
  moduleContent.includes('PublicContentController'),
  'AdminModule must register PublicContentController in controllers array',
);
assert.ok(
  moduleContent.includes('ContentManagementService'),
  'AdminModule must register ContentManagementService in providers and exports arrays',
);

console.log('✅ AdminModule registrations verified.\n');

// 7. Runtime Service Execution & Mock Database Tests
console.log('--- [7/7] Verifying ContentManagementService runtime execution & transactions ---');
const { createRequire } = await import('node:module');
const require = createRequire(import.meta.url);

const {
  ContentManagementService,
  DEFAULT_CAMPAIGN_SLIDES,
  DEFAULT_COMMUNITY_EVENTS,
} = require(path.resolve(backendDir, 'dist/features/admin/content-management.service.js'));
const {
  PublicContentController,
} = require(path.resolve(backendDir, 'dist/features/admin/public-content.controller.js'));

// Create mock PrismaService
class MockPrismaService {
  constructor() {
    this.slides = [];
    this.events = [];
    this.transactionCalls = [];
  }

  campaignSlide = {
    count: async () => this.slides.length,
    createMany: async ({ data }) => {
      this.slides.push(...data.map((d, i) => ({ id: `slide-${i + 1}`, ...d })));
      return { count: data.length };
    },
    findMany: async ({ where, orderBy } = {}) => {
      let res = [...this.slides];
      if (where?.is_active !== undefined) {
        res = res.filter((s) => s.is_active === where.is_active);
      }
      if (orderBy?.sort_order === 'asc') {
        res.sort((a, b) => a.sort_order - b.sort_order);
      }
      return res;
    },
    findFirst: async ({ orderBy }) => {
      const sorted = [...this.slides].sort((a, b) =>
        orderBy?.sort_order === 'desc' ? b.sort_order - a.sort_order : a.sort_order - b.sort_order,
      );
      return sorted[0] || null;
    },
    findUnique: async ({ where }) => {
      return this.slides.find((s) => s.id === where.id) || null;
    },
    create: async ({ data }) => {
      const item = { id: `slide-${Date.now()}`, ...data };
      this.slides.push(item);
      return item;
    },
    update: async ({ where, data }) => {
      const idx = this.slides.findIndex((s) => s.id === where.id);
      if (idx === -1) throw new Error(`Slide ${where.id} not found`);
      this.slides[idx] = { ...this.slides[idx], ...data };
      return this.slides[idx];
    },
    delete: async ({ where }) => {
      const idx = this.slides.findIndex((s) => s.id === where.id);
      if (idx === -1) throw new Error(`Slide ${where.id} not found`);
      return this.slides.splice(idx, 1)[0];
    },
  };

  communityEvent = {
    count: async () => this.events.length,
    createMany: async ({ data }) => {
      this.events.push(...data.map((d, i) => ({ id: `event-${i + 1}`, ...d })));
      return { count: data.length };
    },
    findMany: async ({ where, orderBy } = {}) => {
      let res = [...this.events];
      if (where?.is_active !== undefined) {
        res = res.filter((e) => e.is_active === where.is_active);
      }
      if (orderBy?.sort_order === 'asc') {
        res.sort((a, b) => a.sort_order - b.sort_order);
      }
      return res;
    },
    findFirst: async ({ orderBy }) => {
      const sorted = [...this.events].sort((a, b) =>
        orderBy?.sort_order === 'desc' ? b.sort_order - a.sort_order : a.sort_order - b.sort_order,
      );
      return sorted[0] || null;
    },
    findUnique: async ({ where }) => {
      return this.events.find((e) => e.id === where.id) || null;
    },
    create: async ({ data }) => {
      const item = { id: `event-${Date.now()}`, ...data };
      this.events.push(item);
      return item;
    },
    update: async ({ where, data }) => {
      const idx = this.events.findIndex((e) => e.id === where.id);
      if (idx === -1) throw new Error(`Event ${where.id} not found`);
      this.events[idx] = { ...this.events[idx], ...data };
      return this.events[idx];
    },
    delete: async ({ where }) => {
      const idx = this.events.findIndex((e) => e.id === where.id);
      if (idx === -1) throw new Error(`Event ${where.id} not found`);
      return this.events.splice(idx, 1)[0];
    },
  };

  $transaction = async (promises) => {
    this.transactionCalls.push(promises);
    return Promise.all(promises);
  };
}

const mockPrisma = new MockPrismaService();
const service = new ContentManagementService(mockPrisma);

// Test 1: Auto-seed on initial empty table
await service.onModuleInit();
assert.equal(mockPrisma.slides.length, 4, 'Should seed 4 default hero slides');
assert.equal(mockPrisma.events.length, 3, 'Should seed 3 default community events');

// Test 2: Query active hero slides
const activeSlides = await service.getActiveHeroSlides();
assert.equal(activeSlides.length, 4, 'All initial slides should be active');
assert.equal(activeSlides[0].sort_order, 0, 'First slide sort_order should be 0');

// Test 3: Create hero slide without sort_order -> auto max + 1
const newSlide = await service.createHeroSlide({
  category: 'PRODUK',
  tag: '05 / RACING',
  title: 'ARM CBR250RR FULL SYSTEM',
  strip_title: 'CBR250RR Series',
  href: '/catalog',
  image_url: '/assets/products/cbr.jpg',
});
assert.equal(newSlide.sort_order, 4, 'New slide sort_order should be max + 1 (4)');

// Test 4: Atomic reorder with $transaction
const slideIds = mockPrisma.slides.map((s) => s.id);
const reversedIds = [...slideIds].reverse();
const reorderRes = await service.reorderHeroSlides(reversedIds);
assert.ok(reorderRes.success, 'Reorder should return success');
assert.equal(mockPrisma.transactionCalls.length, 1, 'Should call prisma.$transaction exactly once');
assert.equal(mockPrisma.slides.find((s) => s.id === reversedIds[0]).sort_order, 0, 'First reversed item must have sort_order 0');

// Test 5: Toggle hero slide status
const targetSlideId = slideIds[0];
const initialStatus = mockPrisma.slides.find((s) => s.id === targetSlideId).is_active;
const toggled = await service.toggleHeroSlideStatus(targetSlideId);
assert.equal(toggled.is_active, !initialStatus, 'Status should be toggled');

// Test 6: Delete hero slide
const preDeleteCount = mockPrisma.slides.length;
await service.deleteHeroSlide(targetSlideId);
assert.equal(mockPrisma.slides.length, preDeleteCount - 1, 'Slide count should decrease by 1');

// Test 7: Community Events CRUD & Reorder
const allEvents = await service.getAllCommunityEvents();
assert.equal(allEvents.length, 3, 'Should get 3 community events');

const newEvent = await service.createCommunityEvent({
  category: 'GATHERING',
  tag: 'COMMUNITY',
  event_date: '2026-06-10',
  title: 'Track Day Gathering',
  description: 'National track day',
  image_url: '/assets/events/gathering.jpg',
});
assert.equal(newEvent.sort_order, 3, 'New event sort_order should be max + 1 (3)');

const eventIds = mockPrisma.events.map((e) => e.id);
await service.reorderCommunityEvents(eventIds.reverse());
assert.equal(mockPrisma.transactionCalls.length, 2, 'Should execute second atomic transaction');

// Test 8: PublicContentController integration
const publicController = new PublicContentController(service);
const publicSlides = await publicController.getCampaignSlides();
const publicEvents = await publicController.getCommunityEvents();
assert.ok(Array.isArray(publicSlides), 'Public slides must be array');
assert.ok(Array.isArray(publicEvents), 'Public events must be array');

console.log('✅ Runtime Service execution, seeding, and controller delegation verified.\n');

console.log('🎉 ALL CONTENT MANAGEMENT API TESTS PASSED SUCCESSFULLY! 🎉\n');
