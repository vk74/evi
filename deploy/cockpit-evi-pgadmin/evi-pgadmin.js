/* Version: 1.1.0
 * Purpose: Sync Cockpit theme (dark/light) with parent shell; build pgAdmin URL, try auto-open, set fallback link and show popup-blocked hint.
 * Cockpit package script; filename: evi-pgadmin.js
 *
 * Changes in v1.1.0:
 * - Sync theme class (pf-v5-theme-dark) from parent document; MutationObserver for theme toggle
 * - Detect popup block and show #popup-blocked-hint
 */
(function() {
  var THEME_CLASS = 'pf-v5-theme-dark';

  function syncTheme() {
    try {
      var parentRoot = window.parent.document.documentElement;
      var isDark = parentRoot.classList.contains(THEME_CLASS);
      document.documentElement.classList.toggle(THEME_CLASS, isDark);
    } catch (e) {
      /* not in iframe or cross-origin */
    }
  }

  syncTheme();

  try {
    var observer = new MutationObserver(syncTheme);
    observer.observe(window.parent.document.documentElement, {
      attributes: true,
      attributeFilter: ['class']
    });
  } catch (e) {
    /* parent not accessible */
  }

  var host = window.location.hostname;
  var pgadminUrl = 'http://' + host + ':5445';

  var link = document.getElementById('pgadmin-link');
  if (link) {
    link.href = pgadminUrl;
  }

  var win = window.open(pgadminUrl, '_blank', 'noopener,noreferrer');
  if (!win) {
    var hint = document.getElementById('popup-blocked-hint');
    if (hint) {
      hint.hidden = false;
    }
  }
})();
