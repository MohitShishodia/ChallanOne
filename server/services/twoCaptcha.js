/**
 * 2Captcha ImageToText solver (API v2).
 * Used for Parivahan portal image captchas.
 */

import { createLogger } from './echallanReceipt/logger.js';

const log = createLogger('[2Captcha]');

const API_BASE = 'https://api.2captcha.com';
const POLL_INTERVAL_MS = 1500;
const MAX_WAIT_MS = 90_000;

export function isTwoCaptchaConfigured() {
  return Boolean(process.env.TWOCAPTCHA_API_KEY?.trim());
}

/**
 * Solve a normal image captcha (base64 or data-URI).
 * @param {string} imageDataUrl
 * @returns {Promise<{ text: string, taskId: number|string }>}
 */
export async function solveImageCaptcha(imageDataUrl) {
  const apiKey = process.env.TWOCAPTCHA_API_KEY?.trim();
  if (!apiKey) {
    throw new Error('TWOCAPTCHA_API_KEY is not configured');
  }

  const body = stripDataUriPrefix(imageDataUrl);
  if (!body) {
    throw new Error('Captcha image is empty');
  }

  log.step('Creating ImageToTextTask...');
  const createRes = await postJson(`${API_BASE}/createTask`, {
    clientKey: apiKey,
    task: {
      type: 'ImageToTextTask',
      body,
      phrase: false,
      // Parivahan validates letter case — workers must match exactly
      case: true,
      numeric: 0,
      math: false,
      minLength: 5,
      maxLength: 6,
      comment: 'Parivahan eChallan captcha. Type EXACT characters with correct UPPER/lower case. No spaces.',
    },
    languagePool: 'en',
  });

  if (createRes.errorId !== 0 || !createRes.taskId) {
    throw new Error(createRes.errorDescription || `2Captcha createTask failed (${createRes.errorCode || createRes.errorId})`);
  }

  const taskId = createRes.taskId;
  log.step('Waiting for solution...', { taskId });

  const deadline = Date.now() + MAX_WAIT_MS;
  while (Date.now() < deadline) {
    await sleep(POLL_INTERVAL_MS);

    const result = await postJson(`${API_BASE}/getTaskResult`, {
      clientKey: apiKey,
      taskId,
    });

    if (result.errorId !== 0) {
      throw new Error(result.errorDescription || `2Captcha getTaskResult failed (${result.errorCode || result.errorId})`);
    }

    if (result.status === 'ready') {
      // Strip spaces/noise workers sometimes add
      const text = String(result.solution?.text || '').replace(/\s+/g, '').trim();
      if (!text) {
        throw new Error('2Captcha returned an empty solution');
      }
      log.step('Captcha solved', { taskId, text, length: text.length });
      return { text, taskId };
    }
  }

  throw new Error('2Captcha timed out waiting for a solution');
}

/**
 * Report an incorrect solve so 2Captcha can refund.
 * @param {number|string} taskId
 */
export async function reportIncorrect(taskId) {
  const apiKey = process.env.TWOCAPTCHA_API_KEY?.trim();
  if (!apiKey || taskId == null) return;

  try {
    await postJson(`${API_BASE}/reportIncorrect`, {
      clientKey: apiKey,
      taskId,
    });
    log.step('Reported incorrect solve', { taskId });
  } catch (err) {
    log.warn('Failed to report incorrect captcha', err?.message || err);
  }
}

function stripDataUriPrefix(image) {
  const raw = String(image || '').trim();
  if (!raw) return '';
  const comma = raw.indexOf(',');
  if (raw.startsWith('data:') && comma !== -1) {
    return raw.slice(comma + 1);
  }
  return raw;
}

async function postJson(url, payload) {
  const res = await fetch(url, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
  });

  let data;
  try {
    data = await res.json();
  } catch {
    throw new Error(`2Captcha returned non-JSON response (${res.status})`);
  }

  if (!res.ok && data?.errorId == null) {
    throw new Error(`2Captcha HTTP ${res.status}`);
  }

  return data;
}

function sleep(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}
