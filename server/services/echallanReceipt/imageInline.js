import { request as pwRequest } from 'playwright';
import { createLogger } from './logger.js';

const log = createLogger();
const caches = new WeakMap();

const DIRECT_FETCH_TIMEOUT = 5000;
const PROXY_FETCH_TIMEOUT = 9000;
const IMAGE_SETTLE_MS = 8000;

/**
 * itmschallan.parivahan.gov.in (the evidence-photo CDN) blackholes datacenter
 * IP ranges — verified: a residential IP gets an instant response while
 * Cloudflare's network times out. Public image proxies all run on datacenter
 * IPs, so they cannot help for that host.
 *
 * Set CHALLAN_IMAGE_PROXY to an Indian/residential HTTP proxy to fix it:
 *   CHALLAN_IMAGE_PROXY=http://user:pass@host:port
 */
const IMAGE_PROXY = process.env.CHALLAN_IMAGE_PROXY || '';

let proxyRequestContext = null;
let proxyRequestContextPromise = null;

async function getProxyRequestContext() {
  if (!IMAGE_PROXY) return null;
  if (proxyRequestContext) return proxyRequestContext;
  if (!proxyRequestContextPromise) {
    proxyRequestContextPromise = pwRequest
      .newContext({
        proxy: { server: IMAGE_PROXY },
        ignoreHTTPSErrors: true,
        timeout: PROXY_FETCH_TIMEOUT,
      })
      .then((ctx) => {
        proxyRequestContext = ctx;
        log.step('Image proxy enabled', { proxy: IMAGE_PROXY.replace(/\/\/[^@]*@/, '//***@') });
        return ctx;
      })
      .catch((err) => {
        log.warn('Failed to create image proxy context', err.message);
        return null;
      });
  }
  return proxyRequestContextPromise;
}

/**
 * Public image proxies. These only help for hosts that allow datacenter IPs
 * (echallan.parivahan.*). They cannot reach itmschallan.parivahan.gov.in.
 */
function proxyUrls(originalUrl) {
  const encoded = encodeURIComponent(originalUrl);
  return [`https://wsrv.nl/?url=${encoded}`];
}

function isEvidenceUrl(url) {
  return /img2\/challans|\/storage\/|evidence|vehicle|challan.?img|PushPhoto|itmschallan\.|echallan\./i.test(url);
}

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
 * Intercept evidence CDN requests. Strategy per image:
 * 1. Direct fetch to original URL (4s)
 * 2. Host-swap fallback (.gov.in ↔ .nic.in) (4s)
 * 3. wsrv.nl image proxy — Cloudflare edge bypasses CDN IP blocks (8s)
 *
 * All images load in parallel via Playwright route handlers, so the total
 * added time is ~8s (the slowest single proxy call), not 8s × N images.
 */
export async function installChallanImageRoutes(context) {
  ensureImageCache(context);
  await context.unroute('**/*img2/challans/**').catch(() => {});
  await context.unroute('**/*itmschallan.parivahan.*/**').catch(() => {});
  await context.unroute('**/*echallan.parivahan.*/**/*PushPhoto*').catch(() => {});

  const handler = async (route) => {
    const original = route.request().url();
    if (
      !/\.(png|jpe?g|webp|gif)(\?|$)/i.test(original) &&
      !isEvidenceUrl(original)
    ) {
      await route.continue().catch(() => {});
      return;
    }

    const headers = route.request().headers();
    const referer =
      headers.referer || headers.Referer || 'https://echallan.parivahan.nic.in/challan/';
    const fetchHeaders = {
      ...headers,
      referer,
      Referer: referer,
      accept: 'image/avif,image/webp,image/apng,image/*,*/*;q=0.8',
    };

    // --- Step 1 & 2: Direct + host-swap ---
    const directCandidates = hostFallbackUrls(original);
    for (const url of directCandidates) {
      const result = await tryFetchImage(route, url, DIRECT_FETCH_TIMEOUT, fetchHeaders);
      if (result) {
        rememberImage(ensureImageCache(context), original, result);
        await route.fulfill({
          status: 200,
          headers: { 'content-type': result.contentType, 'cache-control': 'public, max-age=300' },
          body: result.body,
        });
        return;
      }
    }

    // --- Step 3: Configured HTTP proxy (the only thing that works for
    // itmschallan.parivahan.gov.in, which blocks datacenter IPs) ---
    const viaProxy = await fetchThroughConfiguredProxy(original, referer);
    if (viaProxy) {
      log.step('Evidence image via configured proxy', {
        url: shorten(original), bytes: viaProxy.body.length,
      });
      rememberImage(ensureImageCache(context), original, viaProxy);
      await route.fulfill({
        status: 200,
        headers: { 'content-type': viaProxy.contentType, 'cache-control': 'public, max-age=300' },
        body: viaProxy.body,
      });
      return;
    }

    // --- Step 4: Public image proxy (helps only for echallan.* hosts) ---
    for (const pUrl of proxyUrls(original)) {
      const result = await tryFetchImage(route, pUrl, PROXY_FETCH_TIMEOUT, { accept: 'image/*' });
      if (result) {
        log.step('Evidence image via public proxy', { url: shorten(original), bytes: result.body.length });
        rememberImage(ensureImageCache(context), original, result);
        await route.fulfill({
          status: 200,
          headers: { 'content-type': result.contentType, 'cache-control': 'public, max-age=300' },
          body: result.body,
        });
        return;
      }
    }

    log.warn('Evidence image unreachable — CDN is blocking this server IP', { url: shorten(original) });

    // All strategies failed — let the browser show broken image
    await route.continue().catch(() => route.abort().catch(() => {}));
  };

  await context.route('**/*img2/challans/**', handler);
  await context.route('**/*itmschallan.parivahan.*/**', handler);
  await context.route('**/*PushPhoto*', handler);
}

async function fetchThroughConfiguredProxy(url, referer) {
  const ctx = await getProxyRequestContext();
  if (!ctx) return null;
  try {
    const resp = await ctx.get(url, {
      timeout: PROXY_FETCH_TIMEOUT,
      headers: { Referer: referer, Accept: 'image/avif,image/webp,image/*,*/*;q=0.8' },
    });
    if (!resp.ok()) return null;
    const body = Buffer.from(await resp.body());
    const ct = String(resp.headers()['content-type'] || '').split(';')[0].toLowerCase();
    if (!isUsableImage(body, ct)) return null;
    return { body, contentType: ct.startsWith('image/') ? ct : sniffImageType(body) };
  } catch {
    return null;
  }
}

async function tryFetchImage(route, url, timeout, headers) {
  try {
    const resp = await route.fetch({ url, timeout, headers });
    if (!resp.ok()) return null;
    const body = await resp.body();
    const ct = String(resp.headers()['content-type'] || '').toLowerCase();
    if (!isUsableImage(body, ct)) return null;
    const contentType = ct.split(';')[0].startsWith('image/') ? ct.split(';')[0] : sniffImageType(body);
    return { body: Buffer.from(body), contentType };
  } catch {
    return null;
  }
}

/**
 * Inline images into the page as data: URIs for page.pdf().
 *
 * 1. Wait briefly for images to settle (route handler proxies run in parallel)
 * 2. Inline every image found in the response cache
 * 3. For evidence images NOT cached, try one last fetch through proxy
 */
export async function inlinePageImages(page, challanNumber = '') {
  const cache = ensureImageCache(page.context());
  const started = Date.now();

  // Let route-handler proxy fetches complete — they run in parallel during page load
  await page
    .waitForFunction(
      () => [...document.images].every((img) => img.complete || !(img.getAttribute('src') || img.currentSrc)),
      { timeout: IMAGE_SETTLE_MS }
    )
    .catch(() => {});

  const imgs = await page.evaluate(() =>
    [...document.images].map((img, index) => ({
      index,
      src: img.currentSrc || img.getAttribute('src') || '',
      naturalWidth: img.naturalWidth || 0,
    }))
  ).catch(() => []);

  let inlined = 0;
  const missed = [];

  for (const img of imgs) {
    if (!img.src || img.src.startsWith('data:')) continue;
    if (/no_image/i.test(img.src)) {
      if (isEvidenceUrl(img.src)) missed.push(img);
      continue;
    }

    let abs = img.src;
    try { abs = new URL(img.src, page.url()).href; } catch { /* keep */ }

    const entry = cache.get(abs) || cache.get(img.src);
    if (entry) {
      await setImageSrc(page, img.index, entry);
      inlined += 1;
    } else if (img.naturalWidth < 2 && isEvidenceUrl(abs)) {
      missed.push({ ...img, abs });
    }
  }

  // Last-chance recovery for evidence images that the route handler missed
  if (missed.length > 0) {
    log.step('Recovering missing evidence images via proxy', { count: missed.length });
    const recovered = await recoverViaProxy(page, missed, cache);
    inlined += recovered;
  }

  log.step('Inlined challan images', {
    total: imgs.length, inlined, missed: missed.length,
    cached: cache.size, elapsedMs: Date.now() - started, challanNumber,
  });
}

/**
 * For each missed evidence image, try fetching through wsrv.nl using
 * Playwright's request API. All fetches run in parallel with a 6s budget.
 */
async function recoverViaProxy(page, missedImages, cache) {
  let recovered = 0;

  const tasks = missedImages.map(async (img) => {
    const originalUrl = img.abs || img.src;
    if (!originalUrl || /no_image/i.test(originalUrl)) return;

    const viaProxy = await fetchThroughConfiguredProxy(originalUrl, page.url());
    if (viaProxy) {
      cache.set(originalUrl, viaProxy);
      await setImageSrc(page, img.index, viaProxy);
      recovered += 1;
      return;
    }

    for (const pUrl of proxyUrls(originalUrl)) {
      try {
        const resp = await page.request.get(pUrl, {
          timeout: 6000,
          headers: { Accept: 'image/*' },
        });
        if (!resp.ok()) continue;
        const body = Buffer.from(await resp.body());
        const ct = String(resp.headers()['content-type'] || '').split(';')[0].toLowerCase();
        if (!isUsableImage(body, ct)) continue;

        const contentType = ct.startsWith('image/') ? ct : sniffImageType(body);
        const entry = { body, contentType };
        cache.set(originalUrl, entry);
        await setImageSrc(page, img.index, entry);
        recovered += 1;
        log.step('Recovered evidence image', { index: img.index, bytes: body.length, proxy: shorten(pUrl) });
        return;
      } catch {
        // next proxy
      }
    }
  });

  await Promise.allSettled(tasks);
  return recovered;
}

async function setImageSrc(page, index, entry) {
  const dataUrl = `data:${entry.contentType};base64,${entry.body.toString('base64')}`;
  await page.evaluate(
    ({ idx, src }) => {
      const el = document.images[idx];
      if (!el) return;
      el.removeAttribute('srcset');
      el.src = src;
    },
    { idx: index, src: dataUrl }
  ).catch(() => {});
}

function hostFallbackUrls(originalSrc) {
  const urls = [originalSrc];
  try {
    const u = new URL(originalSrc);
    if (u.hostname.includes('parivahan.gov.in')) {
      const alt = new URL(originalSrc);
      alt.hostname = u.hostname.replace('parivahan.gov.in', 'parivahan.nic.in');
      urls.push(alt.href);
    } else if (u.hostname.includes('parivahan.nic.in')) {
      const alt = new URL(originalSrc);
      alt.hostname = u.hostname.replace('parivahan.nic.in', 'parivahan.gov.in');
      urls.push(alt.href);
    }
  } catch {
    // ignore
  }
  return urls;
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
  return String(url || '').slice(0, 120);
}
