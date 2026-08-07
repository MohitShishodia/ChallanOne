import { createLogger } from './logger.js';

const log = createLogger();
const caches = new WeakMap();

/**
 * VPS datacenter IPs are often blocked by itmschallan / echallan.gov.in camera CDNs
 * (ERR_CONNECTION_RESET / timeout) while local IPs work. We:
 * 1) rewrite <img> src through a public image proxy so Chromium can load them
 * 2) recover/fetch via proxy candidates and inline as data URLs for page.pdf()
 */
const IMAGE_WAIT_MS = 12000;
const RECOVERY_BUDGET_MS = 45000;
const FETCH_TIMEOUT_MS = 15000;
const TAB_FETCH_TIMEOUT_MS = 15000;
const MIN_EVIDENCE_BYTES = 800;

const IMAGE_PROXIES = [
  (url) => `https://wsrv.nl/?url=${encodeURIComponent(url)}&output=jpg`,
  (url) => `https://images.weserv.nl/?url=${encodeURIComponent(url)}&output=jpg`,
];

function isEvidenceSrc(src = '') {
  return /itmschallan|img2\/challans|vehicle_img|no_image|\/storage\/|\/uploads\//i.test(src);
}

function proxyUrlsFor(originalUrl) {
  if (!originalUrl || originalUrl.startsWith('data:') || /no_image|wsrv\.nl|weserv\.nl/i.test(originalUrl)) {
    return [];
  }
  return IMAGE_PROXIES.map((fn) => fn(originalUrl));
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
 * Intercept evidence CDNs. On VPS, fulfill from proxy when direct CDN is blocked.
 */
export async function installChallanImageRoutes(context) {
  ensureImageCache(context);
  await context.unroute('**/*img2/challans/**').catch(() => {});
  await context.unroute('**/*itmschallan.parivahan.*/**').catch(() => {});

  const handler = async (route) => {
    const original = route.request().url();
    if (
      !/\.(png|jpe?g|webp|gif)(\?|$)/i.test(original) &&
      !/img2\/challans|\/storage\/|\/uploads\/|evidence|vehicle|challan.?img/i.test(original)
    ) {
      await route.continue().catch(() => {});
      return;
    }

    const headers = route.request().headers();
    const referer =
      headers.referer || headers.Referer || 'https://echallan.parivahan.nic.in/challan/';

    const candidates = [
      ...hostFallbackUrls(original),
      ...proxyUrlsFor(original),
    ];

    for (const url of candidates) {
      const entry = await fetchBytes(context, url, referer, headers);
      if (!entry) continue;

      rememberImage(ensureImageCache(context), original, entry);
      rememberImage(ensureImageCache(context), url, entry);
      if (url !== original) {
        log.step('Evidence image fulfilled', {
          from: shorten(original),
          via: shorten(url),
          bytes: entry.body.length,
        });
      }
      await route.fulfill({
        status: 200,
        headers: {
          'content-type': entry.contentType,
          'cache-control': 'public, max-age=60',
        },
        body: entry.body,
      });
      return;
    }

    await route.continue().catch(() => route.abort().catch(() => {}));
  };

  await context.route('**/*img2/challans/**', handler);
  await context.route('**/*itmschallan.parivahan.*/**', handler);
}

export async function inlinePageImages(page, challanNumber = '') {
  const cache = ensureImageCache(page.context());
  const started = Date.now();
  const referer = page.url();

  await page.waitForTimeout(500).catch(() => {});

  // Rewrite blocked CDN URLs through image proxy BEFORE waiting — this is the VPS fix
  const rewrite = await page
    .evaluate(() => {
      const changed = [];
      for (const img of document.images) {
        const src = img.getAttribute('src') || img.currentSrc || '';
        if (!src || src.startsWith('data:')) continue;
        if (/no_image/i.test(src)) continue;
        if (!/itmschallan|img2\/challans|vehicle_img|\/storage\/|\/uploads\//i.test(src)) continue;
        if (/wsrv\.nl|weserv\.nl/i.test(src)) continue;

        let abs = src;
        try {
          abs = new URL(src, location.href).href;
        } catch {
          // keep
        }
        const proxied = `https://wsrv.nl/?url=${encodeURIComponent(abs)}&output=jpg`;
        img.removeAttribute('srcset');
        img.loading = 'eager';
        img.decoding = 'sync';
        img.src = proxied;
        changed.push({ from: abs.slice(0, 120), to: proxied.slice(0, 120) });
      }
      return changed;
    })
    .catch(() => []);

  if (rewrite?.length) {
    log.step('Rewrote evidence images through proxy', { count: rewrite.length, samples: rewrite.slice(0, 3) });
  }

  await page
    .evaluate(() => {
      for (const img of document.images) {
        img.scrollIntoView({ block: 'nearest' });
      }
    })
    .catch(() => {});

  await page
    .waitForFunction(
      () => {
        const imgs = [...document.images].filter((img) => {
          const src = img.getAttribute('src') || img.currentSrc || '';
          return src && !src.startsWith('data:') && /itmschallan|img2\/challans|wsrv\.nl|weserv|vehicle_img/i.test(src);
        });
        if (!imgs.length) return true;
        return imgs.every((img) => img.complete && img.naturalWidth > 2);
      },
      { timeout: IMAGE_WAIT_MS }
    )
    .catch(() => {
      log.warn('Image load wait timed out — continuing with recovery', {
        challanNumber,
        waitedMs: Date.now() - started,
      });
    });

  const pageImageSrcs = await page
    .evaluate(() =>
      [...document.images].map((img) => img.currentSrc || img.getAttribute('src') || '').filter(Boolean)
    )
    .catch(() => []);
  const evidenceSrcs = pageImageSrcs.filter((s) => isEvidenceSrc(s) || /wsrv\.nl|weserv/i.test(s));
  if (evidenceSrcs.length) {
    log.step('Evidence image URLs on page', {
      count: evidenceSrcs.length,
      srcs: evidenceSrcs.map((s) => String(s).slice(0, 140)),
    });
  }

  // Do NOT warm itmschallan/gov.in from VPS — those navigations hang and waste the budget.
  await recoverMissingEvidenceImages(page, challanNumber, RECOVERY_BUDGET_MS);

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
    try {
      abs = new URL(img.src, page.url()).href;
    } catch {
      // keep
    }

    let entry = cache.get(abs) || cache.get(img.src);
    if (!entry) {
      entry = await fetchImage(page, abs, referer);
      if (entry) cache.set(abs, entry);
    }
    if (!entry && isEvidenceSrc(abs)) {
      for (const proxyUrl of proxyUrlsFor(unwrapProxyUrl(abs))) {
        entry = await fetchImage(page, proxyUrl, referer);
        if (entry) break;
        entry = await fetchImageViaNode(proxyUrl, referer);
        if (entry) break;
      }
    }

    if (!entry && img.naturalWidth > 2) {
      const shot = await page
        .locator('img')
        .nth(img.index)
        .screenshot({ type: 'png' })
        .catch(() => null);
      if (shot?.length > MIN_EVIDENCE_BYTES && isUsableImage(shot, 'image/png')) {
        entry = { body: Buffer.from(shot), contentType: 'image/png' };
      }
    }

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
    total: imgs.length,
    inlined,
    cached: cache.size,
    withPixels: imgs.filter((i) => i.naturalWidth > 2).length,
    elapsedMs: Date.now() - started,
    challanNumber,
  });

  await page
    .waitForFunction(() => [...document.images].every((img) => img.complete), { timeout: 4000 })
    .catch(() => {});
}

async function recoverMissingEvidenceImages(page, challanNumber, budgetMs = RECOVERY_BUDGET_MS) {
  const deadline = Date.now() + budgetMs;
  const referer = page.url();
  const slots = await page.evaluate(() =>
    [...document.images].map((img, index) => {
      const src = img.currentSrc || img.getAttribute('src') || '';
      const style = `${img.getAttribute('style') || ''} ${img.className || ''}`;
      const alt = img.getAttribute('alt') || '';
      return {
        index,
        src,
        naturalWidth: img.naturalWidth || 0,
        isEvidence:
          /150px|img2\/challans|vehicle_img|no_image|itmschallan|wsrv\.nl|weserv|\/storage\//i.test(
            `${src} ${style} ${alt}`
          ) ||
          img.height === 150 ||
          img.clientHeight >= 120,
      };
    })
  );

  const broken = slots.filter((slot) => {
    if (!slot.isEvidence) return false;
    if (slot.src.startsWith('data:')) return false;
    if (/no_image/i.test(slot.src)) return true;
    return slot.naturalWidth < 8;
  });

  if (!broken.length) {
    log.step('No broken evidence slots — images already loaded');
    return;
  }

  log.step('Recovering missing evidence images', {
    broken: broken.length,
    budgetMs,
    srcs: broken.map((s) => shorten(s.src)),
  });

  let recovered = 0;
  // Recover in parallel (max 3) — serial was too slow on VPS timeouts
  const queue = [...broken];
  const workers = Array.from({ length: Math.min(3, queue.length) }, async () => {
    while (queue.length && Date.now() < deadline) {
      const slot = queue.shift();
      if (!slot) break;
      const original = unwrapProxyUrl(slot.src);
      const candidates = candidateImageUrls(challanNumber, original, referer);
      const remainingMs = Math.max(4000, deadline - Date.now());
      const entry = await raceFirstImage(page, candidates, remainingMs, referer);
      if (!entry) {
        log.warn('Could not recover evidence image slot', { index: slot.index, src: shorten(slot.src) });
        continue;
      }
      const dataUrl = `data:${entry.contentType};base64,${entry.body.toString('base64')}`;
      await page.evaluate(
        ({ index, dataUrl: nextSrc }) => {
          const el = document.images[index];
          if (!el) return;
          el.removeAttribute('srcset');
          el.src = nextSrc;
        },
        { index: slot.index, dataUrl }
      );
      recovered += 1;
      log.step('Recovered evidence image', { index: slot.index, bytes: entry.body.length });
    }
  });

  await Promise.all(workers);

  if (queue.length) {
    log.warn('Evidence recovery budget exhausted — continuing without remaining images', {
      remaining: queue.length,
      recovered,
      challanNumber,
    });
  }

  log.step('Evidence recovery finished', { recovered, broken: broken.length, challanNumber });
}

async function raceFirstImage(page, candidates, budgetMs, referer) {
  if (!candidates.length) return null;
  const cache = ensureImageCache(page.context());
  const deadline = Date.now() + budgetMs;

  for (const url of candidates) {
    const hit = cache.get(url);
    if (hit && hit.body.length >= MIN_EVIDENCE_BYTES && isUsableImage(hit.body, hit.contentType)) {
      return hit;
    }
  }

  // Try in small parallel batches
  for (let i = 0; i < candidates.length; i += 3) {
    if (Date.now() >= deadline) break;
    const batch = candidates.slice(i, i + 3);
    const results = await Promise.all(
      batch.map(async (url) => {
        let entry = cache.get(url) || (await fetchImage(page, url, referer));
        if (!entry) entry = await fetchImageViaNode(url, referer);
        if (!entry) entry = await fetchImageInBrowserTab(page.context(), url, referer);
        if (entry && entry.body.length >= MIN_EVIDENCE_BYTES && isUsableImage(entry.body, entry.contentType)) {
          rememberImage(cache, url, entry);
          return entry;
        }
        return null;
      })
    );
    const found = results.find(Boolean);
    if (found) return found;
  }

  return null;
}

function candidateImageUrls(challanNumber, originalSrc = '', pageUrl = '') {
  const id = String(challanNumber || '').replace(/[^A-Za-z0-9]/g, '');
  const state = id.slice(0, 2).toUpperCase();
  const urls = [];
  const push = (value) => {
    if (value && !urls.includes(value)) urls.push(value);
  };

  const raw = unwrapProxyUrl(originalSrc);

  if (raw && !raw.startsWith('data:') && !/no_image/i.test(raw)) {
    try {
      push(new URL(raw, pageUrl || 'https://echallan.parivahan.nic.in/').href);
    } catch {
      push(raw);
    }
    for (const url of hostFallbackUrls(raw)) push(url);
    // Proxy variants FIRST for VPS (direct CDN often blocked)
    for (const url of proxyUrlsFor(raw)) urls.unshift(url);
  }

  if (id && state) {
    for (const host of ['https://echallan.parivahan.gov.in', 'https://echallan.parivahan.nic.in']) {
      for (const suffix of ['_vehicle_img.png', '_vehicle_img.jpg', '_img.jpg', '_img.png']) {
        const u = `${host}/www/img2/challans/${state}/challan/${id}${suffix}`;
        push(u);
        for (const p of proxyUrlsFor(u)) push(p);
      }
    }
  }

  return [...new Set(urls)];
}

function unwrapProxyUrl(src = '') {
  try {
    const u = new URL(src, 'https://echallan.parivahan.nic.in/');
    if (/wsrv\.nl|weserv\.nl/i.test(u.hostname)) {
      const inner = u.searchParams.get('url');
      if (inner) return inner;
    }
    return u.href;
  } catch {
    return src;
  }
}

function hostFallbackUrls(originalSrc) {
  const urls = [originalSrc];
  try {
    const u = new URL(originalSrc);
    const alts = new Set();
    if (u.hostname.includes('parivahan.gov.in')) alts.add(u.hostname.replace('parivahan.gov.in', 'parivahan.nic.in'));
    if (u.hostname.includes('parivahan.nic.in')) alts.add(u.hostname.replace('parivahan.nic.in', 'parivahan.gov.in'));
    if (u.hostname.startsWith('itmschallan.')) alts.add(u.hostname.replace('itmschallan.', 'echallan.'));
    if (u.hostname.startsWith('echallan.')) alts.add(u.hostname.replace('echallan.', 'itmschallan.'));

    for (const host of alts) {
      const alt = new URL(originalSrc);
      alt.hostname = host;
      urls.push(alt.href);
      if (/\.png$/i.test(u.pathname)) urls.push(alt.href.replace(/\.png$/i, '.jpg'));
      if (/\.jpe?g$/i.test(u.pathname)) urls.push(alt.href.replace(/\.jpe?g$/i, '.png'));
    }
  } catch {
    // ignore
  }
  return [...new Set(urls.filter(Boolean))];
}

async function fetchBytes(context, url, referer, headers = {}) {
  try {
    const resp = await context.request.get(url, {
      timeout: FETCH_TIMEOUT_MS,
      headers: {
        ...headers,
        Referer: referer,
        Accept: 'image/avif,image/webp,image/apng,image/*,*/*;q=0.8',
      },
    });
    if (!resp.ok()) return null;
    const body = Buffer.from(await resp.body());
    const ct = String(resp.headers()['content-type'] || '').toLowerCase();
    if (!isUsableImage(body, ct)) return null;
    return {
      body,
      contentType: ct.split(';')[0].startsWith('image/') ? ct.split(';')[0] : sniffImageType(body),
    };
  } catch {
    return null;
  }
}

async function fetchImageInBrowserTab(context, url, referer) {
  let tab;
  try {
    tab = await context.newPage();
    await tab.setExtraHTTPHeaders({
      Referer: referer || 'https://echallan.parivahan.nic.in/challan/',
      Accept: 'image/avif,image/webp,image/apng,image/*,*/*;q=0.8',
    });
    const resp = await tab.goto(url, { waitUntil: 'load', timeout: TAB_FETCH_TIMEOUT_MS });
    if (!resp || !resp.ok()) return null;
    const body = Buffer.from(await resp.body());
    const ct = String(resp.headers()['content-type'] || '').toLowerCase();
    if (!isUsableImage(body, ct)) return null;
    const entry = {
      body,
      contentType: ct.split(';')[0].startsWith('image/') ? ct.split(';')[0] : sniffImageType(body),
    };
    rememberImage(ensureImageCache(context), url, entry);
    return entry;
  } catch {
    return null;
  } finally {
    if (tab) await tab.close().catch(() => {});
  }
}

async function fetchImage(page, url, referer = '') {
  try {
    const resp = await page.request.get(url, {
      timeout: FETCH_TIMEOUT_MS,
      headers: {
        Referer: referer || page.url(),
        Accept: 'image/avif,image/webp,image/apng,image/*,*/*;q=0.8',
      },
    });
    if (!resp.ok()) return null;
    const body = Buffer.from(await resp.body());
    const ct = String(resp.headers()['content-type'] || '').split(';')[0].toLowerCase();
    if (!isUsableImage(body, ct)) return null;
    return {
      body,
      contentType: ct.startsWith('image/') ? ct : sniffImageType(body),
    };
  } catch {
    return null;
  }
}

async function fetchImageViaNode(url, referer = '') {
  try {
    const headers = {
      'User-Agent':
        'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
      Referer: referer || 'https://echallan.parivahan.nic.in/challan/',
      Accept: 'image/avif,image/webp,image/apng,image/*,*/*;q=0.8',
    };

    const proxy = process.env.CHALLAN_IMAGE_PROXY || process.env.HTTPS_PROXY || process.env.HTTP_PROXY || '';
    let dispatcher;
    if (proxy) {
      try {
        const { ProxyAgent } = await import('undici');
        dispatcher = new ProxyAgent(proxy);
      } catch {
        log.warn('Proxy set but undici ProxyAgent unavailable');
      }
    }

    const resp = await fetch(url, {
      headers,
      signal: AbortSignal.timeout(FETCH_TIMEOUT_MS),
      ...(dispatcher ? { dispatcher } : {}),
      redirect: 'follow',
    });
    if (!resp.ok) return null;
    const body = Buffer.from(await resp.arrayBuffer());
    const ct = String(resp.headers.get('content-type') || '').toLowerCase();
    if (!isUsableImage(body, ct)) return null;
    return {
      body,
      contentType: ct.split(';')[0].startsWith('image/') ? ct.split(';')[0] : sniffImageType(body),
    };
  } catch {
    return null;
  }
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

function looksLikeWafHtml(body, contentType = '') {
  const ct = String(contentType || '').toLowerCase();
  if (ct.includes('text/html')) return true;
  if (!body || body.length < 20) return false;
  const head = Buffer.from(body).subarray(0, 64).toString('utf8').toLowerCase();
  return head.includes('<html') || head.includes('<!doctype');
}

function isUsableImage(body, contentType = '') {
  if (!body || body.length < 80) return false;
  if (looksLikeWafHtml(body, contentType)) return false;
  if (String(contentType || '').toLowerCase().includes('application/json')) return false;

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
