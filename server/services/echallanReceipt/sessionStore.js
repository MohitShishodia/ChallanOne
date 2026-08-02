/**
 * In-memory Playwright session store for captcha → receipt flow.
 * Sessions expire after TTL and are cleaned on access.
 */

import { randomUUID } from 'crypto';
import { safeClose } from './browser.js';
import { createLogger } from './logger.js';

const log = createLogger();
const SESSION_TTL_MS = 5 * 60 * 1000;

/** @type {Map<string, { browser: import('playwright').Browser, context: import('playwright').BrowserContext, page: import('playwright').Page, createdAt: number, captchaImage: string }>} */
const sessions = new Map();

function purgeExpired() {
  const now = Date.now();
  for (const [id, session] of sessions.entries()) {
    if (now - session.createdAt > SESSION_TTL_MS) {
      log.step('Expiring captcha session', id);
      sessions.delete(id);
      safeClose(session.browser);
    }
  }
}

export function createSession({ browser, context, page, captchaImage }) {
  purgeExpired();
  const sessionId = randomUUID();
  sessions.set(sessionId, {
    browser,
    context,
    page,
    captchaImage,
    createdAt: Date.now(),
  });
  return sessionId;
}

export function getSession(sessionId) {
  purgeExpired();
  return sessions.get(sessionId) || null;
}

export function takeSession(sessionId) {
  purgeExpired();
  const session = sessions.get(sessionId) || null;
  if (session) sessions.delete(sessionId);
  return session;
}

export async function destroySession(sessionId) {
  const session = sessions.get(sessionId);
  if (!session) return;
  sessions.delete(sessionId);
  await safeClose(session.browser);
}

export function updateSessionCaptcha(sessionId, captchaImage) {
  const session = sessions.get(sessionId);
  if (!session) return false;
  session.captchaImage = captchaImage;
  session.createdAt = Date.now();
  return true;
}
