/**
 * Step logger for eChallan receipt automation.
 * Includes elapsed time since the logger was created.
 */

export function createLogger(prefix = '[eChallanReceipt]') {
  let startTime = null;

  function elapsed() {
    if (!startTime) return '';
    return ` (${((Date.now() - startTime) / 1000).toFixed(1)}s)`;
  }

  return {
    startTimer() {
      startTime = Date.now();
    },
    step(message, extra) {
      const suffix = extra !== undefined ? ` ${typeof extra === 'string' ? extra : JSON.stringify(extra)}` : '';
      console.log(`${prefix}${elapsed()} ${message}${suffix}`);
    },
    warn(message, extra) {
      const suffix = extra !== undefined ? ` ${typeof extra === 'string' ? extra : JSON.stringify(extra)}` : '';
      console.warn(`${prefix}${elapsed()} ⚠️ ${message}${suffix}`);
    },
    error(message, err) {
      console.error(`${prefix}${elapsed()} ❌ ${message}`, err?.message || err || '');
    },
  };
}
