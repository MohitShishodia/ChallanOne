import path from 'path';
import fs from 'fs';
import { fileURLToPath } from 'url';
import { randomUUID } from 'crypto';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
export const SERVER_ROOT = path.resolve(__dirname, '../..');
export const RECEIPTS_DIR = path.join(SERVER_ROOT, 'uploads', 'receipts');
export const RECEIPTS_PUBLIC_PREFIX = '/receipts';

export function ensureReceiptsDir() {
  fs.mkdirSync(RECEIPTS_DIR, { recursive: true });
  return RECEIPTS_DIR;
}

export function buildReceiptFilename(challanNumber, ext = 'pdf') {
  const safe = String(challanNumber || 'challan').replace(/[^A-Za-z0-9_-]/g, '').slice(0, 40) || 'challan';
  return `${safe}-${Date.now()}-${randomUUID().slice(0, 8)}.${ext}`;
}

export function publicReceiptUrl(filename) {
  return `${RECEIPTS_PUBLIC_PREFIX}/${filename}`;
}

export function absoluteReceiptPath(filename) {
  return path.join(RECEIPTS_DIR, filename);
}
