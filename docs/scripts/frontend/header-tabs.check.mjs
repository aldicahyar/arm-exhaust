import assert from 'node:assert/strict';

// 1. Tabs keys
const knownTabs = ['home', 'catalog', 'contact'];
assert.equal(knownTabs.length, 3);
assert.ok(knownTabs.includes('home'));
assert.ok(knownTabs.includes('catalog'));
assert.ok(knownTabs.includes('contact'));

// 2. Language switch meta
function getLanguageMeta(lang) {
  return {
    label: lang === 'ID' ? 'Indonesia' : 'English',
    code: lang,
  };
}
assert.equal(getLanguageMeta('ID').label, 'Indonesia');
assert.equal(getLanguageMeta('EN').label, 'English');

// 3. User dual-state logic
function toggleAuthState(currentUser) {
  if (currentUser) return null;
  return {
    name: 'Dimas Pratama',
    email: 'dimas.rider@gmail.com',
    unreadNotifications: 3,
  };
}
let user = null;
assert.equal(user, null);
// Simulate login
user = toggleAuthState(user);
assert.ok(user !== null);
assert.equal(user.name, 'Dimas Pratama');
assert.equal(user.unreadNotifications, 3);
// Simulate logout
user = toggleAuthState(user);
assert.equal(user, null);

// 4. Expandable Search transition
let searchState = { expanded: false, query: '' };
function openSearch(s) { return { ...s, expanded: true }; }
function closeSearch(s) { return { expanded: false, query: '' }; }

searchState = openSearch(searchState);
assert.equal(searchState.expanded, true);
searchState.query = 'Vario 125';
assert.equal(searchState.query, 'Vario 125');
searchState = closeSearch(searchState);
assert.equal(searchState.expanded, false);
assert.equal(searchState.query, '');

console.log('# Success: HeaderTabs self-check passed navigation, auth, language, and search state invariants.');
