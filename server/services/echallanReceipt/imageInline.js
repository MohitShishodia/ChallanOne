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

      const entry = { body: Buffer.from(body), contentType };
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
    } catch {
      // response body may already be disposed
    }
  });

  return cache;
}

export async function inlinePageImages(page) {
  const cache = ensureImageCache(page.context());

  await page.waitForTimeout(1200).catch(() => {});
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
      { timeout: 20000 }
    )
    .catch(() => {});

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
      if (entry) {
        cache.set(abs, entry);
      }
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
  });

  await page
    .waitForFunction(() => [...document.images].every((img) => img.complete), { timeout: 8000 })
    .catch(() => {});
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
    if (body.length < 40 || ct.includes('text/html') || ct.includes('application/json')) return null;
    return {
      body,
      contentType: ct.startsWith('image/') ? ct : sniffImageType(body),
    };
  } catch {
    return null;
  }
}

function sniffImageType(buf) {
  if (buf[0] === 0x89 && buf[1] === 0x50) return 'image/png';
  if (buf[0] === 0xff && buf[1] === 0xd8) return 'image/jpeg';
  if (buf[0] === 0x47 && buf[1] === 0x49) return 'image/gif';
  if (buf[0] === 0x52 && buf[1] === 0x49) return 'image/webp';
  return 'image/png';
}
