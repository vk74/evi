/* Version: 1.2.0
 * Purpose: Sync Cockpit theme (dark/light) with parent shell; build pgAdmin URL, try auto-open, set fallback link and show popup-blocked hint.
 * Cockpit package script; filename: evi-pgadmin.js
 *
 * Changes in v1.2.0:
 * - Detect dark theme via parent computed background-color (version-agnostic, works with any Cockpit/PatternFly)
 * - Use .theme-dark class instead of pf-v5-theme-dark
 * Changes in v1.1.0:
 * - Sync theme class (pf-v5-theme-dark) from parent document; MutationObserver for theme toggle
 * - Detect popup block and show #popup-blocked-hint
 */
(function() {

  /* ── Theme sync ── */

  /* Determine if an rgb/rgba color string is "dark" (luminance < 0.4) */
  function isDarkColor(colorStr) {
    if (!colorStr) return false;
    var m = colorStr.match(/rgba?\(\s*(\d+)\s*,\s*(\d+)\s*,\s*(\d+)/);
    if (!m) return false;
    var r = parseInt(m[1], 10) / 255;
    var g = parseInt(m[2], 10) / 255;
    var b = parseInt(m[3], 10) / 255;
    /* relative luminance (simplified sRGB) */
    var lum = 0.2126 * r + 0.7152 * g + 0.0722 * b;
    return lum < 0.4;
  }

  function syncTheme() {
    try {
      var parentBody = window.parent.document.body;
      if (!parentBody) return;
      var bg = window.parent.getComputedStyle(parentBody).backgroundColor;
      document.documentElement.classList.toggle('theme-dark', isDarkColor(bg));
    } catch (e) {
      /* parent not accessible (not in iframe or cross-origin) */
    }
  }

  /* Initial sync */
  syncTheme();

  /* Watch for attribute/class changes on parent <html> and <body> that may indicate theme toggle */
  try {
    var parentDoc = window.parent.document;
    var obs = new MutationObserver(syncTheme);
    obs.observe(parentDoc.documentElement, { attributes: true, attributeFilter: ['class', 'style'] });
    obs.observe(parentDoc.body, { attributes: true, attributeFilter: ['class', 'style'] });
  } catch (e) {
    /* parent not accessible */
  }

  /* ── pgAdmin URL + auto-open ── */

  var host = window.location.hostname;
  var pgadminUrl = 'http://' + host + ':5445';

  var link = document.getElementById('pgadmin-link');
  if (link) {
    link.href = pgadminUrl;
  }

  /* Try auto-open; detect if popup was blocked */
  var win = window.open(pgadminUrl, '_blank', 'noopener,noreferrer');
  if (!win) {
    var hint = document.getElementById('popup-blocked-hint');
    if (hint) {
      hint.hidden = false;
    }
  }
})();
