/* Version: 1.0.0
 * Purpose: Build pgAdmin URL from current host, open in new tab, set fallback link href.
 * Cockpit package script; filename: evi-pgadmin.js
 */
(function() {
  var host = window.location.hostname;
  var pgadminUrl = 'http://' + host + ':5445';

  function run() {
    var link = document.getElementById('pgadmin-link');
    if (link) {
      link.href = pgadminUrl;
    }
    window.open(pgadminUrl, '_blank', 'noopener,noreferrer');
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', run);
  } else {
    run();
  }
})();
