import assert from 'node:assert/strict';

/**
 * Test Suite: Reusable Headless Dynamic Island Telemetry Notice Logic
 * Verifies:
 * 1. Notice item structure & type compliance
 * 2. Deduplication of identical notice titles (anti-spam)
 * 3. Queue bounding (max items in stack)
 * 4. Manual dismissal by ID
 * 5. Bulk clearAll()
 */

function createNoticeManager() {
  let notices = [];
  const timers = new Map();

  function dismiss(id) {
    const timer = timers.get(id);
    if (timer) {
      clearTimeout(timer);
      timers.delete(id);
    }
    notices = notices.filter((n) => n.id !== id);
  }

  function clearAll() {
    timers.forEach((t) => clearTimeout(t));
    timers.clear();
    notices = [];
  }

  function addNotice(type, title, description, duration = 4500) {
    const id = `test-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`;
    const item = { id, type, title, description, duration };

    // Deduplicate same title
    const filtered = notices.filter((n) => n.title !== title);
    notices = [...filtered, item].slice(-2);

    if (duration > 0) {
      const timer = setTimeout(() => {
        dismiss(id);
      }, duration);
      timers.set(id, timer);
    }

    return id;
  }

  return {
    getNotices: () => [...notices],
    notify: {
      error: (title, desc, dur) => addNotice('error', title, desc, dur),
      success: (title, desc, dur) => addNotice('success', title, desc, dur),
      info: (title, desc, dur) => addNotice('info', title, desc, dur),
      warning: (title, desc, dur) => addNotice('warning', title, desc, dur),
      dismiss,
      clearAll,
    },
  };
}

console.log('--- Running Notice System Unit Tests ---');

// Test 1: Single Notice Creation
const mgr = createNoticeManager();
const id1 = mgr.notify.error('This email is already registered.');
assert.equal(mgr.getNotices().length, 1);
assert.equal(mgr.getNotices()[0].type, 'error');
assert.equal(mgr.getNotices()[0].title, 'This email is already registered.');

// Test 2: Deduplication (rapid duplicate clicks don't spam stack)
mgr.notify.error('This email is already registered.');
assert.equal(mgr.getNotices().length, 1, 'Duplicate titles should replace, not accumulate');

// Test 3: Multiple Distinct Notices Stack Bounding (max 2)
mgr.notify.info('Verification code sent.');
mgr.notify.success('Account created.');
assert.equal(mgr.getNotices().length, 2, 'Stack should hold at most 2 items');
assert.equal(mgr.getNotices()[1].title, 'Account created.');

// Test 4: Dismissal by ID
const currentId = mgr.getNotices()[0].id;
mgr.notify.dismiss(currentId);
assert.equal(mgr.getNotices().length, 1);

// Test 5: Clear All
mgr.notify.clearAll();
assert.equal(mgr.getNotices().length, 0);

console.log('# OK: All Notice System unit tests passed cleanly (100% assertions).');
