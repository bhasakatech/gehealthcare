/*
 * Preload shim: raise Playwright's default action timeout.
 *
 * The catalog classify pipeline takes a full-page screenshot of the target
 * page with Playwright's default 30s timeout and no config knob. Very long
 * pages (e.g. the GE HealthCare Legal page) exceed that and the pipeline
 * fails. Load this via NODE_OPTIONS="--require ./tools/importer/raise-pw-timeout.cjs"
 * to bump the default to 180s. Throwaway helper for the re-import.
 */
try {
  const path = '/home/node/.excat-marketplaces/excat-marketplace/excat/skills/excat-catalog-pages/scripts/node_modules/playwright-core/lib/client/timeoutSettings.js';
  // eslint-disable-next-line import/no-dynamic-require, global-require
  const mod = require(path);
  const TS = mod.TimeoutSettings;
  const BIG = Number(process.env.CATALOG_DEFAULT_TIMEOUT_MS) || 180000;
  if (TS && TS.prototype) {
    const origTimeout = TS.prototype.timeout;
    TS.prototype.timeout = function patchedTimeout(options) {
      const v = origTimeout.call(this, options);
      // Playwright's baked-in default is 30000; when the caller didn't set an
      // explicit/default timeout, bump it up.
      if (v === 30000 && (options == null || typeof options.timeout !== 'number')) {
        return BIG;
      }
      return v;
    };
  }
} catch (e) {
  // If resolution fails, do nothing — pipeline runs with stock timeout.
}
