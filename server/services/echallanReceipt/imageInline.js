import { createLogger } from './logger.js';

const log = createLogger();
const caches = new WeakMap();
const warmedHosts = new WeakMap();

/** Evidence photos can take longer on VPS — prefer images over speed. */
const IMAGE_WAIT_MS = 25000;
const RECOVERY_BUDGET_MS = 60000;
const FETCH_TIMEOUT_MS = 20000;
const TAB_FETCH_TIMEOUT_MS = 25000;
const MIN_EVIDENCE_BYTES = 800;

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
 * Intercept evidence image CDNs used by Parivahan print pages:
 * - echallan.../www/img2/challans/...
 * - itmschallan.parivahan.gov.in/... (HR/ITMS camera photos — main VPS failure)
 */
export async function installChallanImageRoutes(context) {
  ensureImageCache(context);
  await context.unroute('**/*img2/challans/**').catch(() => {});
  await context.unroute('**/*itmschallan.parivahan.*/**').catch(() => {});

  const handler = async (route) => {
    const original = route.request().url();
    // Only intercept image-like evidence URLs (skip HTML/login navigations)
    if (!/\.(png|jpe?g|webp|gif)(\?|$)/i.test(original) && !/img2\/challans|\/storage\/|\/uploads\/|evidence|vehicle|challan.?img/i.test(original)) {
      await route.continue().catch(() => {});
      return;
    }

    const headers = route.request().headers();
    const referer =
      headers.referer ||
      headers.Referer ||
      'https://echallan.parivahan.nic.in/challan/';
    const candidates = hostFallbackUrls(original);

    for (const url of candidates) {
      try {
        const resp = await route.fetch({
          url,
          timeout: FETCH_TIMEOUT_MS,
          headers: {
            ...headers,
            referer,
            Referer: referer,
            accept: 'image/avif,image/webp,image/apng,image/*,*/*;q=0.8',
            Accept: 'image/avif,image/webp,image/apng,image/*,*/*;q=0.8',
          },
        });
        if (!resp.ok()) continue;
        const body = await resp.body();
        const ct = String(resp.headers()['content-type'] || '').toLowerCase();
        if (!isUsableImage(body, ct)) {
          if (looksLikeWafHtml(body, ct)) {
            log.warn('Evidence CDN returned WAF/HTML instead of image', { url: shorten(url) });
          }
          continue;
        }

        const contentType = ct.split(';')[0].startsWith('image/') ? ct.split(';')[0] : sniffImageType(body);
        const buf = Buffer.from(body);
        rememberImage(ensureImageCache(context), original, { body: buf, contentType });
        rememberImage(ensureImageCache(context), url, { body: buf, contentType });
        if (url !== original) {
          log.step('Evidence image host fallback', { from: shorten(original), to: shorten(url), bytes: buf.length });
        }
        await route.fulfill({
          status: 200,
          headers: {
            'content-type': contentType,
            'cache-control': 'public, max-age=60',
          },
          body: buf,
        });
        return;
      } catch {
        // try next host
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
  const referer = page.url();

  await page.waitForTimeout(800).catch(() => {});
  await page
    .evaluate(() => {
      for (const img of document.images) {
        img.loading = 'eager';
        img.decoding = 'sync';
        img.scrollIntoView({ block: 'nearest' });
        const src = img.getAttribute('src') || '';
        if (src && !src.startsWith('data:') && /itmschallan|img2\/challans|vehicle_img/i.test(src)) {
          img.src = src;
        }
      }
    })
    .catch(() => {});

  await page
    .waitForFunction(
      () => {
        const imgs = [...document.images];
        if (!imgs.length) return true;
        return imgs.every((img) => {
          const src = img.getAttribute('src') || img.currentSrc || '';
          if (!src || src.startsWith('data:')) return true;
          return img.complete;
        });
      },
      { timeout: IMAGE_WAIT_MS }
    )
    .catch(() => {
      log.warn('Image load wait timed out — continuing with recovery', {
        challanNumber,
        waitedMs: Date.now() - started,
      });
    });

  // Capture which evidence URLs the page actually requested (incl. itmschallan)
  const pageImageSrcs = await page
    .evaluate(() =>
      [...document.images].map((img) => img.currentSrc || img.getAttribute('src') || '').filter(Boolean)
    )
    .catch(() => []);
  const itmsSrcs = pageImageSrcs.filter((s) => /itmschallan/i.test(s));
  if (itmsSrcs.length) {
    log.step('Detected ITMS evidence image URLs', {
      count: itmsSrcs.length,
      srcs: itmsSrcs.map((s) => String(s).slice(0, 140)),
    });
  }

  await warmImageHosts(page.context(), referer, itmsSrcs);
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

    let abs = img.src;
    try {
      abs = new URL(img.src, page.url()).href;
    } catch {
      // keep original
    }

    // Never bake the "NO IMAGE AVAILABLE" placeholder into the PDF as evidence
    if (/no_image/i.test(abs)) continue;

    let entry = cache.get(abs) || cache.get(img.src);
    if (!entry) {
      entry = await fetchImage(page, abs, referer);
      if (entry) cache.set(abs, entry);
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
    .waitForFunction(() => [...document.images].every((img) => img.complete), { timeout: 5000 })
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
          /150px|img2\/challans|vehicle_img|no_image|itmschallan/i.test(`${src} ${style} ${alt}`) ||
          img.height === 150 ||
          img.clientHeight >= 120,
      };
    })
  );

  // Treat no_image + failed itmschallan/img2 slots as broken (VPS often times out on ITMS CDN)
  const broken = slots.filter((slot) => {
    if (!slot.isEvidence) return false;
    if (slot.src.startsWith('data:')) return false;
    if (/no_image/i.test(slot.src)) return true;
    if (slot.naturalWidth < 8) return true;
    return /img2\/challans|vehicle_img|itmschallan/i.test(slot.src);
  });

  if (!broken.length) return;

  log.step('Recovering missing evidence images', {
    broken: broken.length,
    budgetMs,
    srcs: broken.map((s) => shorten(s.src)),
  });

  let recovered = 0;
  for (const slot of broken) {
    if (Date.now() >= deadline) {
      log.warn('Evidence recovery budget exhausted — continuing without remaining images', {
        remaining: broken.length - broken.indexOf(slot),
        recovered,
        challanNumber,
      });
      break;
    }

    const candidates = candidateImageUrls(challanNumber, slot.src, referer);
    const remainingMs = Math.max(5000, deadline - Date.now());
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

  log.step('Evidence recovery finished', { recovered, broken: broken.length, challanNumber });
}

/**
 * Visit image hosts once so WAF/session cookies are set before photo fetches.
 */
async function warmImageHosts(context, referer = '', itmsSrcs = []) {
  const done = warmedHosts.get(context) || new Set();
  const hosts = [
    'https://echallan.parivahan.gov.in/',
    'https://echallan.parivahan.nic.in/',
    'https://itmschallan.parivahan.gov.in/',
  ];

  // Also warm the origin of any concrete ITMS image URL we already saw
  for (const src of itmsSrcs) {
    try {
      const u = new URL(src);
      hosts.push(`${u.origin}/`);
    } catch {
      // ignore
    }
  }

  for (const host of [...new Set(hosts)]) {
    if (done.has(host)) continue;
    let tab;
    try {
      tab = await context.newPage();
      await tab.setExtraHTTPHeaders({
        Referer: referer || 'https://echallan.parivahan.nic.in/challan/',
        Accept: 'text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,*/*;q=0.8',
      });
      await tab.goto(host, { waitUntil: 'domcontentloaded', timeout: 20000 });
      await tab.waitForTimeout(800).catch(() => {});
      done.add(host);
      log.step('Warmed evidence image host', { host });
    } catch (err) {
      log.warn('Failed to warm evidence image host', { host, error: err?.message || String(err) });
    } finally {
      if (tab) await tab.close().catch(() => {});
    }
  }
  warmedHosts.set(context, done);
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

  for (const url of candidates) {
    if (Date.now() >= deadline) break;

    let entry = cache.get(url) || (await fetchImage(page, url, referer));
    if (!entry) entry = await fetchImageInBrowserTab(page.context(), url, referer);
    if (!entry) entry = await fetchImageViaNode(url, referer);

    if (entry && entry.body.length >= MIN_EVIDENCE_BYTES && isUsableImage(entry.body, entry.contentType)) {
      rememberImage(cache, url, entry);
      return entry;
    }
  }

  return null;
}

function candidateImageUrls(challanNumber, originalSrc = '', pageUrl = '') {
  const id = String(challanNumber || '').replace(/[^A-Za-z0-9]/g, '');
  const state = id.slice(0, 2).toUpperCase();
  const stateLower = state.toLowerCase();
  const urls = [];

  const push = (value) => {
    if (value && !urls.includes(value)) urls.push(value);
  };

  // Always prefer the exact URL the print page used (itmschallan or img2)
  if (originalSrc && !originalSrc.startsWith('data:') && !/no_image/i.test(originalSrc)) {
    try {
      push(new URL(originalSrc, pageUrl || 'https://echallan.parivahan.nic.in/').href);
    } catch {
      push(originalSrc);
    }
    for (const url of hostFallbackUrls(originalSrc)) push(url);
  }

  if (id && state) {
    const echallanHosts = ['https://echallan.parivahan.gov.in', 'https://echallan.parivahan.nic.in'];
    const folders = [state, stateLower];
    const suffixes = [
      '_vehicle_img.png',
      '_vehicle_img.jpg',
      '_img.png',
      '_img.jpg',
      '_doc_img.png',
      '_doc_img.jpg',
      '_challan_img.png',
      '_challan_img.jpg',
    ];
    for (const host of echallanHosts) {
      for (const folder of folders) {
        for (const suffix of suffixes) {
          push(`${host}/www/img2/challans/${folder}/challan/${id}${suffix}`);
          push(`${host}/img2/challans/${folder}/challan/${id}${suffix}`);
        }
      }
    }

    // ITMS-style guesses (HR and other states that host on itmschallan)
    const itmsHosts = ['https://itmschallan.parivahan.gov.in', 'https://itmschallan.parivahan.nic.in'];
    const itmsPaths = [
      `/storage/challan/${id}.jpg`,
      `/storage/challan/${id}.png`,
      `/storage/challans/${id}.jpg`,
      `/storage/${id}.jpg`,
      `/uploads/challan/${id}.jpg`,
      `/uploads/${id}.jpg`,
      `/challan_images/${id}.jpg`,
      `/public/storage/challan/${id}.jpg`,
    ];
    for (const host of itmsHosts) {
      for (const path of itmsPaths) push(`${host}${path}`);
    }
  }

  return urls;
}

function hostFallbackUrls(originalSrc) {
  const urls = [originalSrc];
  try {
    const u = new URL(originalSrc);
    const alts = new Set();

    if (u.hostname.includes('parivahan.gov.in')) {
      alts.add(u.hostname.replace('parivahan.gov.in', 'parivahan.nic.in'));
    }
    if (u.hostname.includes('parivahan.nic.in')) {
      alts.add(u.hostname.replace('parivahan.nic.in', 'parivahan.gov.in'));
    }
    // Cross-swap itmschallan ↔ echallan keeping the path when possible
    if (u.hostname.startsWith('itmschallan.')) {
      alts.add(u.hostname.replace('itmschallan.', 'echallan.'));
    }
    if (u.hostname.startsWith('echallan.')) {
      alts.add(u.hostname.replace('echallan.', 'itmschallan.'));
    }

    for (const host of alts) {
      const alt = new URL(originalSrc);
      alt.hostname = host;
      // Prefer non-gov / alternate host first for VPS blocks
      if (u.hostname.includes('gov.in') || u.hostname.includes('itmschallan')) {
        urls.unshift(alt.href);
      } else {
        urls.push(alt.href);
      }
      if (/\.png$/i.test(u.pathname)) {
        urls.push(alt.href.replace(/\.png$/i, '.jpg'));
        urls.push(originalSrc.replace(/\.png$/i, '.jpg'));
      }
      if (/\.jpe?g$/i.test(u.pathname)) {
        urls.push(alt.href.replace(/\.jpe?g$/i, '.png'));
        urls.push(originalSrc.replace(/\.jpe?g$/i, '.png'));
      }
    }
  } catch {
    // ignore
  }
  return [...new Set(urls.filter(Boolean))];
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
    // ignore invalid urls
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

  const ct = String(contentType || '').toLowerCase();
  if (ct.includes('application/json')) return false;

  const isPng = body[0] === 0x89 && body[1] === 0x50;
  const isJpeg = body[0] === 0xff && body[1] === 0xd8;
  const isGif = body[0] === 0x47 && body[1] === 0x49;
  const isWebp = body[0] === 0x52 && body[1] === 0x49 && body[8] === 0x57;
  if (!(isPng || isJpeg || isGif || isWebp)) return false;

  return true;
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
