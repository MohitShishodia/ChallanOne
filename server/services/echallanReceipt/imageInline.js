import { createLogger } from './logger.js';

const log = createLogger();
const caches = new WeakMap();

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
      if (!body || body.length < 40) return;

      const contentType = (ct.split(';')[0] || 'image/png').startsWith('image/')
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
 * On VPS the .gov.in photo CDN often 403s while .nic.in (or the other host) works.
 * Retry those evidence image requests across hosts/extensions.
 */
export async function installChallanImageRoutes(context) {
  ensureImageCache(context);
  await context.unroute('**/*img2/challans/**').catch(() => {});

  await context.route('**/*img2/challans/**', async (route) => {
    const original = route.request().url();
    const headers = route.request().headers();
    const candidates = hostFallbackUrls(original);

    for (const url of candidates) {
      try {
        const resp = await route.fetch({
          url,
          timeout: 20000,
          headers: {
            ...headers,
            referer: headers.referer || headers.Referer || 'https://echallan.parivahan.nic.in/challan/',
            accept: 'image/avif,image/webp,image/apng,image/*,*/*;q=0.8',
          },
        });
        if (!resp.ok()) continue;
        const body = await resp.body();
        const ct = String(resp.headers()['content-type'] || '').toLowerCase();
        if (!isUsableImage(body, ct)) continue;

        const contentType = ct.split(';')[0].startsWith('image/') ? ct.split(';')[0] : sniffImageType(body);
        rememberImage(ensureImageCache(context), original, { body: Buffer.from(body), contentType });
        rememberImage(ensureImageCache(context), url, { body: Buffer.from(body), contentType });
        if (url !== original) {
          log.step('Evidence image host fallback', { from: shorten(original), to: shorten(url), bytes: body.length });
        }
        await route.fulfill({
          status: 200,
          headers: {
            'content-type': contentType,
            'cache-control': 'public, max-age=60',
          },
          body,
        });
        return;
      } catch {
        // try next host
      }
    }

    await route.continue().catch(() => route.abort().catch(() => {}));
  });
}

export async function inlinePageImages(page, challanNumber = '') {
  const cache = ensureImageCache(page.context());

  await page.waitForTimeout(1500).catch(() => {});
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
      { timeout: 25000 }
    )
    .catch(() => {});

  await recoverMissingEvidenceImages(page, challanNumber);

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

    let entry = cache.get(abs) || cache.get(img.src);
    if (!entry) {
      entry = await fetchImage(page, abs);
      if (entry) cache.set(abs, entry);
    }

    if (!entry && img.naturalWidth > 2) {
      const shot = await page
        .locator('img')
        .nth(img.index)
        .screenshot({ type: 'png' })
        .catch(() => null);
      if (shot?.length) {
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
    challanNumber,
  });

  await page
    .waitForFunction(() => [...document.images].every((img) => img.complete), { timeout: 8000 })
    .catch(() => {});
}

async function recoverMissingEvidenceImages(page, challanNumber) {
  const slots = await page.evaluate(() =>
    [...document.images].map((img, index) => {
      const src = img.currentSrc || img.getAttribute('src') || '';
      const style = `${img.getAttribute('style') || ''} ${img.className || ''}`;
      return {
        index,
        src,
        naturalWidth: img.naturalWidth || 0,
        isEvidence:
          /150px|img2\/challans|vehicle_img|no_image/i.test(`${src} ${style}`) ||
          img.height === 150 ||
          img.clientHeight >= 120,
      };
    })
  );

  const broken = slots.filter((slot) => {
    if (!slot.isEvidence) return false;
    if (slot.src.startsWith('data:')) return false;
    if (/no_image/i.test(slot.src) && slot.naturalWidth > 2) return false;
    return slot.naturalWidth < 8 || /img2\/challans|vehicle_img/i.test(slot.src);
  });

  if (!broken.length) return;

  log.step('Recovering missing evidence images', {
    broken: broken.length,
    srcs: broken.map((s) => shorten(s.src)),
  });

  for (const slot of broken) {
    const candidates = candidateImageUrls(challanNumber, slot.src, page.url());
    let entry = null;
    for (const url of candidates) {
      entry = ensureImageCache(page.context()).get(url) || (await fetchImage(page, url));
      if (!entry) entry = await fetchImageInBrowserTab(page.context(), url, page.url());
      if (entry && entry.body.length > 800) break;
      entry = null;
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
      { index: slot.index, dataUrl }
    );
    log.step('Recovered evidence image', { index: slot.index, bytes: entry.body.length });
  }
}

function candidateImageUrls(challanNumber, originalSrc = '', pageUrl = '') {
  const id = String(challanNumber || '').replace(/[^A-Za-z0-9]/g, '');
  const state = id.slice(0, 2).toUpperCase();
  const urls = [];

  const push = (value) => {
    if (value && !urls.includes(value)) urls.push(value);
  };

  if (originalSrc && !originalSrc.startsWith('data:') && !/no_image/i.test(originalSrc)) {
    try {
      push(new URL(originalSrc, pageUrl || 'https://echallan.parivahan.nic.in/').href);
    } catch {
      push(originalSrc);
    }
    for (const url of hostFallbackUrls(originalSrc)) push(url);
  }

  if (id && state) {
    for (const host of ['https://echallan.parivahan.gov.in', 'https://echallan.parivahan.nic.in']) {
      for (const suffix of [
        '_vehicle_img.png',
        '_vehicle_img.jpg',
        '_img.png',
        '_img.jpg',
        '_doc_img.png',
        '_challan_img.png',
      ]) {
        push(`${host}/www/img2/challans/${state}/challan/${id}${suffix}`);
      }
    }
  }

  return urls;
}

function hostFallbackUrls(originalSrc) {
  const urls = [originalSrc];
  try {
    const u = new URL(originalSrc);
    const swappedHost = u.hostname.includes('gov.in')
      ? u.hostname.replace('parivahan.gov.in', 'parivahan.nic.in')
      : u.hostname.includes('nic.in')
        ? u.hostname.replace('parivahan.nic.in', 'parivahan.gov.in')
        : u.hostname;
    const alt = new URL(originalSrc);
    alt.hostname = swappedHost;
    urls.push(alt.href);
    if (/\.png$/i.test(u.pathname)) {
      urls.push(originalSrc.replace(/\.png$/i, '.jpg'));
      urls.push(alt.href.replace(/\.png$/i, '.jpg'));
    }
    if (/\.jpe?g$/i.test(u.pathname)) {
      urls.push(originalSrc.replace(/\.jpe?g$/i, '.png'));
      urls.push(alt.href.replace(/\.jpe?g$/i, '.png'));
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
    const resp = await tab.goto(url, { waitUntil: 'load', timeout: 20000 });
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

async function fetchImage(page, url) {
  try {
    const resp = await page.request.get(url, {
      timeout: 15000,
      headers: {
        Referer: page.url(),
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

function isUsableImage(body, contentType = '') {
  if (!body || body.length < 80) return false;
  const ct = String(contentType || '').toLowerCase();
  if (ct.includes('text/html') || ct.includes('application/json')) return false;
  if (ct.startsWith('image/')) return true;
  const kind = sniffImageType(body);
  return kind === 'image/jpeg' || kind === 'image/gif' || kind === 'image/webp' || (body[0] === 0x89 && body[1] === 0x50);
}

function sniffImageType(buf) {
  if (buf[0] === 0x89 && buf[1] === 0x50) return 'image/png';
  if (buf[0] === 0xff && buf[1] === 0xd8) return 'image/jpeg';
  if (buf[0] === 0x47 && buf[1] === 0x49) return 'image/gif';
  if (buf[0] === 0x52 && buf[1] === 0x49) return 'image/webp';
  return 'image/png';
}

function shorten(url) {
  return String(url || '').slice(0, 140);
}
