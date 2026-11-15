import assert from 'node:assert/strict';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const publicCtrlPath = path.resolve(__dirname, '../../../../dist/features/admin/public-content.controller.js');
const adminCtrlPath = path.resolve(__dirname, '../../../../dist/features/admin/admin.controller.js');

const { PublicContentController } = await import(`file://${publicCtrlPath}`);
const { AdminController } = await import(`file://${adminCtrlPath}`);

console.log('[TEST] Starting Controller Unit Tests for Section 2 & 3...');

// Mock ContentManagementService
const mockContentService = {
  activeValueProps: [
    {
      id: 'vp-1',
      step_number: '01',
      title: 'CUSTOM PER BIKE',
      description: 'Presisi header & silencer.',
      sort_order: 0,
      is_active: true,
    },
  ],
  activeNewArrivals: [
    {
      id: 'na-1',
      product_id: 'kdv2-vario125',
      badge_text: 'NEW ARRIVAL',
      name: 'Kondoman V2',
      category_label: 'Kondoman',
      inlet: '38MM',
      material: 'Stainless 304',
      price_display: 'Rp 1.850.000',
      image_url: '/assets/products/kdv2.jpg',
      href: '/products/kdv2-vario125',
      sort_order: 0,
      is_active: true,
    },
  ],
  homeHeaders: {
    section2: { tag: 'Why ARM Exhaust', title: 'Custom, precise, warranted.' },
    section3: { tag: 'New Arrival', title: 'Fresh out of the workshop.', linkLabel: 'All Products ↗', linkHref: '/catalog' },
  },

  calls: [],

  async getActiveValueProps() {
    this.calls.push('getActiveValueProps');
    return this.activeValueProps;
  },
  async getActiveNewArrivals() {
    this.calls.push('getActiveNewArrivals');
    return this.activeNewArrivals;
  },
  async getHomeHeaders() {
    this.calls.push('getHomeHeaders');
    return this.homeHeaders;
  },
  async getAllValueProps() {
    this.calls.push('getAllValueProps');
    return this.activeValueProps;
  },
  async createValueProp(dto) {
    this.calls.push(['createValueProp', dto]);
    return { id: 'vp-new', ...dto };
  },
  async updateValueProp(id, dto) {
    this.calls.push(['updateValueProp', id, dto]);
    return { id, ...dto };
  },
  async toggleValuePropStatus(id) {
    this.calls.push(['toggleValuePropStatus', id]);
    return { id, is_active: false };
  },
  async reorderValueProps(ids) {
    this.calls.push(['reorderValueProps', ids]);
    return { success: true, count: ids.length };
  },
  async deleteValueProp(id) {
    this.calls.push(['deleteValueProp', id]);
    return { id };
  },
  async getAllNewArrivals() {
    this.calls.push('getAllNewArrivals');
    return this.activeNewArrivals;
  },
  async createNewArrival(dto) {
    this.calls.push(['createNewArrival', dto]);
    return { id: 'na-new', ...dto };
  },
  async updateNewArrival(id, dto) {
    this.calls.push(['updateNewArrival', id, dto]);
    return { id, ...dto };
  },
  async toggleNewArrivalStatus(id) {
    this.calls.push(['toggleNewArrivalStatus', id]);
    return { id, is_active: false };
  },
  async reorderNewArrivals(ids) {
    this.calls.push(['reorderNewArrivals', ids]);
    return { success: true, count: ids.length };
  },
  async deleteNewArrival(id) {
    this.calls.push(['deleteNewArrival', id]);
    return { id };
  },
  async updateHomeHeaders(dto) {
    this.calls.push(['updateHomeHeaders', dto]);
    return { success: true };
  },
};

// 1. Test PublicContentController.getHomeContent()
{
  const publicCtrl = new PublicContentController(mockContentService);
  mockContentService.calls = [];

  const res = await publicCtrl.getHomeContent();

  assert.deepEqual(res.section2.header, mockContentService.homeHeaders.section2);
  assert.equal(res.section2.items.length, 1);
  assert.equal(res.section2.items[0].stepNumber, '01');
  assert.equal(res.section2.items[0].step_number, '01');
  assert.equal(res.section2.items[0].sortOrder, 0);
  assert.equal(res.section2.items[0].sort_order, 0);
  assert.equal(res.section2.items[0].isActive, true);
  assert.equal(res.section2.items[0].is_active, true);

  assert.deepEqual(res.section3.header, mockContentService.homeHeaders.section3);
  assert.equal(res.section3.items.length, 1);
  assert.equal(res.section3.items[0].productId, 'kdv2-vario125');
  assert.equal(res.section3.items[0].product_id, 'kdv2-vario125');
  assert.equal(res.section3.items[0].badgeText, 'NEW ARRIVAL');
  assert.equal(res.section3.items[0].badge_text, 'NEW ARRIVAL');
  assert.equal(res.section3.items[0].categoryLabel, 'Kondoman');
  assert.equal(res.section3.items[0].category_label, 'Kondoman');
  assert.equal(res.section3.items[0].priceDisplay, 'Rp 1.850.000');
  assert.equal(res.section3.items[0].price_display, 'Rp 1.850.000');
  assert.equal(res.section3.items[0].imageUrl, '/assets/products/kdv2.jpg');
  assert.equal(res.section3.items[0].image_url, '/assets/products/kdv2.jpg');
  assert.equal(res.section3.items[0].sortOrder, 0);
  assert.equal(res.section3.items[0].sort_order, 0);
  assert.equal(res.section3.items[0].isActive, true);
  assert.equal(res.section3.items[0].is_active, true);

  assert(mockContentService.calls.includes('getActiveValueProps'), 'Must call getActiveValueProps');
  assert(mockContentService.calls.includes('getActiveNewArrivals'), 'Must call getActiveNewArrivals');
  assert(mockContentService.calls.includes('getHomeHeaders'), 'Must call getHomeHeaders');

  console.log('✅ Test 1 Passed: PublicContentController.getHomeContent() combined response');
}

// 2. Test AdminController value props endpoints
{
  const adminCtrl = new AdminController(null, null, null, mockContentService);

  // Get
  mockContentService.calls = [];
  const list = await adminCtrl.getValueProps();
  assert.equal(list.length, 1);
  assert(mockContentService.calls.includes('getAllValueProps'));

  // Create
  const createDto = { title: 'Test Pillar', description: 'Test desc' };
  const created = await adminCtrl.createValueProp(createDto);
  assert.equal(created.title, 'Test Pillar');

  // Reorder with object { orderedIds: [...] }
  const reorderRes1 = await adminCtrl.reorderValueProps({ orderedIds: ['vp-1', 'vp-2'] });
  assert.equal(reorderRes1.success, true);
  assert.deepEqual(mockContentService.calls[mockContentService.calls.length - 1], ['reorderValueProps', ['vp-1', 'vp-2']]);

  // Reorder with direct array ['...']
  const reorderRes2 = await adminCtrl.reorderValueProps(['vp-2', 'vp-1']);
  assert.equal(reorderRes2.success, true);
  assert.deepEqual(mockContentService.calls[mockContentService.calls.length - 1], ['reorderValueProps', ['vp-2', 'vp-1']]);

  // Update
  const updated = await adminCtrl.updateValueProp('vp-1', { title: 'Updated' });
  assert.equal(updated.title, 'Updated');

  // Toggle
  const toggled = await adminCtrl.toggleValuePropStatus('vp-1');
  assert.equal(toggled.is_active, false);

  // Delete
  const deleted = await adminCtrl.deleteValueProp('vp-1');
  assert.equal(deleted.id, 'vp-1');

  console.log('✅ Test 2 Passed: AdminController Value Props endpoints');
}

// 3. Test AdminController new arrivals endpoints
{
  const adminCtrl = new AdminController(null, null, null, mockContentService);

  // Get
  mockContentService.calls = [];
  const list = await adminCtrl.getNewArrivals();
  assert.equal(list.length, 1);
  assert(mockContentService.calls.includes('getAllNewArrivals'));

  // Create
  const createDto = { product_id: 'prod-1', name: 'Product 1', category_label: 'Cat', price_display: 'Rp 100', image_url: '/img.jpg', href: '/prod-1' };
  const created = await adminCtrl.createNewArrival(createDto);
  assert.equal(created.name, 'Product 1');

  // Reorder with object { orderedIds: [...] }
  const reorderRes1 = await adminCtrl.reorderNewArrivals({ orderedIds: ['na-1', 'na-2'] });
  assert.equal(reorderRes1.success, true);

  // Reorder with array
  const reorderRes2 = await adminCtrl.reorderNewArrivals(['na-2', 'na-1']);
  assert.equal(reorderRes2.success, true);

  // Update
  const updated = await adminCtrl.updateNewArrival('na-1', { name: 'Updated' });
  assert.equal(updated.name, 'Updated');

  // Toggle
  const toggled = await adminCtrl.toggleNewArrivalStatus('na-1');
  assert.equal(toggled.is_active, false);

  // Delete
  const deleted = await adminCtrl.deleteNewArrival('na-1');
  assert.equal(deleted.id, 'na-1');

  console.log('✅ Test 3 Passed: AdminController New Arrivals endpoints');
}

// 4. Test AdminController headers endpoints
{
  const adminCtrl = new AdminController(null, null, null, mockContentService);

  // Get
  const headers = await adminCtrl.getHomeHeaders();
  assert.deepEqual(headers, mockContentService.homeHeaders);

  // Update
  const updateRes = await adminCtrl.updateHomeHeaders({ section2: { title: 'New Title' } });
  assert.equal(updateRes.success, true);

  console.log('✅ Test 4 Passed: AdminController Headers endpoints');
}

console.log('🎉 All Controller unit tests passed successfully!');
