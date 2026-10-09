// Boots the real server against a throwaway MongoDB and checks the endpoints a shopper depends on.
// CI provides MONGO_URI; locally: MONGO_URI=mongodb://127.0.0.1:27017/chalkcoal_test npm test
import { test, before, after } from 'node:test';
import assert from 'node:assert/strict';
import { spawn } from 'node:child_process';
import { once } from 'node:events';

const PORT = 5099;
const base = `http://127.0.0.1:${PORT}`;
let proc;

async function waitUp() {
  for (let i = 0; i < 60; i++) {
    try { if ((await fetch(`${base}/api/health`)).ok) return; } catch {}
    await new Promise((r) => setTimeout(r, 500));
  }
  throw new Error('server did not start');
}

before(async () => {
  const env = { ...process.env, PORT: String(PORT), JWT_SECRET: 'ci-secret', CLIENT_URL: 'http://localhost', SITE_URL: 'http://localhost', MONGO_URI: process.env.MONGO_URI || 'mongodb://127.0.0.1:27017/chalkcoal_test' };
  const seed = spawn('node', ['src/addProducts.js'], { env, stdio: 'inherit' });
  const [code] = await once(seed, 'exit');
  assert.equal(code, 0, 'catalogue seed failed');
  proc = spawn('node', ['src/index.js'], { env, stdio: 'inherit' });
  await waitUp();
});
after(() => proc?.kill());

test('health', async () => {
  const r = await fetch(`${base}/api/health`);
  assert.equal(r.status, 200);
  assert.deepEqual(await r.json(), { ok: true });
});

test('products list is non-empty', async () => {
  const r = await fetch(`${base}/api/products`);
  assert.equal(r.status, 200);
  const body = await r.json();
  const list = Array.isArray(body) ? body : body.products ?? body.items;
  assert.ok(list.length > 0);
});

test('unknown api route is JSON 404', async () => {
  const r = await fetch(`${base}/api/nope`);
  assert.equal(r.status, 404);
  assert.match(r.headers.get('content-type'), /json/);
});

test('admin api requires auth', async () => {
  const r = await fetch(`${base}/api/admin/orders`);
  assert.ok([401, 403].includes(r.status));
});

test('security headers are set', async () => {
  const r = await fetch(`${base}/api/health`);
  assert.ok(r.headers.get('content-security-policy'));
  assert.equal(r.headers.get('x-content-type-options'), 'nosniff');
  assert.equal(r.headers.get('x-powered-by'), null);
});

test('robots.txt and sitemap', async () => {
  assert.equal((await fetch(`${base}/robots.txt`)).status, 200);
  assert.equal((await fetch(`${base}/sitemap.xml`)).status, 200);
});
