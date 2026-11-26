import assert from 'node:assert';

const { backdropTiles, specLine, preferCatalogImage, tileImageClass } = await import(new URL('../showcase-math.ts', import.meta.url).href);

console.log('Testing showcase-math...');

// backdropTiles(images, n): fill the blurred backdrop grid by cycling the photos
assert.deepStrictEqual(backdropTiles(['a', 'b'], 6), ['a', 'b', 'a', 'b', 'a', 'b'], 'cycles to fill the grid');
assert.deepStrictEqual(backdropTiles(['a', '', 'b', 'a'], 3), ['a', 'b', 'a'], 'skips empty, keeps order');
assert.deepStrictEqual(backdropTiles(['a', 'b', 'c', 'd', 'e', 'f', 'g'], 6), ['a', 'b', 'c', 'd', 'e', 'f'], 'trims to n');
assert.deepStrictEqual(backdropTiles([], 6), [], 'no photos => no tiles');

// specLine(inlet, material): one quiet spec line under the product name, skipping empty parts
assert.strictEqual(specLine('38MM', 'Stainless 304'), 'Inlet 38MM · Stainless 304');
assert.strictEqual(specLine('', 'Stainless 304'), 'Stainless 304', 'no inlet => no dangling separator');
assert.strictEqual(specLine('38MM', '  '), 'Inlet 38MM');
assert.strictEqual(specLine('', ''), '');

// preferCatalogImage(adminImage, catalogImage): legacy placeholders from admin data give way to the catalog photo
const CAT = '/assets/products/catalog-photo.jpg';
assert.strictEqual(preferCatalogImage('/assets/products/kdv2-vario125-grid.jpg', CAT), CAT, 'legacy flyer canvas => catalog photo');
assert.strictEqual(preferCatalogImage('/assets/products/sample-hero.jpg', CAT), CAT, 'sample placeholder => catalog photo');
assert.strictEqual(preferCatalogImage('/uploads/real-photo.jpg', CAT), '/uploads/real-photo.jpg', 'a real admin photo always wins');
assert.strictEqual(preferCatalogImage('/assets/products/sample-hero.jpg', undefined), '/assets/products/sample-hero.jpg', 'no catalog match => keep admin image');
assert.strictEqual(preferCatalogImage(undefined, CAT), CAT, 'no admin image => catalog photo');

// tileImageClass(src): square card tile — flyer canvases cropped to the flyer, cleaned full-bleed photo shown whole
assert.ok(tileImageClass('/assets/products/kdv2-vario125-grid.jpg').includes('scale-[1.25]'), 'flyer canvas => cropped to the 480px flyer');
assert.ok(tileImageClass('/assets/products/kdv2-vario125-grid.jpg').includes('group-hover:scale-[1.29]'), 'hover zoom stays above the crop');
assert.ok(tileImageClass('/assets/products/fs-nmax-turbo-grid.jpg').startsWith('object-contain'), 'cleaned full-bleed photo => whole product');
assert.ok(!tileImageClass('/assets/products/fs-nmax-turbo-grid.jpg').includes('scale-[1.25]'));
assert.ok(tileImageClass('/assets/products/sample-hero.jpg').startsWith('object-cover'), 'any other image => plain cover');
assert.ok(tileImageClass('/assets/products/sample-hero.jpg').includes('group-hover:scale-[1.03]'));

console.log('PASS: showcase-math');
