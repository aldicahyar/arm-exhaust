import assert from 'node:assert/strict';
import * as fs from 'node:fs';
import * as path from 'node:path';
import { fileURLToPath } from 'node:url';
import { createRequire } from 'node:module';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const backendDir = path.resolve(__dirname, '..');
const require = createRequire(import.meta.url);

const mediaControllerPath = path.resolve(backendDir, 'src/features/admin/media.controller.ts');
const mediaServicePath = path.resolve(backendDir, 'src/features/admin/media.service.ts');
const adminModulePath = path.resolve(backendDir, 'src/features/admin/admin.module.ts');
const mainTsPath = path.resolve(backendDir, 'src/main.ts');

console.log('=== [TDD Test] Backend Media Upload Service & Static Serving Verification ===\n');

// 1. Verify existence of required files
console.log('--- [1/6] Checking file existence ---');
assert.ok(fs.existsSync(mediaControllerPath), 'media.controller.ts must exist at src/features/admin/media.controller.ts');
assert.ok(fs.existsSync(mediaServicePath), 'media.service.ts must exist at src/features/admin/media.service.ts');
assert.ok(fs.existsSync(adminModulePath), 'admin.module.ts must exist at src/features/admin/admin.module.ts');
assert.ok(fs.existsSync(mainTsPath), 'main.ts must exist at src/main.ts');
console.log('✅ All required files exist.\n');

// 2. Verify media.controller.ts structure, guards, interceptors, and decorators
console.log('--- [2/6] Verifying media.controller.ts decorators & guards ---');
const controllerContent = fs.readFileSync(mediaControllerPath, 'utf8');

assert.ok(
  controllerContent.includes('SessionAuthGuard') && controllerContent.includes('RolesGuard'),
  'MediaController must use SessionAuthGuard and RolesGuard',
);
assert.ok(
  controllerContent.includes("Roles('admin', 'superadmin')") ||
    controllerContent.includes('Roles("admin", "superadmin")'),
  'MediaController must enforce @Roles("admin", "superadmin")',
);
assert.ok(
  controllerContent.includes("Controller('admin/media')") ||
    controllerContent.includes('Controller("admin/media")'),
  'MediaController must be mapped to admin/media controller route',
);
assert.ok(
  controllerContent.includes('FileInterceptor'),
  'MediaController must use FileInterceptor for handling file uploads',
);
assert.ok(
  controllerContent.includes("'file'") || controllerContent.includes('"file"'),
  'FileInterceptor must accept single file field named "file"',
);
assert.ok(
  controllerContent.includes('BadRequestException'),
  'MediaController must import and use BadRequestException for validation errors',
);

// Verify node: imports in controller
const controllerImports = controllerContent.match(/import .* from ['"]([^'"]+)['"]/g) || [];
for (const imp of controllerImports) {
  if (imp.includes("'path'") || imp.includes('"path"')) {
    assert.fail('Path import must use node:path prefix');
  }
  if (imp.includes("'fs'") || imp.includes('"fs"')) {
    assert.fail('Fs import must use node:fs prefix');
  }
}
console.log('✅ media.controller.ts guards, decorators, and imports verified.\n');

// 3. Verify media.service.ts & file validation rules (MIME types, 5MB limit, sanitized filename)
console.log('--- [3/6] Verifying MediaService logic & Multer options ---');
const serviceContent = fs.readFileSync(mediaServicePath, 'utf8');

assert.ok(
  serviceContent.includes('image/jpeg') &&
    serviceContent.includes('image/png') &&
    serviceContent.includes('image/webp'),
  'MediaService / Multer options must allow only image/jpeg, image/png, and image/webp',
);
assert.ok(
  serviceContent.includes('5 * 1024 * 1024') || serviceContent.includes('5242880'),
  'File size limit must be set to 5MB (5 * 1024 * 1024 bytes)',
);
assert.ok(
  serviceContent.includes('uploads') && serviceContent.includes('Date.now()'),
  'Must save to public/uploads with timestamp prefix',
);
assert.ok(
  serviceContent.includes('/uploads/'),
  'Returned url must point to /uploads/{filename}',
);

// Verify node: imports in service
const serviceImports = serviceContent.match(/import .* from ['"]([^'"]+)['"]/g) || [];
for (const imp of serviceImports) {
  if (imp.includes("'path'") || imp.includes('"path"')) {
    assert.fail('Path import must use node:path prefix');
  }
  if (imp.includes("'fs'") || imp.includes('"fs"')) {
    assert.fail('Fs import must use node:fs prefix');
  }
}
console.log('✅ MediaService validation & options verified.\n');

// 4. Verify admin.module.ts registration
console.log('--- [4/6] Verifying admin.module.ts registration ---');
const moduleContent = fs.readFileSync(adminModulePath, 'utf8');

assert.ok(
  moduleContent.includes('MediaController'),
  'admin.module.ts must import and register MediaController in controllers',
);
assert.ok(
  moduleContent.includes('MediaService'),
  'admin.module.ts must import and register MediaService in providers',
);
console.log('✅ admin.module.ts registration verified.\n');

// 5. Verify main.ts static serving configuration
console.log('--- [5/6] Verifying main.ts static asset serving ---');
const mainContent = fs.readFileSync(mainTsPath, 'utf8');

assert.ok(
  mainContent.includes('useStaticAssets'),
  'main.ts must call app.useStaticAssets for static files',
);
assert.ok(
  mainContent.includes('/uploads') || mainContent.includes('/uploads/'),
  'main.ts useStaticAssets must configure prefix /uploads/ or /uploads',
);
assert.ok(
  mainContent.includes('public') && mainContent.includes('uploads'),
  'main.ts useStaticAssets must serve public/uploads directory',
);

const mainImports = mainContent.match(/import .* from ['"]([^'"]+)['"]/g) || [];
for (const imp of mainImports) {
  if (imp.includes("'path'") || imp.includes('"path"')) {
    assert.fail('Path import must use node:path prefix in main.ts');
  }
  if (imp.includes("'fs'") || imp.includes('"fs"')) {
    assert.fail('Fs import must use node:fs prefix in main.ts');
  }
}
console.log('✅ main.ts static serving verified.\n');

// 6. Runtime tests on compiled dist (Reflect metadata & MediaService functional testing)
console.log('--- [6/6] Verifying compiled classes and runtime behavior ---');
const distControllerPath = path.resolve(backendDir, 'dist/features/admin/media.controller.js');
const distServicePath = path.resolve(backendDir, 'dist/features/admin/media.service.js');

if (fs.existsSync(distControllerPath) && fs.existsSync(distServicePath)) {
  require(path.resolve(backendDir, 'node_modules/reflect-metadata'));
  const { MediaController } = require(distControllerPath);
  const { MediaService, multerUploadOptions, ALLOWED_MIME_TYPES } = require(distServicePath);

  // Check Controller Metadata
  const routePath = Reflect.getMetadata('path', MediaController);
  assert.equal(routePath, 'admin/media', 'Controller route path must be admin/media');

  const guards = Reflect.getMetadata('__guards__', MediaController);
  assert.ok(Array.isArray(guards), 'Guards metadata must be an array');
  const guardNames = guards.map((g) => g.name);
  assert.ok(guardNames.includes('SessionAuthGuard'), 'SessionAuthGuard must be attached');
  assert.ok(guardNames.includes('RolesGuard'), 'RolesGuard must be attached');

  const roles = Reflect.getMetadata('roles', MediaController);
  assert.deepEqual(roles, ['admin', 'superadmin'], 'Roles metadata must be [admin, superadmin]');

  // Check Multer options
  assert.equal(multerUploadOptions.limits.fileSize, 5 * 1024 * 1024, 'Multer size limit must be 5MB');
  assert.deepEqual(
    Array.from(ALLOWED_MIME_TYPES),
    ['image/jpeg', 'image/png', 'image/webp'],
    'Allowed mime types must be JPEG, PNG, WebP',
  );

  // Test Multer fileFilter callback
  const testFilter = (mimetype) =>
    new Promise((resolve) => {
      multerUploadOptions.fileFilter({}, { mimetype }, (err, accept) => {
        resolve({ err, accept });
      });
    });

  const jpegRes = await testFilter('image/jpeg');
  assert.equal(jpegRes.accept, true, 'image/jpeg must be accepted');
  assert.equal(jpegRes.err, null, 'No error on image/jpeg');

  const pngRes = await testFilter('image/png');
  assert.equal(pngRes.accept, true, 'image/png must be accepted');
  assert.equal(pngRes.err, null, 'No error on image/png');

  const webpRes = await testFilter('image/webp');
  assert.equal(webpRes.accept, true, 'image/webp must be accepted');
  assert.equal(webpRes.err, null, 'No error on image/webp');

  const gifRes = await testFilter('image/gif');
  assert.equal(gifRes.accept, false, 'image/gif must be rejected');
  assert.ok(gifRes.err, 'Error must be provided on image/gif');

  const pdfRes = await testFilter('application/pdf');
  assert.equal(pdfRes.accept, false, 'application/pdf must be rejected');
  assert.ok(pdfRes.err, 'Error must be provided on application/pdf');

  // Test MediaService methods
  const mediaService = new MediaService();

  // Test filename sanitization
  const sanitized = mediaService.sanitizeFilename('Banner Promo #1 (Final)!?.webp');
  assert.ok(/^\d+-Banner_Promo__1__Final___\.webp$/.test(sanitized), `Sanitized filename '${sanitized}' must be clean with timestamp prefix`);

  // Test saveMedia validation: null file
  await assert.rejects(
    async () => mediaService.saveMedia(null),
    (err) => err.status === 400 || err.message.includes('wajib diunggah'),
    'saveMedia(null) must throw BadRequestException',
  );

  // Test saveMedia validation: invalid mime type
  await assert.rejects(
    async () => mediaService.saveMedia({ originalname: 'doc.pdf', mimetype: 'application/pdf', size: 100 }),
    (err) => err.status === 400 || err.message.includes('tidak didukung'),
    'saveMedia with PDF must throw BadRequestException',
  );

  // Test saveMedia validation: oversized file (>5MB)
  await assert.rejects(
    async () => mediaService.saveMedia({ originalname: 'big.png', mimetype: 'image/png', size: 6 * 1024 * 1024 }),
    (err) => err.status === 400 || err.message.includes('5MB'),
    'saveMedia with >5MB must throw BadRequestException',
  );

  // Test saveMedia valid file upload
  const testBuffer = Buffer.from('RIFF....WEBPVP8 ... fake test media bytes');
  const uploadResult = await mediaService.saveMedia({
    originalname: 'event banner 2026.webp',
    mimetype: 'image/webp',
    size: testBuffer.length,
    buffer: testBuffer,
  });

  assert.ok(uploadResult.url.startsWith('/uploads/'), 'URL must start with /uploads/');
  assert.ok(uploadResult.filename.includes('event_banner_2026.webp'), 'Filename must be sanitized');
  assert.equal(uploadResult.size, testBuffer.length, 'Size must match uploaded bytes');

  // Verify created file exists on disk, then clean up
  const createdFilePath = path.resolve(backendDir, 'public/uploads', uploadResult.filename);
  const cwdFilePath = path.resolve(process.cwd(), 'public/uploads', uploadResult.filename);
  const targetPath = fs.existsSync(createdFilePath) ? createdFilePath : cwdFilePath;
  assert.ok(fs.existsSync(targetPath), `Uploaded file must exist on disk at ${targetPath}`);
  fs.unlinkSync(targetPath); // Clean up test file

  console.log('✅ Runtime tests on compiled classes and MediaService verified.\n');
} else {
  console.log('ℹ️ dist files not found, run npm run build to verify runtime tests.\n');
}

console.log('🎉 [SUCCESS] All Media Upload & Static Serving checks PASSED!');
