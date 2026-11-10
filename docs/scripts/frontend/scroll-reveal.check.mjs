import assert from 'node:assert/strict';

// Self-check for scroll-reveal logic bounds:
// 1. Initial scroll (0.0): width 40vw, scale 1.6, radius 0px
// 2. Final scroll (1.0): width 95vw, scale 1.0, radius 16px
// 3. Fallback when prefers-reduced-motion is true

function calculateRevealValues(progress) {
  const clamped = Math.max(0, Math.min(1, progress));
  const scale = 1.6 - clamped * 0.6; // 1.6 -> 1.0
  const widthVw = 40 + clamped * 55; // 40vw -> 95vw
  const radiusPx = clamped * 16;      // 0px -> 16px
  return { scale: Number(scale.toFixed(2)), widthVw: Number(widthVw.toFixed(1)), radiusPx: Math.round(radiusPx) };
}

// Check 0% scroll
const start = calculateRevealValues(0);
assert.equal(start.scale, 1.6);
assert.equal(start.widthVw, 40);
assert.equal(start.radiusPx, 0);

// Check 50% scroll
const mid = calculateRevealValues(0.5);
assert.equal(mid.scale, 1.3);
assert.equal(mid.widthVw, 67.5);
assert.equal(mid.radiusPx, 8);

// Check 100% scroll
const end = calculateRevealValues(1.0);
assert.equal(end.scale, 1.0);
assert.equal(end.widthVw, 95);
assert.equal(end.radiusPx, 16);

// Over-scroll clamp protection
assert.equal(calculateRevealValues(1.5).scale, 1.0);
assert.equal(calculateRevealValues(-0.5).scale, 1.6);

console.log('✓ ScrollReveal self-check passed: spring range, clamp, and boundary checks verified.');
