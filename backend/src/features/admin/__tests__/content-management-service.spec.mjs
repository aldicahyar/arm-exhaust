import assert from 'node:assert/strict';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const serviceModulePath = path.resolve(__dirname, '../../../../dist/features/admin/content-management.service.js');

const {
  ContentManagementService,
  DEFAULT_HOME_VALUE_PROPS,
  DEFAULT_HOME_NEW_ARRIVALS,
  DEFAULT_HOME_SECTION_2_HEADER,
  DEFAULT_HOME_SECTION_3_HEADER,
} = await import(`file://${serviceModulePath}`);

console.log('[TEST] Starting ContentManagementService Unit Tests for Section 2 & 3...');

// 1. Setup Mock Prisma Service
const createMockPrisma = () => {
  const store = {
    campaignSlide: [],
    communityEvent: [],
    homeValueProp: [],
    homeNewArrival: [],
    appConfig: new Map(),
  };

  return {
    campaignSlide: {
      count: async () => store.campaignSlide.length,
      createMany: async ({ data }) => { store.campaignSlide.push(...data); return { count: data.length }; },
      findMany: async () => store.campaignSlide,
      findUnique: async ({ where }) => store.campaignSlide.find((s) => s.id === where.id),
      findFirst: async () => store.campaignSlide[store.campaignSlide.length - 1],
      create: async ({ data }) => {
        store.lastCampaignSlideCreateData = data;
        const item = { id: `cs-${Date.now()}`, ...data };
        store.campaignSlide.push(item);
        return item;
      },
      update: async ({ where, data }) => {
        store.lastCampaignSlideUpdateData = data;
        const idx = store.campaignSlide.findIndex((s) => s.id === where.id);
        if (idx === -1) throw new Error('Not found');
        store.campaignSlide[idx] = { ...store.campaignSlide[idx], ...data };
        return store.campaignSlide[idx];
      },
    },
    communityEvent: {
      count: async () => store.communityEvent.length,
      createMany: async ({ data }) => { store.communityEvent.push(...data); return { count: data.length }; },
      findMany: async () => store.communityEvent,
      findUnique: async ({ where }) => store.communityEvent.find((e) => e.id === where.id),
      findFirst: async () => store.communityEvent[store.communityEvent.length - 1],
    },
    homeValueProp: {
      count: async () => store.homeValueProp.length,
      createMany: async ({ data }) => { store.homeValueProp.push(...data); return { count: data.length }; },
      findMany: async ({ where, take } = {}) => {
        let items = [...store.homeValueProp];
        if (where?.is_active) items = items.filter((i) => i.is_active);
        if (typeof take === 'number') items = items.slice(0, take);
        return items;
      },
      findUnique: async ({ where }) => store.homeValueProp.find((p) => p.id === where.id),
      findFirst: async () => store.homeValueProp[store.homeValueProp.length - 1],
      create: async ({ data }) => {
        const item = { id: `vp-${Date.now()}`, ...data };
        store.homeValueProp.push(item);
        return item;
      },
      update: async ({ where, data }) => {
        const idx = store.homeValueProp.findIndex((p) => p.id === where.id);
        if (idx === -1) throw new Error('Not found');
        store.homeValueProp[idx] = { ...store.homeValueProp[idx], ...data };
        return store.homeValueProp[idx];
      },
      delete: async ({ where }) => {
        const idx = store.homeValueProp.findIndex((p) => p.id === where.id);
        if (idx === -1) throw new Error('Not found');
        const [removed] = store.homeValueProp.splice(idx, 1);
        return removed;
      },
    },
    homeNewArrival: {
      count: async ({ where } = {}) => {
        if (where?.is_active) return store.homeNewArrival.filter((n) => n.is_active).length;
        return store.homeNewArrival.length;
      },
      createMany: async ({ data }) => { store.homeNewArrival.push(...data); return { count: data.length }; },
      findMany: async ({ where, take } = {}) => {
        let items = [...store.homeNewArrival];
        if (where?.is_active) items = items.filter((i) => i.is_active);
        if (typeof take === 'number') items = items.slice(0, take);
        return items;
      },
      findUnique: async ({ where }) => store.homeNewArrival.find((n) => n.id === where.id),
      findFirst: async () => store.homeNewArrival[store.homeNewArrival.length - 1],
      create: async ({ data }) => {
        const item = { id: `na-${Date.now()}`, ...data };
        store.homeNewArrival.push(item);
        return item;
      },
      update: async ({ where, data }) => {
        const idx = store.homeNewArrival.findIndex((n) => n.id === where.id);
        if (idx === -1) throw new Error('Not found');
        store.homeNewArrival[idx] = { ...store.homeNewArrival[idx], ...data };
        return store.homeNewArrival[idx];
      },
      delete: async ({ where }) => {
        const idx = store.homeNewArrival.findIndex((n) => n.id === where.id);
        if (idx === -1) throw new Error('Not found');
        const [removed] = store.homeNewArrival.splice(idx, 1);
        return removed;
      },
    },
    appConfig: {
      findUnique: async ({ where }) => {
        const val = store.appConfig.get(where.key);
        return val ? { key: where.key, value: val } : null;
      },
      upsert: async ({ where, update, create }) => {
        const existing = store.appConfig.get(where.key);
        const val = existing ? update.value : create.value;
        store.appConfig.set(where.key, val);
        return { key: where.key, value: val };
      },
    },
    $transaction: async (promises) => {
      return Promise.all(promises);
    },
    _store: store,
  };
};

// Test 1: Auto-seeding
{
  const mockPrisma = createMockPrisma();
  const service = new ContentManagementService(mockPrisma);

  await service.onModuleInit();
  assert.equal(mockPrisma._store.homeValueProp.length, 4, 'Should seed 4 default value props');
  assert.equal(mockPrisma._store.homeNewArrival.length, 4, 'Should seed 4 default new arrivals');
  console.log('✅ Test 1 Passed: Auto-seed defaults');
}

// Test 2: Value Props CRUD & Reorder Auto-Sync step_number
{
  const mockPrisma = createMockPrisma();
  const service = new ContentManagementService(mockPrisma);

  mockPrisma._store.homeValueProp = [
    { id: 'vp-1', step_number: '01', title: 'Prop 1', description: 'Desc 1', sort_order: 0, is_active: true },
    { id: 'vp-2', step_number: '02', title: 'Prop 2', description: 'Desc 2', sort_order: 1, is_active: true },
    { id: 'vp-3', step_number: '03', title: 'Prop 3', description: 'Desc 3', sort_order: 2, is_active: true },
  ];

  // Reorder: Move vp-3 to first position ['vp-3', 'vp-1', 'vp-2']
  const reorderResult = await service.reorderValueProps(['vp-3', 'vp-1', 'vp-2']);
  assert.equal(reorderResult.success, true);
  assert.equal(reorderResult.count, 3);

  const vp3 = mockPrisma._store.homeValueProp.find((p) => p.id === 'vp-3');
  const vp1 = mockPrisma._store.homeValueProp.find((p) => p.id === 'vp-1');
  const vp2 = mockPrisma._store.homeValueProp.find((p) => p.id === 'vp-2');

  assert.equal(vp3.sort_order, 0);
  assert.equal(vp3.step_number, '01', 'vp-3 step_number must sync to 01');

  assert.equal(vp1.sort_order, 1);
  assert.equal(vp1.step_number, '02', 'vp-1 step_number must sync to 02');

  assert.equal(vp2.sort_order, 2);
  assert.equal(vp2.step_number, '03', 'vp-2 step_number must sync to 03');
  console.log('✅ Test 2 Passed: Value prop reordering auto-syncs step_number to 01, 02, ...');
}

// Test 3: New Arrivals Active Cap Guard (Max 4 Active)
{
  const mockPrisma = createMockPrisma();
  const service = new ContentManagementService(mockPrisma);

  mockPrisma._store.homeNewArrival = [
    { id: 'na-1', product_id: 'p1', name: 'N1', category_label: 'C1', price_display: 'Rp 100', image_url: '/img.jpg', href: '/p1', sort_order: 0, is_active: true },
    { id: 'na-2', product_id: 'p2', name: 'N2', category_label: 'C2', price_display: 'Rp 100', image_url: '/img.jpg', href: '/p2', sort_order: 1, is_active: true },
    { id: 'na-3', product_id: 'p3', name: 'N3', category_label: 'C3', price_display: 'Rp 100', image_url: '/img.jpg', href: '/p3', sort_order: 2, is_active: true },
    { id: 'na-4', product_id: 'p4', name: 'N4', category_label: 'C4', price_display: 'Rp 100', image_url: '/img.jpg', href: '/p4', sort_order: 3, is_active: true },
    { id: 'na-5', product_id: 'p5', name: 'N5', category_label: 'C5', price_display: 'Rp 100', image_url: '/img.jpg', href: '/p5', sort_order: 4, is_active: false },
  ];

  // Try activating 5th item via toggle -> should throw BadRequestException
  await assert.rejects(
    async () => {
      await service.toggleNewArrivalStatus('na-5');
    },
    {
      name: 'BadRequestException',
      message: 'Maksimal 4 produk beranda yang dapat aktif bersamaan. Nonaktifkan salah satu produk terlebih dahulu.',
    },
    'Should reject activating 5th item via toggle',
  );

  // Try creating a new active item when 4 are already active -> should throw BadRequestException
  await assert.rejects(
    async () => {
      await service.createNewArrival({
        product_id: 'p6',
        name: 'N6',
        category_label: 'C6',
        price_display: 'Rp 100',
        image_url: '/img.jpg',
        href: '/p6',
        is_active: true,
      });
    },
    {
      name: 'BadRequestException',
      message: 'Maksimal 4 produk beranda yang dapat aktif bersamaan. Nonaktifkan salah satu produk terlebih dahulu.',
    },
    'Should reject creating 5th active item',
  );

  console.log('✅ Test 3 Passed: New arrivals active cap guard enforces max 4 active');
}

// Test 4: Section Headers in AppConfig
{
  const mockPrisma = createMockPrisma();
  const service = new ContentManagementService(mockPrisma);

  // Initial read when empty should return defaults
  const initialHeaders = await service.getHomeHeaders();
  assert.equal(initialHeaders.section2.tag, DEFAULT_HOME_SECTION_2_HEADER.tag);
  assert.equal(initialHeaders.section3.title, DEFAULT_HOME_SECTION_3_HEADER.title);

  // Update headers
  await service.updateHomeHeaders({
    section2: { tag: 'Mengapa ARM', title: 'Presisi & Kuat' },
    section3: { tag: 'Produk Baru', title: 'Terbaru dari Bengkel', linkLabel: 'Semua Produk ↗', linkHref: '/catalog' },
  });

  const updatedHeaders = await service.getHomeHeaders();
  assert.equal(updatedHeaders.section2.tag, 'Mengapa ARM');
  assert.equal(updatedHeaders.section2.title, 'Presisi & Kuat');
  assert.equal(updatedHeaders.section3.tag, 'Produk Baru');
  assert.equal(updatedHeaders.section3.title, 'Terbaru dari Bengkel');
  console.log('✅ Test 4 Passed: Home headers get and update via AppConfig');
}

// Test 5: Hero slide optional mobile image (image_mobile_url)
{
  const mockPrisma = createMockPrisma();
  const service = new ContentManagementService(mockPrisma);

  mockPrisma._store.campaignSlide = [
    {
      id: 'cs-1', category: 'C', tag: 'T', title: 'Slide 1', strip_title: 'S1', href: '/a',
      image_url: '/desktop.jpg', image_mobile_url: '/mobile.jpg', sort_order: 0, is_active: true,
    },
  ];

  // Whitespace-only value clears the mobile image (stored as null)
  await service.updateHeroSlide('cs-1', { image_mobile_url: '  ' });
  assert.ok(
    Object.hasOwn(mockPrisma._store.lastCampaignSlideUpdateData, 'image_mobile_url'),
    'Update data must include image_mobile_url when provided',
  );
  assert.equal(mockPrisma._store.lastCampaignSlideUpdateData.image_mobile_url, null);

  // Explicit null also clears
  await service.updateHeroSlide('cs-1', { image_mobile_url: null });
  assert.equal(mockPrisma._store.lastCampaignSlideUpdateData.image_mobile_url, null);

  // Non-empty value is trimmed
  await service.updateHeroSlide('cs-1', { image_mobile_url: '  /new-mobile.jpg ' });
  assert.equal(mockPrisma._store.lastCampaignSlideUpdateData.image_mobile_url, '/new-mobile.jpg');

  // Omitted field is left untouched (key absent from update data)
  await service.updateHeroSlide('cs-1', { title: 'X' });
  assert.equal(
    Object.hasOwn(mockPrisma._store.lastCampaignSlideUpdateData, 'image_mobile_url'),
    false,
    'Update data must not include image_mobile_url when omitted',
  );
  assert.equal(mockPrisma._store.campaignSlide[0].image_mobile_url, '/new-mobile.jpg');

  // Create without the field stores null
  await service.createHeroSlide({
    category: 'C', tag: 'T', title: 'Slide 2', strip_title: 'S2', href: '/b', image_url: '/d2.jpg',
  });
  assert.equal(mockPrisma._store.lastCampaignSlideCreateData.image_mobile_url, null);

  console.log('✅ Test 5 Passed: Hero slide image_mobile_url normalization (null/trim/untouched)');
}

console.log('🎉 All ContentManagementService unit tests passed successfully!');
