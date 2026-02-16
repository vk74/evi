/* Version: 1.0.0
 * Purpose: Main logic for evi update Cockpit package.
 * Handles the three-step update flow: check for updates, download update, install update.
 * Communicates with host scripts via evi-update-dispatch.sh dispatcher using cockpit.spawn().
 * Reads update status from updates.json and reflects it in the UI (version info, badges, buttons).
 * Cockpit package; filename: evi-update.js
 */

(function () {
  'use strict';

  /* =====================================================================
   * Theme sync — inherit Cockpit shell dark/light theme
   * ===================================================================== */

  function isDarkColor(colorStr) {
    if (!colorStr) return false;
    var m = colorStr.match(/rgba?\(\s*(\d+)\s*,\s*(\d+)\s*,\s*(\d+)/);
    if (!m) return false;
    var r = parseInt(m[1], 10) / 255;
    var g = parseInt(m[2], 10) / 255;
    var b = parseInt(m[3], 10) / 255;
    var lum = 0.2126 * r + 0.7152 * g + 0.0722 * b;
    return lum < 0.4;
  }

  function applyTheme() {
    try {
      var parentBody = window.parent.document.body;
      if (!parentBody) return;
      var bg = window.parent.getComputedStyle(parentBody).backgroundColor;
      document.documentElement.classList.toggle('theme-dark', isDarkColor(bg));
    } catch (e) {
      /* parent not accessible */
    }
  }

  function syncTheme() {
    requestAnimationFrame(function () {
      applyTheme();
    });
  }

  applyTheme();

  try {
    var parentDoc = window.parent.document;
    var themeObs = new MutationObserver(syncTheme);
    themeObs.observe(parentDoc.documentElement, { attributes: true, attributeFilter: ['class', 'style'] });
    themeObs.observe(parentDoc.body, { attributes: true, attributeFilter: ['class', 'style'] });
  } catch (e) {
    /* parent not accessible */
  }

  /* =====================================================================
   * Constants
   * ===================================================================== */

  var DISPATCH_PATH = '/usr/local/share/cockpit/evi-update/evi-update-dispatch.sh';

  /* =====================================================================
   * DOM references
   * ===================================================================== */

  var els = {};

  /* =====================================================================
   * State
   * ===================================================================== */

  var state = {
    operationRunning: false,
    currentProcess: null,
    updateData: null
  };

  /* =====================================================================
   * Update status display — read updates.json and refresh UI
   * ===================================================================== */

  /* Load current status from updates.json via dispatcher */
  function loadStatus() {
    var proc = cockpit.spawn([DISPATCH_PATH, 'read-status'], {
      err: 'out'
    });

    proc.then(function (data) {
      try {
        state.updateData = JSON.parse(data);
      } catch (e) {
        state.updateData = null;
      }
      refreshUI();
    });

    proc.catch(function () {
      state.updateData = null;
      refreshUI();
    });
  }

  /* Refresh all UI elements based on current state */
  function refreshUI() {
    var d = state.updateData;

    if (!d) {
      els.currentVersion.textContent = '—';
      els.latestVersion.textContent = '—';
      els.lastCheck.textContent = 'never';
      setBadge('neutral', 'unknown');
      els.btnDownload.disabled = true;
      els.btnInstall.disabled = true;
      return;
    }

    // Version info
    els.currentVersion.textContent = d.currentVersion || '—';
    els.latestVersion.textContent = d.latestVersion || '—';

    // Last check timestamp
    if (d.lastCheck) {
      try {
        var dt = new Date(d.lastCheck);
        els.lastCheck.textContent = dt.toLocaleString();
      } catch (e) {
        els.lastCheck.textContent = d.lastCheck;
      }
    } else {
      els.lastCheck.textContent = 'never';
    }

    // Status badge and button states
    if (!d.available) {
      setBadge('success', 'up to date');
      els.btnDownload.disabled = true;
      els.btnInstall.disabled = true;
      hideReleaseNotes();
    } else if (d.downloaded) {
      setBadge('info', 'ready to install');
      els.btnDownload.disabled = true;
      els.btnInstall.disabled = false;
      showReleaseNotes(d.releaseNotes);
    } else {
      setBadge('warning', 'update available');
      els.btnDownload.disabled = false;
      els.btnInstall.disabled = true;
      showReleaseNotes(d.releaseNotes);
    }

    // Disable buttons during operations
    if (state.operationRunning) {
      els.btnCheck.disabled = true;
      els.btnDownload.disabled = true;
      els.btnInstall.disabled = true;
    } else {
      els.btnCheck.disabled = false;
    }
  }

  /* Set the status badge style and text */
  function setBadge(type, text) {
    els.statusBadge.textContent = text;
    els.statusBadge.className = 'evi-update-badge evi-update-badge-' + type;
  }

  /* Show/hide release notes */
  function showReleaseNotes(notes) {
    if (!notes || notes === '...' || notes === '') {
      hideReleaseNotes();
      return;
    }
    // Unescape JSON-escaped newlines
    var decoded = notes.replace(/\\n/g, '\n');
    els.releaseNotes.textContent = decoded;
    els.releaseNotesWrapper.classList.remove('hidden');
  }

  function hideReleaseNotes() {
    els.releaseNotesWrapper.classList.add('hidden');
    els.releaseNotes.textContent = '';
  }

  /* =====================================================================
   * Operations — check, download, install
   * ===================================================================== */

  /* Run a dispatcher command with streaming output */
  function runOperation(command, statusMessage, onSuccess) {
    if (state.operationRunning) return;

    state.operationRunning = true;
    refreshUI();
    clearOutput();
    showOutput();
    showStatus('running', statusMessage);
    showProgress();

    var proc = cockpit.spawn([DISPATCH_PATH, command], {
      err: 'out'
    });

    state.currentProcess = proc;

    proc.stream(function (data) {
      appendOutput(data);
    });

    proc.then(function () {
      state.operationRunning = false;
      state.currentProcess = null;
      hideProgress();
      if (onSuccess) {
        onSuccess();
      }
      // Reload status after operation
      loadStatus();
    });

    proc.catch(function (ex) {
      state.operationRunning = false;
      state.currentProcess = null;
      hideProgress();
      var msg = 'Operation failed.';
      if (ex.exit_status) {
        msg += ' Exit code: ' + ex.exit_status + '.';
      }
      if (ex.message) {
        msg += ' ' + ex.message;
      }
      showStatus('error', msg);
      refreshUI();
    });
  }

  /* Check for updates */
  function checkForUpdates() {
    runOperation('check-updates', 'Checking for updates...', function () {
      showStatus('success', 'Update check completed.');
    });
  }

  /* Download update */
  function downloadUpdate() {
    runOperation('download-update', 'Downloading update...', function () {
      showStatus('success', 'Update downloaded. Ready to install.');
    });
  }

  /* Install update — with confirmation dialog */
  function installUpdate() {
    if (state.operationRunning) return;

    var confirmed = window.confirm(
      'Install the update now?\n\n' +
      'This will:\n' +
      '- Replace the deploy kit files\n' +
      '- Pull updated container images\n' +
      '- Restart all EVI services\n\n' +
      'The application will be briefly unavailable during the restart.'
    );

    if (!confirmed) return;

    setBadge('active', 'installing...');

    runOperation('install-update', 'Installing update... This may take several minutes.', function () {
      showStatus('success', 'Update installed successfully. Services have been restarted.');
    });
  }

  /* =====================================================================
   * UI helpers — status, output, progress
   * ===================================================================== */

  function showStatus(type, message) {
    els.operationStatus.textContent = message;
    els.operationStatus.className = 'evi-update-status status-' + type;
    els.operationStatus.classList.remove('hidden');
  }

  function hideStatus() {
    els.operationStatus.classList.add('hidden');
    els.operationStatus.className = 'evi-update-status hidden';
  }

  function showOutput() {
    els.outputWrapper.classList.remove('hidden');
  }

  function appendOutput(text) {
    els.output.textContent += text;
    els.output.scrollTop = els.output.scrollHeight;
  }

  function clearOutput() {
    els.output.textContent = '';
    els.outputWrapper.classList.add('hidden');
    hideStatus();
    hideProgress();
  }

  function showProgress() {
    els.progressWrapper.classList.remove('hidden');
    els.progressFill.classList.add('evi-update-progress-indeterminate');
    els.progressText.textContent = 'Working...';
  }

  function hideProgress() {
    els.progressWrapper.classList.add('hidden');
    els.progressFill.classList.remove('evi-update-progress-indeterminate');
  }

  /* =====================================================================
   * Initialization
   * ===================================================================== */

  function init() {
    // Cache DOM references
    els.currentVersion = document.getElementById('current-version');
    els.latestVersion = document.getElementById('latest-version');
    els.lastCheck = document.getElementById('last-check');
    els.statusBadge = document.getElementById('update-status-badge');
    els.btnCheck = document.getElementById('btn-check');
    els.btnDownload = document.getElementById('btn-download');
    els.btnInstall = document.getElementById('btn-install');
    els.btnClear = document.getElementById('btn-clear');
    els.operationStatus = document.getElementById('operation-status');
    els.progressWrapper = document.getElementById('progress-wrapper');
    els.progressFill = document.getElementById('progress-fill');
    els.progressText = document.getElementById('progress-text');
    els.outputWrapper = document.getElementById('output-wrapper');
    els.output = document.getElementById('output');
    els.releaseNotesWrapper = document.getElementById('release-notes-wrapper');
    els.releaseNotes = document.getElementById('release-notes');

    // Bind buttons
    els.btnCheck.addEventListener('click', checkForUpdates);
    els.btnDownload.addEventListener('click', downloadUpdate);
    els.btnInstall.addEventListener('click', installUpdate);
    els.btnClear.addEventListener('click', clearOutput);

    // Load current status
    loadStatus();
  }

  // Boot
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }

})();
