// Translate strings injected from JS, using the same dict (#dp-i18n, English
// overlay) and language flag (dp-lang) that ui.js uses. Arabic is the base, so
// the caller-supplied fallback IS the Arabic; we return English when toggled.
export function t(key, fallback) {
  try {
    if (localStorage.getItem('dp-lang') !== 'en') return fallback;
    const dict = JSON.parse(document.getElementById('dp-i18n')?.textContent || '{}');
    return dict[key] || fallback;
  } catch {
    return fallback;
  }
}
