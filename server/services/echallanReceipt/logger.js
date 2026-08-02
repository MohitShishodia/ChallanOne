/**
 * Step logger for eChallan receipt automation.
 */

export function createLogger(prefix = '[eChallanReceipt]') {
  return {
    step(message, extra) {
      const suffix = extra !== undefined ? ` ${typeof extra === 'string' ? extra : JSON.stringify(extra)}` : '';
      console.log(`${prefix} ${message}${suffix}`);
    },
    warn(message, extra) {
      const suffix = extra !== undefined ? ` ${typeof extra === 'string' ? extra : JSON.stringify(extra)}` : '';
      console.warn(`${prefix} ⚠️ ${message}${suffix}`);
    },
    error(message, err) {
      console.error(`${prefix} ❌ ${message}`, err?.message || err || '');
    },
  };
}
