import assert from 'node:assert';
import fs from 'node:fs';
import path from 'node:path';
import test from 'node:test';
import swcModule from '../../../../node_modules/next/dist/build/swc/index.js';

const swc = swcModule.default || swcModule;

const sidebarNotifPath = path.resolve('frontend/src/features/admin/components/SidebarNotification.tsx');
const adminShellPath = path.resolve('frontend/src/features/admin/components/AdminShell.tsx');

test('SidebarNotification static contract: trace category, controls, accessibility & rules', () => {
  assert.ok(fs.existsSync(sidebarNotifPath), 'SidebarNotification.tsx must exist');
  const content = fs.readFileSync(sidebarNotifPath, 'utf8');

  // Trace category & filter tab
  assert.ok(content.includes("'trace'"), 'SidebarNotification.tsx must support trace category/filter');
  assert.ok(content.includes('Jejak Aksi'), 'SidebarNotification.tsx must render Jejak Aksi filter tab');

  // Interface extensions
  assert.ok(content.includes('traceId'), 'NotificationItem must support traceId');
  assert.ok(content.includes('noticeType'), 'NotificationItem must support noticeType');
  assert.ok(content.includes('onMarkAllRead'), 'SidebarNotificationProps must support onMarkAllRead');
  assert.ok(content.includes('onClearTraces'), 'SidebarNotificationProps must support onClearTraces');
  assert.ok(content.includes('Bersihkan Jejak'), 'SidebarNotification.tsx must include Bersihkan Jejak action');
  assert.ok(content.includes('formatNoticeTrace'), 'SidebarNotification.tsx must use formatNoticeTrace');

  // Copy trace button with native button type="button", stopPropagation, clipboard, feedback
  assert.ok(content.includes('Salin Trace'), 'SidebarNotification.tsx must render Salin Trace button');
  assert.ok(content.includes('Tersalin'), 'SidebarNotification.tsx must render Tersalin feedback');
  assert.ok(content.includes('type="button"'), 'Interactive controls must use native <button type="button">');
  assert.ok(content.includes('stopPropagation()'), 'Copy trace button must call e.stopPropagation()');
  assert.match(content, /navigator\.clipboard\??\.writeText/, 'Copy trace must invoke navigator.clipboard?.writeText');

  // Motion & cleanup & AGENTS.md compliance
  assert.ok(content.includes('useReducedMotion'), 'SidebarNotification.tsx must respect useReducedMotion');
  assert.ok(content.includes('clearTimeout'), 'SidebarNotification.tsx must clean up copy feedback timer');
  assert.ok(content.includes('console.warn'), 'SidebarNotification.tsx must log warning via console.warn on clipboard failure');
  assert.match(content, /Readonly<SidebarNotificationProps>/, 'Props must be wrapped in Readonly<...>');
  assert.ok(!/\?[^:\n\r]+\?[^:\n\r]+:/.test(content), 'SidebarNotification.tsx must contain zero nested ternaries');
  assert.ok(!/catch\s*\([^)]*\)\s*\{\s*\}/.test(content), 'SidebarNotification.tsx must not have silent empty catch blocks');
  assert.ok(content.includes('focus-visible:ring-2'), 'NotificationRow interactive button must expose keyboard focus-visible ring');
  assert.ok(!/<motion\.div[^>]*onClick=\{\(\)\s*=>\s*onSelect/.test(content), 'NotificationRow <motion.div> must not be clickable');
  assert.match(content, /<button[\s\S]*?type="button"[\s\S]*?onClick=\{\(\)\s*=>\s*onSelect\(item\)\}/, 'NotificationRow selection must use native <button type="button">');
});

test('AdminShell static contract: useOptionalNotice, trace mapping, useMemo merge & callbacks', () => {
  assert.ok(fs.existsSync(adminShellPath), 'AdminShell.tsx must exist');
  const content = fs.readFileSync(adminShellPath, 'utf8');

  assert.ok(content.includes('useOptionalNotice'), 'AdminShell.tsx must import and use useOptionalNotice');
  assert.ok(!/\buseNotice\s*\(/.test(content), 'AdminShell.tsx must NOT call useNotice() directly outside NoticeProvider');
  assert.ok(
    content.includes('mapNoticeHistoryToNotificationItems'),
    'AdminShell.tsx must define/export mapNoticeHistoryToNotificationItems'
  );
  assert.ok(content.includes('DEFAULT_ADMIN_NOTIFICATIONS'), 'AdminShell.tsx must merge with DEFAULT_ADMIN_NOTIFICATIONS');
  assert.match(content, /useMemo\s*\(/, 'AdminShell.tsx must memoize merged notifications with useMemo');
  assert.ok(content.includes('onMarkAllRead'), 'AdminShell.tsx must pass onMarkAllRead to SidebarNotification');
  assert.ok(content.includes('onClearTraces'), 'AdminShell.tsx must pass onClearTraces to SidebarNotification');
  assert.ok(content.includes('markAllHistoryRead'), 'AdminShell.tsx must wire noticeCtx?.markAllHistoryRead');
  assert.ok(content.includes('clearHistory'), 'AdminShell.tsx must wire noticeCtx?.clearHistory');
  assert.ok(content.includes('Number.isFinite'), 'AdminShell.tsx must guard non-finite timestamps with Number.isFinite');
  assert.ok(!/\?[^:\n\r]+\?[^:\n\r]+:/.test(content), 'AdminShell.tsx must contain zero nested ternaries');
});

function createMockReact() {
  return {
    createContext: () => ({ Provider: () => null }),
    useContext: () => null,
    useState: (init) => [typeof init === 'function' ? init() : init, () => {}],
    useEffect: () => {},
    useCallback: (fn) => fn,
    useRef: (init) => ({ current: init }),
    useMemo: (fn) => fn(),
  };
}

function loadSidebarNotificationRuntime() {
  const code = fs.readFileSync(sidebarNotifPath, 'utf8');
  const transpiled = swc.transformSync(code, {
    jsc: { parser: { syntax: 'typescript', tsx: true }, target: 'es2022' },
    module: { type: 'commonjs' },
  });

  const modExports = {};
  const fn = new Function('exports', 'require', 'module', transpiled.code);
  fn(
    modExports,
    (id) => {
      if (id === 'react') return createMockReact();
      if (id === 'react-dom') return { createPortal: (node) => node };
      if (id === 'framer-motion') {
        return {
          motion: new Proxy({}, { get: () => 'div' }),
          AnimatePresence: ({ children }) => children,
          useReducedMotion: () => false,
        };
      }
      if (id === 'lucide-react') {
        return new Proxy({}, { get: () => () => null });
      }
      if (id.includes('cn')) {
        return { cn: (...args) => args.filter(Boolean).join(' ') };
      }
      if (id.includes('NoticeContext')) {
        return { formatNoticeTrace: () => 'MOCK_TRACE' };
      }
      return {};
    },
    { exports: modExports }
  );
  return modExports;
}

function loadAdminShellRuntime() {
  const code = fs.readFileSync(adminShellPath, 'utf8');
  const transpiled = swc.transformSync(code, {
    jsc: { parser: { syntax: 'typescript', tsx: true }, target: 'es2022' },
    module: { type: 'commonjs' },
  });

  const modExports = {};
  const fn = new Function('exports', 'require', 'module', transpiled.code);
  fn(
    modExports,
    (id) => {
      if (id === 'react') return createMockReact();
      if (id === 'next/link' || id === 'next/image') return () => null;
      if (id === 'next/navigation') return { useRouter: () => ({ push: () => {}, refresh: () => {} }) };
      if (id === 'framer-motion') {
        return {
          motion: new Proxy({}, { get: () => 'div' }),
          useReducedMotion: () => false,
        };
      }
      if (id === 'lucide-react') {
        return new Proxy({}, { get: () => () => null });
      }
      if (id.includes('cn')) {
        return { cn: (...args) => args.filter(Boolean).join(' ') };
      }
      if (id.includes('NoticeContext')) {
        return { useOptionalNotice: () => null };
      }
      if (id.includes('SidebarNotification')) {
        return {
          SidebarNotification: () => null,
          DEFAULT_ADMIN_NOTIFICATIONS: [],
        };
      }
      return new Proxy({}, { get: () => () => null });
    },
    { exports: modExports }
  );
  return modExports;
}

test('runtime behavioral: getTraceStatusMeta lookup & fallback', () => {
  const runtime = loadSidebarNotificationRuntime();
  assert.strictEqual(typeof runtime.getTraceStatusMeta, 'function', 'getTraceStatusMeta must be exported');

  const successMeta = runtime.getTraceStatusMeta('success');
  assert.strictEqual(successMeta.label, 'Berhasil');
  assert.ok(typeof successMeta.badgeClass === 'string' && successMeta.badgeClass.length > 0);

  const errorMeta = runtime.getTraceStatusMeta('error');
  assert.strictEqual(errorMeta.label, 'Error');

  const warningMeta = runtime.getTraceStatusMeta('warning');
  assert.strictEqual(warningMeta.label, 'Peringatan');

  const infoMeta = runtime.getTraceStatusMeta('info');
  assert.strictEqual(infoMeta.label, 'Info');

  const fallbackMeta = runtime.getTraceStatusMeta(undefined);
  assert.strictEqual(fallbackMeta.label, 'Info', 'Undefined noticeType must fall back to Info');
});

test('runtime behavioral: mapNoticeHistoryToNotificationItems timestamp, targetTab & unread mapping', () => {
  const runtime = loadAdminShellRuntime();
  assert.strictEqual(
    typeof runtime.mapNoticeHistoryToNotificationItems,
    'function',
    'mapNoticeHistoryToNotificationItems must be exported from AdminShell.tsx'
  );

  assert.deepStrictEqual(runtime.mapNoticeHistoryToNotificationItems([]), []);

  const ts = new Date(2026, 4, 10, 9, 5, 7).getTime();
  const mapped = runtime.mapNoticeHistoryToNotificationItems([
    {
      id: 'n-hero',
      traceId: 'TRC-HERO01',
      type: 'success',
      title: 'Slide Dibuat',
      description: 'Banner baru berhasil disimpan',
      timestamp: ts,
      source: 'Hero Carousel',
      action: 'CREATE_SLIDE',
      detail: 'ID: 12',
      read: false,
    },
    {
      id: 'n-events',
      traceId: 'TRC-EVT002',
      type: 'info',
      title: 'Event Diperbarui',
      timestamp: ts,
      source: 'Event & Komunitas',
      action: 'UPDATE_EVENT',
      read: true,
    },
    {
      id: 'n-sec',
      traceId: 'TRC-SEC003',
      type: 'warning',
      title: 'Rate Limit OTP',
      timestamp: ts,
      source: 'SecurityConfigPanel',
      action: 'UPDATE_OTP',
    },
    {
      id: 'n-cust',
      traceId: 'TRC-USR004',
      type: 'success',
      title: 'Role Mitra Diubah',
      timestamp: ts,
      source: 'Direktori Mitra',
      action: 'UPDATE_CUSTOMER',
      read: false,
    },
    {
      id: 'n-inv',
      traceId: 'TRC-INV005',
      type: 'success',
      title: 'Token VIP Dibuat',
      timestamp: ts,
      source: 'Undangan VIP',
      action: 'GENERATE_INVITE',
      read: false,
    },
    {
      id: 'n-nan',
      traceId: 'TRC-NAN006',
      type: 'error',
      title: 'Koneksi Terputus',
      timestamp: Number.NaN,
      source: 'NetworkLayer',
      action: 'PING',
      read: false,
    },
  ]);

  assert.strictEqual(mapped.length, 6);

  assert.strictEqual(mapped[0].category, 'trace');
  assert.strictEqual(mapped[0].time, '09:05:07');
  assert.strictEqual(mapped[0].targetTab, 'hero');
  assert.strictEqual(mapped[0].traceId, 'TRC-HERO01');
  assert.strictEqual(mapped[0].noticeType, 'success');
  assert.strictEqual(mapped[0].source, 'Hero Carousel');
  assert.strictEqual(mapped[0].action, 'CREATE_SLIDE');
  assert.strictEqual(mapped[0].detail, 'ID: 12');
  assert.strictEqual(mapped[0].timestamp, ts);
  assert.strictEqual(mapped[0].unread, true);

  assert.strictEqual(mapped[1].targetTab, 'events');
  assert.strictEqual(mapped[1].unread, false);

  assert.strictEqual(mapped[2].targetTab, 'security');
  assert.strictEqual(mapped[2].unread, true);

  assert.strictEqual(mapped[3].targetTab, 'customers');
  assert.strictEqual(mapped[4].targetTab, 'invites');

  assert.strictEqual(mapped[5].targetTab, undefined);
  assert.strictEqual(mapped[5].time, '--:--:--');
  assert.strictEqual(mapped[5].unread, true);
});
