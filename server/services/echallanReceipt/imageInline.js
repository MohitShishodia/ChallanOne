import { createLogger } from './logger.js';

const log = createLogger();
const caches = new WeakMap();

/**
 * VPS datacenter IPs are blocked by itmschallan / echallan camera CDNs.
 * Accept missing evidence photos gracefully — generate PDF with whatever loaded.
 * Don't burn the request budget retrying blocked hosts or proxies.
 */
const IMAGE_WAIT_MS = 6000;
const ROUTE_FETCH_TIMEOUT_MS = 5000;

/**
 * Record every image response on this browser context so we can embed
 * them in page.pdf() (Chromium omits cross-origin images without CORS).
 */
export function ensureImageCache(context) {
  const existing = caches.get(context);
  if (existing) return existing;

  const cache = new Map();
  caches.set(context, cache);

  context.on('response', async (response) => {
    try {
      const type = response.request().resourceType();
      const url = response.url();
      const ct = String(response.headers()['content-type'] || '').toLowerCase();
      if (type !== 'image' && !ct.startsWith('image/')) return;
      if (!response.ok()) return;

      const body = await response.body();
      if (!isUsableImage(body, ct)) return;

      const contentType = (ct.split(';')[0] || '').startsWith('image/')
        ? ct.split(';')[0]
        : sniffImageType(body);

      rememberImage(cache, url, { body: Buffer.from(body), contentType });
    } catch {
      // response body may already be disposed
    }
  });

  return cache;
}

/**
 * Intercept evidence CDN requests. Try host fallback once; don't hang.
 */
export async function installChallanImageRoutes(context) {
  ensureImageCache(context);
  await context.unroute('**/*img2/challans/**').catch(() => {});
  await context.unroute('**/*itmschallan.parivahan.*/**').catch(() => {});

  const handler = async (route) => {
    const original = route.request().url();
    if (
      !/\.(png|jpe?g|webp|gif)(\?|$)/i.test(original) &&
      !/img2\/challans|\/storage\/|evidence|vehicle|challan.?img/i.test(original)
    ) {
      await route.continue().catch(() => {});
      return;
    }

    const headers = route.request().headers();
    const referer =
      headers.referer || headers.Referer || 'https://echallan.parivahan.nic.in/challan/';

    const candidates = hostFallbackUrls(original).slice(0, 2);
    for (const url of candidates) {
      try {
        const resp = await route.fetch({
          url,
          timeout: ROUTE_FETCH_TIMEOUT_MS,
          headers: {
            ...headers,
            referer,
            Referer: referer,
            accept: 'image/avif,image/webp,image/apng,image/*,*/*;q=0.8',
          },
        });
        if (!resp.ok()) continue;
        const body = await resp.body();
        const ct = String(resp.headers()['content-type'] || '').toLowerCase();
        if (!isUsableImage(body, ct)) continue;

        const contentType = ct.split(';')[0].startsWith('image/') ? ct.split(';')[0] : sniffImageType(body);
        const buf = Buffer.from(body);
        rememberImage(ensureImageCache(context), original, { body: buf, contentType });
        if (url !== original) {
          log.step('Evidence image host fallback', { from: shorten(original), to: shorten(url), bytes: buf.length });
        }
        await route.fulfill({
          status: 200,
          headers: { 'content-type': contentType, 'cache-control': 'public, max-age=60' },
          body: buf,
        });
        return;
      } catch {
        // next
      }
    }

    await route.continue().catch(() => route.abort().catch(() => {}));
  };

  await context.route('**/*img2/challans/**', handler);
  await context.route('**/*itmschallan.parivahan.*/**', handler);
}

export async function inlinePageImages(page, challanNumber = '') {
  const cache = ensureImageCache(page.context());
  const started = Date.now();

  await page.waitForTimeout(400).catch(() => {});
  await page
    .evaluate(() => {
      for (const img of document.images) {
        img.loading = 'eager';
        img.scrollIntoView({ block: 'nearest' });
      }
    })
    .catch(() => {});

  await page
    .waitForFunction(
      () => [...document.images].every((img) => img.complete || !(img.getAttribute('src') || img.currentSrc)),
      { timeout: IMAGE_WAIT_MS }
    )
    .catch(() => {
      log.warn('Image load wait timed out — proceeding', { challanNumber, waitedMs: Date.now() - started });
    });

  const imgs = await page.evaluate(() =>
    [...document.images].map((img, index) => ({
      index,
      src: img.currentSrc || img.getAttribute('src') || '',
      naturalWidth: img.naturalWidth || 0,
    }))
  );

  let inlined = 0;
  for (const img of imgs) {
    if (!img.src || img.src.startsWith('data:')) continue;
    if (/no_image/i.test(img.src)) continue;

    let abs = img.src;
    try { abs = new URL(img.src, page.url()).href; } catch { /* keep */ }

    const entry = cache.get(abs) || cache.get(img.src);
    if (!entry) continue;

    const dataUrl = `data:${entry.contentType};base64,${entry.body.toString('base64')}`;
    await page.evaluate(
      ({ index, dataUrl: nextSrc }) => {
        const el = document.images[index];
        if (!el) return;
        el.removeAttribute('srcset');
        el.src = nextSrc;
      },
      { index: img.index, dataUrl }
    );
    inlined += 1;
  }

  log.step('Inlined challan images', {
    total: imgs.length, inlined, cached: cache.size,
    elapsedMs: Date.now() - started, challanNumber,
  });

  await page
    .waitForFunction(() => [...document.images].every((img) => img.complete), { timeout: 2000 })
    .catch(() => {});
}

function hostFallbackUrls(originalSrc) {
  const urls = [originalSrc];
  try {
    const u = new URL(originalSrc);
    const swaps = [];
    if (u.hostname.includes('parivahan.gov.in')) swaps.push(u.hostname.replace('parivahan.gov.in', 'parivahan.nic.in'));
    if (u.hostname.includes('parivahan.nic.in')) swaps.push(u.hostname.replace('parivahan.nic.in', 'parivahan.gov.in'));
    if (u.hostname.startsWith('itmschallan.')) swaps.push(u.hostname.replace('itmschallan.', 'echallan.'));
    if (u.hostname.startsWith('echallan.')) swaps.push(u.hostname.replace('echallan.', 'itmschallan.'));

    for (const host of swaps) {
      const alt = new URL(originalSrc);
      alt.hostname = host;
      urls.push(alt.href);
    }
    if (/\.png$/i.test(u.pathname)) urls.push(originalSrc.replace(/\.png$/i, '.jpg'));
    if (/\.jpe?g$/i.test(u.pathname)) urls.push(originalSrc.replace(/\.jpe?g$/i, '.png'));
  } catch {
    // ignore
  }
  return [...new Set(urls.filter(Boolean))];
}

function rememberImage(cache, url, entry) {
  cache.set(url, entry);
  try {
    const clean = new URL(url);
    clean.hash = '';
    cache.set(clean.href, entry);
    clean.search = '';
    cache.set(clean.href, entry);
  } catch {
    // ignore
  }
}

function isUsableImage(body, contentType = '') {
  if (!body || body.length < 80) return false;
  const ct = String(contentType || '').toLowerCase();
  if (ct.includes('text/html') || ct.includes('application/json')) return false;
  const head = Buffer.from(body).subarray(0, 64).toString('utf8').toLowerCase();
  if (head.includes('<html') || head.includes('<!doctype')) return false;

  const isPng = body[0] === 0x89 && body[1] === 0x50;
  const isJpeg = body[0] === 0xff && body[1] === 0xd8;
  const isGif = body[0] === 0x47 && body[1] === 0x49;
  const isWebp = body[0] === 0x52 && body[1] === 0x49 && body[8] === 0x57;
  return isPng || isJpeg || isGif || isWebp;
}

function sniffImageType(buf) {
  if (buf[0] === 0x89 && buf[1] === 0x50) return 'image/png';
  if (buf[0] === 0xff && buf[1] === 0xd8) return 'image/jpeg';
  if (buf[0] === 0x47 && buf[1] === 0x49) return 'image/gif';
  if (buf[0] === 0x52 && buf[1] === 0x49) return 'image/webp';
  return 'application/octet-stream';
}

function shorten(url) {
  return String(url || '').slice(0, 140);
}
