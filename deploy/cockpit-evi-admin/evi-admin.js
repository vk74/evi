/* Version: 1.0.0
 * Purpose: Main logic for evi admin tools Cockpit package.
 * Handles navigation between sections, backup form interactions, and command execution
 * via Cockpit API (cockpit.spawn). Each admin function calls scripts through the
 * evi-admin-dispatch.sh dispatcher that resolves paths to deployment scripts.
 * Cockpit package; filename: evi-admin.js
 */

(function () {
  'use strict';

  /* =====================================================================
   * Constants
   * ===================================================================== */

  var DISPATCH_PATH = '/usr/local/share/cockpit/evi-admin/evi-admin-dispatch.sh';

  /* =====================================================================
   * DOM references (populated in init)
   * ===================================================================== */

  var els = {};

  /* =====================================================================
   * State
   * ===================================================================== */

  var state = {
    backupRunning: false,
    currentProcess: null,
    defaultBackupDir: ''
  };

  /* =====================================================================
   * Navigation — switch between sections
   * ===================================================================== */

  function initNavigation() {
    var navItems = document.querySelectorAll('.evi-admin-nav-item');
    for (var i = 0; i < navItems.length; i++) {
      navItems[i].addEventListener('click', onNavClick);
    }
  }

  function onNavClick(e) {
    var item = e.currentTarget;
    if (item.classList.contains('disabled')) return;

    var sectionId = item.getAttribute('data-section');
    if (!sectionId) return;

    // Update nav active state
    var navItems = document.querySelectorAll('.evi-admin-nav-item');
    for (var i = 0; i < navItems.length; i++) {
      navItems[i].classList.remove('active');
    }
    item.classList.add('active');

    // Show corresponding section, hide others
    var sections = document.querySelectorAll('.evi-admin-section');
    for (var j = 0; j < sections.length; j++) {
      sections[j].classList.add('hidden');
    }
    var target = document.getElementById('section-' + sectionId);
    if (target) {
      target.classList.remove('hidden');
    }
  }

  /* =====================================================================
   * Backup form — show/hide password, validate, collect values
   * ===================================================================== */

  function initBackupForm() {
    // Toggle password field visibility
    els.encryptCheckbox.addEventListener('change', function () {
      if (els.encryptCheckbox.checked) {
        els.passwordGroup.classList.remove('hidden');
      } else {
        els.passwordGroup.classList.add('hidden');
        els.passwordInput.value = '';
      }
    });

    // Start Backup button
    els.btnStart.addEventListener('click', startBackup);

    // Estimate button
    els.btnEstimate.addEventListener('click', estimateBackup);

    // Clear output button
    els.btnClear.addEventListener('click', clearOutput);
  }

  /* Collect form values into an environment variable array for cockpit.spawn */
  function collectBackupEnv() {
    var env = [
      'BACKUP_DIR=' + els.dirInput.value.trim(),
      'BACKUP_COMPRESSION=' + els.compressionSelect.value,
      'BACKUP_NONINTERACTIVE=true'
    ];

    if (els.encryptCheckbox.checked) {
      env.push('BACKUP_ENCRYPT=true');
      env.push('BACKUP_PASSWORD=' + els.passwordInput.value);
    } else {
      env.push('BACKUP_ENCRYPT=false');
    }

    return env;
  }

  /* Validate form before starting backup */
  function validateBackupForm() {
    var dir = els.dirInput.value.trim();
    if (!dir) {
      showStatus('error', 'Please specify a backup location.');
      return false;
    }
    if (els.encryptCheckbox.checked && !els.passwordInput.value) {
      showStatus('error', 'Please enter an encryption password or uncheck the encryption option.');
      return false;
    }
    return true;
  }

  /* =====================================================================
   * Backup execution — cockpit.spawn() with streaming output
   * ===================================================================== */

  function startBackup() {
    if (state.backupRunning) return;
    if (!validateBackupForm()) return;

    state.backupRunning = true;
    setFormEnabled(false);
    clearOutput();
    showOutput();
    showStatus('running', 'Backup in progress...');

    var envVars = collectBackupEnv();

    var proc = cockpit.spawn([DISPATCH_PATH, 'backup-create'], {
      environ: envVars,
      err: 'out',
      superuser: 'try'
    });

    state.currentProcess = proc;

    proc.stream(function (data) {
      appendOutput(data);
    });

    proc.then(function () {
      state.backupRunning = false;
      state.currentProcess = null;
      setFormEnabled(true);
      showStatus('success', 'Backup completed successfully.');
    });

    proc.catch(function (ex) {
      state.backupRunning = false;
      state.currentProcess = null;
      setFormEnabled(true);
      var msg = 'Backup failed.';
      if (ex.exit_status) {
        msg += ' Exit code: ' + ex.exit_status + '.';
      }
      if (ex.message) {
        msg += ' ' + ex.message;
      }
      showStatus('error', msg);
    });
  }

  function estimateBackup() {
    if (state.backupRunning) return;

    clearOutput();
    showOutput();
    showStatus('running', 'Estimating backup size...');
    setFormEnabled(false);

    var proc = cockpit.spawn([DISPATCH_PATH, 'backup-estimate'], {
      err: 'out',
      superuser: 'try'
    });

    proc.stream(function (data) {
      appendOutput(data);
    });

    proc.then(function () {
      setFormEnabled(true);
      showStatus('success', 'Estimation complete.');
    });

    proc.catch(function (ex) {
      setFormEnabled(true);
      var msg = 'Estimation failed.';
      if (ex.message) msg += ' ' + ex.message;
      showStatus('error', msg);
    });
  }

  /* =====================================================================
   * UI helpers — status, output, form toggle
   * ===================================================================== */

  function showStatus(type, message) {
    els.status.textContent = message;
    els.status.className = 'evi-admin-status status-' + type;
    els.status.classList.remove('hidden');
  }

  function hideStatus() {
    els.status.classList.add('hidden');
    els.status.className = 'evi-admin-status hidden';
  }

  function showOutput() {
    els.outputWrapper.classList.remove('hidden');
  }

  function appendOutput(text) {
    els.output.textContent += text;
    // Auto-scroll to bottom
    els.output.scrollTop = els.output.scrollHeight;
  }

  function clearOutput() {
    els.output.textContent = '';
    els.outputWrapper.classList.add('hidden');
    hideStatus();
  }

  function setFormEnabled(enabled) {
    els.btnStart.disabled = !enabled;
    els.btnEstimate.disabled = !enabled;
    els.dirInput.disabled = !enabled;
    els.compressionSelect.disabled = !enabled;
    els.encryptCheckbox.disabled = !enabled;
    els.passwordInput.disabled = !enabled;
  }

  /* =====================================================================
   * Load defaults — get deployment directory from dispatcher
   * ===================================================================== */

  function loadDefaults() {
    var proc = cockpit.spawn([DISPATCH_PATH, 'get-defaults'], {
      err: 'out',
      superuser: 'try'
    });

    proc.then(function (data) {
      var lines = data.split('\n');
      for (var i = 0; i < lines.length; i++) {
        var parts = lines[i].split('=');
        if (parts.length >= 2) {
          var key = parts[0];
          var val = parts.slice(1).join('=');
          if (key === 'DEFAULT_BACKUP_DIR') {
            state.defaultBackupDir = val;
            if (!els.dirInput.value) {
              els.dirInput.value = val;
            }
          }
        }
      }
    });

    proc.catch(function () {
      // Dispatcher not installed yet — pre-fill with a reasonable default
      if (!els.dirInput.value) {
        els.dirInput.value = '~/evi/backup';
      }
    });
  }

  /* =====================================================================
   * Initialization
   * ===================================================================== */

  function init() {
    // Cache DOM references
    els.dirInput = document.getElementById('backup-dir');
    els.compressionSelect = document.getElementById('backup-compression');
    els.encryptCheckbox = document.getElementById('backup-encrypt');
    els.passwordGroup = document.getElementById('password-group');
    els.passwordInput = document.getElementById('backup-password');
    els.btnStart = document.getElementById('btn-backup-start');
    els.btnEstimate = document.getElementById('btn-backup-estimate');
    els.btnClear = document.getElementById('btn-backup-clear');
    els.status = document.getElementById('backup-status');
    els.outputWrapper = document.getElementById('backup-output-wrapper');
    els.output = document.getElementById('backup-output');

    initNavigation();
    initBackupForm();
    loadDefaults();
  }

  // Boot
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }

})();
