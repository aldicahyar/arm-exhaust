import assert from 'node:assert';
import fs from 'node:fs';
import path from 'node:path';
import test from 'node:test';
import swcModule from '../../../../node_modules/next/dist/build/swc/index.js';

const swc = swcModule.default || swcModule;

const typesPath = path.resolve('frontend/src/shared/components/notice/types.ts');
const contextPath = path.resolve('frontend/src/shared/components/notice/NoticeContext.tsx');
const dynamicIslandPath = path.resolve('frontend/src/shared/components/notice/DynamicIslandNotice.tsx');

test('notice types contract: definitions for tracing and persistent history', () => {
  assert.ok(fs.existsSync(typesPath), 'types.ts must exist');
  const content = fs.readFileSync(typesPath, 'utf8');

  // Must export NoticeOptions
  assert.match(content, /export\s+(interface|type)\s+NoticeOptions/, 'types.ts must export NoticeOptions');
  assert.ok(content.includes('source?: string'), 'NoticeOptions must support optional source');
  assert.ok(content.includes('action?: string'), 'NoticeOptions must support optional action');
  assert.ok(content.includes('detail?: string'), 'NoticeOptions must support optional detail');

  // NoticeItem must include traceId, timestamp, source, action, detail, read
  assert.ok(content.includes('traceId: string'), 'NoticeItem must include traceId: string');
  assert.ok(content.includes('timestamp: number'), 'NoticeItem must include timestamp: number');
  assert.ok(content.includes('read?: boolean'), 'NoticeItem must include optional read?: boolean');

  // NoticeContextValue must include history, unreadTraceCount, markAllHistoryRead, clearHistory
  assert.ok(content.includes('history: NoticeItem[]'), 'NoticeContextValue must include history: NoticeItem[]');
  assert.ok(content.includes('unreadTraceCount: number'), 'NoticeContextValue must include unreadTraceCount: number');
  assert.ok(content.includes('markAllHistoryRead: () => void'), 'NoticeContextValue must include markAllHistoryRead');
  assert.ok(content.includes('clearHistory: () => void'), 'NoticeContextValue must include clearHistory');
});

test('NoticeContext contract: static architecture & safety assertions', () => {
  assert.ok(fs.existsSync(contextPath), 'NoticeContext.tsx must exist');
  const content = fs.readFileSync(contextPath, 'utf8');

  // Must export useOptionalNotice and formatNoticeTrace
  assert.match(content, /export\s+function\s+useOptionalNotice/, 'NoticeContext.tsx must export useOptionalNotice');
  assert.match(content, /export\s+function\s+formatNoticeTrace/, 'NoticeContext.tsx must export formatNoticeTrace');

  // Storage key and history cap
  assert.ok(content.includes('arm_admin_notice_traces_v1'), 'Must use localStorage key arm_admin_notice_traces_v1');
  assert.match(content, /(50|MAX_HISTORY_ITEMS\s*=\s*50)/, 'Must cap history at 50 items');

  // Context value wrapped in useMemo
  assert.match(content, /useMemo\s*\(/, 'NoticeContext provider value must be wrapped in useMemo');
  assert.match(content, /<NoticeContext\.Provider\s+value=\{[^}]*\}\>/, 'NoticeContext.Provider value must use memoized value');

  // Overloaded notify arguments without nested ternaries
  assert.ok(content.includes("typeof durationOrOptions === 'number'"), 'Must inspect typeof durationOrOptions');
  assert.ok(!/\?[^:\n\r]+\?[^:\n\r]+:/.test(content), 'NoticeContext.tsx must contain zero nested ternaries');

  // Component props readonly compliance (AGENTS.md Rule 7)
  assert.match(content, /Readonly<[^>]+>/, 'NoticeProvider props must be wrapped in Readonly<...>');

  // Zero empty catch blocks (AGENTS.md Rule 6)
  assert.ok(!/catch\s*\([^)]*\)\s*\{\s*\}/.test(content), 'NoticeContext.tsx must not have silent empty catch blocks');

  // No impure persistHistory calls inside setHistory updaters
  assert.ok(!/setHistory\(\([^)]*\)\s*=>\s*\{[^}]*persistHistory/.test(content), 'persistHistory must not be called inside setHistory updaters');
});

// Helper to evaluate NoticeContext in a clean execution context
function loadNoticeContextRuntime() {
  const code = fs.readFileSync(contextPath, 'utf8');
  const transpiled = swc.transformSync(code, {
    jsc: { parser: { syntax: 'typescript', tsx: true }, target: 'es2022' },
    module: { type: 'commonjs' },
  });

  const mockReact = {
    createContext: () => ({ Provider: () => null }),
    useContext: () => null,
    useState: (init) => [typeof init === 'function' ? init() : init, () => {}],
    useEffect: () => {},
    useCallback: (fn) => fn,
    useRef: (init) => ({ current: init }),
    useMemo: (fn) => fn(),
  };

  const modExports = {};
  const fn = new Function('exports', 'require', 'module', transpiled.code);
  fn(modExports, (id) => (id === 'react' ? mockReact : {}), { exports: modExports });
  return modExports;
}

test('runtime behavioral: generateTraceId format & uniqueness', () => {
  const { generateTraceId } = loadNoticeContextRuntime();
  assert.strictEqual(typeof generateTraceId, 'function', 'generateTraceId must be exported function');

  const traceId1 = generateTraceId();
  const traceId2 = generateTraceId();

  assert.match(traceId1, /^TRC-[A-Z0-9]{6}$/, 'Trace ID must match ^TRC-[A-Z0-9]{6}$');
  assert.match(traceId2, /^TRC-[A-Z0-9]{6}$/, 'Trace ID must match ^TRC-[A-Z0-9]{6}$');
});

test('runtime behavioral: normalizeNoticeOptions argument handling', () => {
  const { normalizeNoticeOptions } = loadNoticeContextRuntime();
  assert.strictEqual(typeof normalizeNoticeOptions, 'function', 'normalizeNoticeOptions must be exported function');

  // 1. Numeric argument (duration)
  assert.deepStrictEqual(normalizeNoticeOptions(3000), { duration: 3000 });
  assert.deepStrictEqual(normalizeNoticeOptions(0), { duration: 0 });

  // 2. Structured options object
  const opts = { duration: 6000, source: 'Hero Carousel', action: 'CREATE_SLIDE', detail: 'Slide #4' };
  assert.deepStrictEqual(normalizeNoticeOptions(opts), {
    duration: 6000,
    source: 'Hero Carousel',
    action: 'CREATE_SLIDE',
    detail: 'Slide #4',
  });

  // 3. Partial options object (default duration fallback)
  assert.deepStrictEqual(normalizeNoticeOptions({ source: 'Security' }), {
    duration: 4500,
    source: 'Security',
    action: undefined,
    detail: undefined,
  });

  // 4. Undefined / null fallback
  assert.deepStrictEqual(normalizeNoticeOptions(undefined), { duration: 4500 });
  assert.deepStrictEqual(normalizeNoticeOptions(null), { duration: 4500 });

  // 5. Non-finite numbers (NaN, Infinity, -Infinity) fallback
  assert.deepStrictEqual(normalizeNoticeOptions(NaN), { duration: 4500 });
  assert.deepStrictEqual(normalizeNoticeOptions(Infinity), { duration: 4500 });
  assert.deepStrictEqual(normalizeNoticeOptions(-Infinity), { duration: 4500 });
  assert.deepStrictEqual(normalizeNoticeOptions({ duration: NaN }), {
    duration: 4500,
    source: undefined,
    action: undefined,
    detail: undefined,
  });
  assert.deepStrictEqual(normalizeNoticeOptions({ duration: Infinity }), {
    duration: 4500,
    source: undefined,
    action: undefined,
    detail: undefined,
  });
});

test('runtime behavioral: formatNoticeTrace line formatting & invalid timestamp fallback', () => {
  const { formatNoticeTrace } = loadNoticeContextRuntime();
  assert.strictEqual(typeof formatNoticeTrace, 'function', 'formatNoticeTrace must be exported function');

  // 1. Complete item
  const validItem = {
    id: 'test-1',
    traceId: 'TRC-ABC123',
    type: 'success',
    title: 'Slide Disimpan',
    description: 'Slide berhasil diperbarui',
    timestamp: 1700000000000,
    source: 'Hero Carousel',
    action: 'UPDATE_SLIDE',
    detail: 'ID: 42',
    read: false,
  };
  const formatted = formatNoticeTrace(validItem);

  assert.ok(formatted.includes('[TRC-ABC123] [SUCCESS] [2023-11-14T22:13:20.000Z]'));
  assert.ok(formatted.includes('Title: Slide Disimpan'));
  assert.ok(formatted.includes('Source: Hero Carousel'));
  assert.ok(formatted.includes('Action: UPDATE_SLIDE'));
  assert.ok(formatted.includes('Description: Slide berhasil diperbarui'));
  assert.ok(formatted.includes('Detail: ID: 42'));

  // 2. Minimal item (no optional fields)
  const minItem = {
    id: 'test-2',
    traceId: 'TRC-XYZ789',
    type: 'error',
    title: 'Gagal Memuat',
    timestamp: 1700000000000,
  };
  const minFormatted = formatNoticeTrace(minItem);
  assert.ok(minFormatted.includes('[TRC-XYZ789] [ERROR] [2023-11-14T22:13:20.000Z]'));
  assert.ok(minFormatted.includes('Title: Gagal Memuat'));
  assert.ok(!minFormatted.includes('Source:'));
  assert.ok(!minFormatted.includes('Action:'));

  // 3. Fallback for non-finite / invalid timestamp (must not throw RangeError!)
  const invalidTimestampItem = {
    id: 'test-3',
    traceId: 'TRC-NAN999',
    type: 'warning',
    title: 'Peringatan Sistem',
    timestamp: NaN,
  };
  const fallbackFormatted = formatNoticeTrace(invalidTimestampItem);
  assert.ok(fallbackFormatted.includes('[TRC-NAN999] [WARNING] ['));
  assert.ok(!fallbackFormatted.includes('NaN'));
});

test('runtime behavioral: isValidNoticeItem & corrupted localStorage parsing resilience', () => {
  const { isValidNoticeItem, loadStoredHistory } = loadNoticeContextRuntime();
  assert.strictEqual(typeof isValidNoticeItem, 'function', 'isValidNoticeItem must be exported function');

  // Type guard validations
  assert.strictEqual(isValidNoticeItem(null), false);
  assert.strictEqual(isValidNoticeItem(undefined), false);
  assert.strictEqual(isValidNoticeItem('string'), false);
  assert.strictEqual(isValidNoticeItem(123), false);
  assert.strictEqual(isValidNoticeItem({}), false);
  assert.strictEqual(isValidNoticeItem({ id: '', traceId: 'TRC-1', title: 'T', type: 'info', timestamp: 100 }), false);
  assert.strictEqual(isValidNoticeItem({ id: '1', traceId: '', title: 'T', type: 'info', timestamp: 100 }), false);
  assert.strictEqual(isValidNoticeItem({ id: '1', traceId: 'TRC-1', title: '', type: 'info', timestamp: 100 }), false);
  assert.strictEqual(isValidNoticeItem({ id: '1', traceId: 'TRC-1', title: 'T', type: 'invalid_type', timestamp: 100 }), false);
  assert.strictEqual(isValidNoticeItem({ id: '1', traceId: 'TRC-1', title: 'T', type: 'info', timestamp: NaN }), false);
  assert.strictEqual(isValidNoticeItem({ id: '1', traceId: 'TRC-1', title: 'T', type: 'info', timestamp: Infinity }), false);
  assert.strictEqual(isValidNoticeItem({ id: '1', traceId: 'TRC-1', title: 'T', type: 'info', timestamp: 100, read: 'not-bool' }), false);

  const validSample = {
    id: 'valid-1',
    traceId: 'TRC-OK123',
    type: 'success',
    title: 'Sukses',
    timestamp: 1700000000000,
    read: true,
  };
  assert.strictEqual(isValidNoticeItem(validSample), true);

  // localStorage resilience with mock window.localStorage
  const storageMap = new Map();
  const mockLocalStorage = {
    getItem: (key) => storageMap.get(key) ?? null,
    setItem: (key, val) => storageMap.set(key, String(val)),
    removeItem: (key) => storageMap.delete(key),
  };

  const originalWindow = globalThis.window;
  try {
    globalThis.window = { localStorage: mockLocalStorage };

    // Case A: Malformed non-JSON string
    mockLocalStorage.setItem('arm_admin_notice_traces_v1', '{corrupted json[');
    assert.deepStrictEqual(loadStoredHistory(), [], 'Must return [] on corrupt JSON without throwing');

    // Case B: Non-array JSON
    mockLocalStorage.setItem('arm_admin_notice_traces_v1', JSON.stringify({ not: 'an array' }));
    assert.deepStrictEqual(loadStoredHistory(), [], 'Must return [] on non-array JSON');

    // Case C: Array containing corrupted elements + 1 valid element
    const corruptedArray = [
      null,
      undefined,
      42,
      'just a string',
      {},
      { id: 'bad-1', type: 'unknown_type' },
      { id: 'bad-2', traceId: 'TRC-BAD', title: 'Title', type: 'error', timestamp: NaN },
      validSample,
    ];
    mockLocalStorage.setItem('arm_admin_notice_traces_v1', JSON.stringify(corruptedArray));
    const loaded = loadStoredHistory();
    assert.strictEqual(loaded.length, 1, 'Must filter out all corrupted entries and retain only valid items');
    assert.strictEqual(loaded[0].id, 'valid-1');
  } finally {
    globalThis.window = originalWindow;
  }
});

test('DynamicIslandNotice static contract: architecture, accessibility, & motion safety', () => {
  assert.ok(fs.existsSync(dynamicIslandPath), 'DynamicIslandNotice.tsx must exist');
  const content = fs.readFileSync(dynamicIslandPath, 'utf8');

  // Must import formatNoticeTrace and useReducedMotion
  assert.match(content, /formatNoticeTrace/, 'DynamicIslandNotice.tsx must import/use formatNoticeTrace');
  assert.match(content, /useReducedMotion/, 'DynamicIslandNotice.tsx must import/use useReducedMotion');

  // Must render traceId, source, and detail
  assert.ok(content.includes('notice.traceId'), 'DynamicIslandNotice.tsx must render notice.traceId');
  assert.ok(content.includes('notice.source'), 'DynamicIslandNotice.tsx must support notice.source');
  assert.ok(content.includes('notice.detail'), 'DynamicIslandNotice.tsx must support notice.detail');

  // Clean control flow: zero nested ternaries (AGENTS.md Rule 4)
  assert.ok(!/\?[^:\n\r]+\?[^:\n\r]+:/.test(content), 'DynamicIslandNotice.tsx must contain zero nested ternaries');

  // Accessibility & event safety: buttons must be type="button" and stop pointerDown propagation
  assert.ok(content.includes('type="button"'), 'Interactive elements must use native button type="button"');
  assert.ok(content.includes('stopPropagation()'), 'Interactive buttons must stop pointerDown propagation to preserve drag gestures');
  assert.ok(content.includes('focus-visible:ring-zinc-400'), 'Dismiss button must have visible focus ring');
  assert.ok(content.includes('Object.hasOwn'), 'getNoticeTypeBadge must use Object.hasOwn for prototype safety');
  assert.ok(content.includes('{ className }') || content.includes('className'), 'DynamicIslandNotice must accept and merge className');

  // Clipboard copy and state handling
  assert.ok(content.includes('clipboard.writeText'), 'Must invoke navigator.clipboard.writeText');
  assert.ok(content.includes('Tersalin'), 'Must have visual "Tersalin" feedback on copy');

  // Timer cleanup & error handling
  assert.ok(content.includes('clearTimeout'), 'Must clean up timeout handles');
  assert.ok(!/catch\s*\([^)]*\)\s*\{\s*\}/.test(content), 'DynamicIslandNotice.tsx must not have silent empty catch blocks');

  // Progress bar / duration indicator using scaleX when duration > 0 and !shouldReduceMotion
  assert.ok(content.includes('scaleX'), 'Duration bar must animate scaleX');
});

function loadDynamicIslandRuntime() {
  const code = fs.readFileSync(dynamicIslandPath, 'utf8');
  const transpiled = swc.transformSync(code, {
    jsc: { parser: { syntax: 'typescript', tsx: true }, target: 'es2022' },
    module: { type: 'commonjs' },
  });

  const mockReact = {
    useState: (init) => [typeof init === 'function' ? init() : init, () => {}],
    useEffect: () => {},
    useCallback: (fn) => fn,
    useRef: (init) => ({ current: init }),
    useMemo: (fn) => fn(),
  };

  const modExports = {};
  const fn = new Function('exports', 'require', 'module', transpiled.code);
  fn(
    modExports,
    (id) => {
      if (id === 'react') return mockReact;
      if (id === 'framer-motion') {
        return {
          motion: new Proxy({}, { get: () => 'div' }),
          AnimatePresence: ({ children }) => children,
          useReducedMotion: () => false,
        };
      }
      if (id === 'lucide-react') {
        return { Check: () => null, Copy: () => null, X: () => null };
      }
      if (id.includes('NoticeContext')) {
        return {
          useNotice: () => ({ notices: [], notify: { dismiss: () => {} } }),
          formatNoticeTrace: () => 'MOCK_TRACE',
        };
      }
      return {};
    },
    { exports: modExports }
  );
  return modExports;
}

test('DynamicIslandNotice runtime behavioral: getNoticeTypeBadge status mapping & fallback', () => {
  const runtime = loadDynamicIslandRuntime();
  assert.strictEqual(typeof runtime.getNoticeTypeBadge, 'function', 'getNoticeTypeBadge must be an exported function');

  const successBadge = runtime.getNoticeTypeBadge('success');
  assert.strictEqual(successBadge.label, 'Berhasil');
  assert.ok(typeof successBadge.dotClass === 'string' && successBadge.dotClass.length > 0);
  assert.ok(typeof successBadge.chipClass === 'string' && successBadge.chipClass.length > 0);

  const errorBadge = runtime.getNoticeTypeBadge('error');
  assert.strictEqual(errorBadge.label, 'Error');
  assert.ok(typeof errorBadge.dotClass === 'string' && errorBadge.dotClass.length > 0);

  const warningBadge = runtime.getNoticeTypeBadge('warning');
  assert.strictEqual(warningBadge.label, 'Peringatan');
  assert.ok(typeof warningBadge.dotClass === 'string' && warningBadge.dotClass.length > 0);

  const infoBadge = runtime.getNoticeTypeBadge('info');
  assert.strictEqual(infoBadge.label, 'Info');
  assert.ok(typeof infoBadge.dotClass === 'string' && infoBadge.dotClass.length > 0);

  // Fallback for unknown / invalid types
  const unknownBadge = runtime.getNoticeTypeBadge('unknown_type');
  assert.strictEqual(unknownBadge.label, 'Info', 'Unknown notice type should fall back to Info badge');

  // Fallback for prototype properties (Object.prototype.toString, valueOf, etc.)
  const protoBadge = runtime.getNoticeTypeBadge('toString');
  assert.strictEqual(protoBadge.label, 'Info', 'Object prototype properties must fall back to Info badge');
  const valueOfBadge = runtime.getNoticeTypeBadge('valueOf');
  assert.strictEqual(valueOfBadge.label, 'Info', 'Object prototype properties must fall back to Info badge');

  // Pure Monochrome styling assertion: dotClass must use neutral zinc shades, zero raw color hexes
  assert.ok(successBadge.dotClass.includes('zinc'), 'Success badge must use monochrome zinc styling');
  assert.ok(errorBadge.dotClass.includes('zinc'), 'Error badge must use monochrome zinc styling');
  assert.ok(!successBadge.dotClass.includes('#22C55E'), 'Success badge must not use bright green color');
  assert.ok(!errorBadge.dotClass.includes('#E81828'), 'Error badge must not use bright red color');
});

test('NoticeContext runtime behavioral: sanitizeErrorMessage backend leak prevention', () => {
  const runtime = loadNoticeContextRuntime();
  assert.strictEqual(typeof runtime.sanitizeErrorMessage, 'function', 'sanitizeErrorMessage must be exported');

  const defaultSafe = 'Terjadi kendala pada sistem. Silakan coba beberapa saat lagi.';

  // 1. Prisma errors
  const prismaErr = 'PrismaClientKnownRequestError: Invalid `prisma.hero_slide.create()` invocation: Unique constraint failed';
  assert.strictEqual(runtime.sanitizeErrorMessage(prismaErr), defaultSafe);

  // 2. Raw SQL / PostgreSQL leaks
  const sqlErr = 'error: syntax error at or near "SELECT" relation "hero_slide" does not exist';
  assert.strictEqual(runtime.sanitizeErrorMessage(sqlErr), defaultSafe);

  // 3. Stack traces
  const stackErr = 'Error: Cannot read properties of undefined at Object.run (C:\\app\\node_modules\\server.js:42:15)';
  assert.strictEqual(runtime.sanitizeErrorMessage(stackErr), defaultSafe);

  // 4. Connection / Network errors
  const connErr = 'connect ECONNREFUSED 127.0.0.1:4000';
  assert.strictEqual(runtime.sanitizeErrorMessage(connErr), defaultSafe);

  // 5. Clean user validation messages must pass through unharmed
  const userValid1 = 'Judul slide wajib diisi.';
  assert.strictEqual(runtime.sanitizeErrorMessage(userValid1), userValid1);

  const userValid2 = 'Ukuran maksimal file gambar adalah 5MB.';
  assert.strictEqual(runtime.sanitizeErrorMessage(userValid2), userValid2);
});
