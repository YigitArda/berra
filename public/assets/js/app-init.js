/**
 * Legacy bootstrap (deprecated)
 *
 * Bu dosya artık legacy ekranların kaynak implementasyonunu taşımıyor.
 * Geçiş planı için: docs/legacy-next-parity.md
 */

(function bootstrapLegacyCompat() {
  if (typeof window === 'undefined') return;

  window.__LEGACY_APP_INIT_RETIRED__ = true;

  if (!window.__legacyAppInitWarned) {
    console.warn('[legacy] public/assets/js/app-init.js emekliye ayrıldı. Yeni ekranlar Next app üzerinden servis ediliyor.');
    window.__legacyAppInitWarned = true;
  }
})();
