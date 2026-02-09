/* Version: 1.3.2
 * Purpose: Main logic for evi admin tools Cockpit package.
 * Handles navigation between sections, backup form interactions, and command execution
 * via Cockpit API (cockpit.spawn). Each admin function calls scripts through the
 * evi-admin-dispatch.sh dispatcher that resolves paths to deployment scripts.
 * Cockpit package; filename: evi-admin.js
 *
 * Changes in v1.3.2:
 * - get-defaults and mkdir: run as current user so DEFAULT_BACKUP_DIR is e.g. /home/user/evi/backup not /root/evi/backup
 *
 * Changes in v1.3.1:
 * - Backup spawn: run as current user (no superuser) so rootless podman containers are visible
 *
 * Changes in v1.3.0:
 * - Estimate: strip ANSI codes and extract JSON from mixed stderr+stdout so formatted table always shows
 * - Backup location: keep ~/evi/backup in UI; resolve to absolute path only when calling scripts
 * - Password visibility toggle (eye icon) for encryption password field
 * - Progress bar during backup with step count from [✓] lines in script output
 *
 * Changes in v1.2.0:
 * - Estimate Size renders human-readable formatted summary instead of raw JSON output
 * - Pre-filled backup location ~/evi/backup; loadDefaults only overwrites when field is empty
 * - Backup directory auto-created if it does not exist (mkdir -p before backup-create)
 *
 * Changes in v1.1.0:
 * - Sync Cockpit theme (dark/light) via parent computed background-color + MutationObserver
 */

(function () {
  'use strict';

  /* =====================================================================
   * Theme sync — inherit Cockpit shell dark/light theme
   * ===================================================================== */

  /* Determine if an rgb/rgba color string is "dark" (luminance < 0.4) */
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

  /* Deferred sync: wait for browser to recalculate styles after class mutation */
  function syncTheme() {
    requestAnimationFrame(function() {
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
    defaultBackupDir: '',
    backupOutputBuffer: '',
    backupTotalSteps: 12
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

    // Password visibility toggle (eye icon)
    if (els.btnTogglePassword) {
      els.btnTogglePassword.addEventListener('click', function () {
        var isPassword = els.passwordInput.type === 'password';
        els.passwordInput.type = isPassword ? 'text' : 'password';
        if (els.iconEye) els.iconEye.classList.toggle('hidden', isPassword);
        if (els.iconEyeOff) els.iconEyeOff.classList.toggle('hidden', !isPassword);
        els.btnTogglePassword.setAttribute('title', isPassword ? 'Hide password' : 'Show password');
        els.btnTogglePassword.setAttribute('aria-label', isPassword ? 'Hide password' : 'Show password');
      });
    }
  }

  /* Resolved backup directory for scripts: show ~/evi/backup in UI, pass absolute path to scripts */
  function getResolvedBackupDir() {
    var raw = els.dirInput.value.trim();
    if (!raw || raw === '~/evi/backup') {
      return state.defaultBackupDir || raw || '~/evi/backup';
    }
    return raw;
  }

  /* Collect form values into an environment variable array for cockpit.spawn */
  function collectBackupEnv() {
    var env = [
      'BACKUP_DIR=' + getResolvedBackupDir(),
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
    showStatus('running', 'Preparing backup directory...');

    var backupDir = getResolvedBackupDir();

    // Ensure backup directory exists (mkdir -p); run as current user so path matches backup-create
    var mkdirProc = cockpit.spawn(['mkdir', '-p', backupDir], {
      err: 'out'
    });

    mkdirProc.catch(function (ex) {
      state.backupRunning = false;
      setFormEnabled(true);
      showStatus('error', 'Failed to create backup directory: ' + (ex.message || backupDir));
      return;
    });

    mkdirProc.then(function () {
      runBackup();
    });
  }

  /* Execute the actual backup after directory is ready */
  function runBackup() {
    showStatus('running', 'Backup in progress...');
    state.backupOutputBuffer = '';
    showProgressIndeterminate();

    var envVars = collectBackupEnv();

    var proc = cockpit.spawn([DISPATCH_PATH, 'backup-create'], {
      environ: envVars,
      err: 'out'
    });

    state.currentProcess = proc;

    proc.stream(function (data) {
      appendOutput(data);
      state.backupOutputBuffer += data;
      updateProgressFromBackupOutput();
    });

    proc.then(function () {
      state.backupRunning = false;
      state.currentProcess = null;
      setFormEnabled(true);
      hideProgress();
      showStatus('success', 'Backup completed successfully.');
    });

    proc.catch(function (ex) {
      state.backupRunning = false;
      state.currentProcess = null;
      setFormEnabled(true);
      hideProgress();
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

  /* Progress bar: show indeterminate (animated) state */
  function showProgressIndeterminate() {
    if (!els.progressWrapper) return;
    els.progressWrapper.classList.remove('hidden');
    if (els.progressFill) {
      els.progressFill.classList.add('evi-admin-progress-indeterminate');
      els.progressFill.style.width = '0%';
    }
    if (els.progressText) els.progressText.textContent = 'Backup in progress...';
  }

  /* Progress bar: update from backup output (count [✓] lines) */
  function updateProgressFromBackupOutput() {
    if (!els.progressFill || !els.progressText) return;
    var cleaned = stripAnsi(state.backupOutputBuffer);
    var lines = cleaned.split('\n');
    var count = 0;
    for (var i = 0; i < lines.length; i++) {
      if (lines[i].indexOf('[✓]') !== -1) count++;
    }
    count = Math.min(count, state.backupTotalSteps);
    if (count > 0) {
      els.progressFill.classList.remove('evi-admin-progress-indeterminate');
      var pct = Math.round((count / state.backupTotalSteps) * 100);
      els.progressFill.style.width = pct + '%';
      els.progressText.textContent = 'Step ' + count + ' of ' + state.backupTotalSteps + ' completed';
    }
  }

  /* Progress bar: hide */
  function hideProgress() {
    if (els.progressWrapper) els.progressWrapper.classList.add('hidden');
  }

  function estimateBackup() {
    if (state.backupRunning) return;

    clearOutput();
    showOutput();
    showStatus('running', 'Estimating backup size...');
    setFormEnabled(false);

    var backupDir = getResolvedBackupDir() || '~/evi/backup';
    var collected = '';

    var proc = cockpit.spawn([DISPATCH_PATH, 'backup-estimate', backupDir], {
      err: 'out'
    });

    proc.stream(function (data) {
      collected += data;
    });

    proc.then(function () {
      setFormEnabled(true);
      var formatted = formatEstimate(collected);
      els.output.textContent = formatted;
      showStatus('success', 'Estimation complete.');
    });

    proc.catch(function (ex) {
      setFormEnabled(true);
      // If JSON parsing fails, show raw output as fallback
      if (collected) {
        els.output.textContent = collected;
      }
      var msg = 'Estimation failed.';
      if (ex.message) msg += ' ' + ex.message;
      showStatus('error', msg);
    });
  }

  /* =====================================================================
   * Format estimate JSON into human-readable summary
   * ===================================================================== */

  /* Convert bytes to human-readable string (KB, MB, GB) */
  function formatBytes(bytes) {
    if (bytes >= 1073741824) return (bytes / 1073741824).toFixed(1) + ' GB';
    if (bytes >= 1048576) return (bytes / 1048576).toFixed(1) + ' MB';
    if (bytes >= 1024) return (bytes / 1024).toFixed(1) + ' KB';
    return bytes + ' B';
  }

  /* Convert seconds to readable duration */
  function formatDuration(seconds) {
    if (seconds >= 3600) {
      var h = Math.floor(seconds / 3600);
      var m = Math.floor((seconds % 3600) / 60);
      return h + ' h ' + m + ' min';
    }
    if (seconds >= 60) {
      var min = Math.floor(seconds / 60);
      var sec = seconds % 60;
      return min + ' min ' + sec + ' sec';
    }
    return seconds + ' sec';
  }

  /* Pad string to fixed width (right-aligned for numbers) */
  function padLeft(str, len) {
    while (str.length < len) str = ' ' + str;
    return str;
  }

  function padRight(str, len) {
    while (str.length < len) str = str + ' ';
    return str;
  }

  /* Strip ANSI escape sequences from script output */
  function stripAnsi(str) {
    return str.replace(/\x1b\[[0-9;]*m/g, '');
  }

  /* Extract JSON object from mixed output (stderr + stdout); returns { json: string, prefix: string } */
  function extractJsonFromOutput(raw) {
    var cleaned = stripAnsi(raw);
    var first = cleaned.indexOf('{');
    var last = cleaned.lastIndexOf('}');
    if (first === -1 || last === -1 || last < first) {
      return { json: null, prefix: cleaned.trim() };
    }
    return {
      json: cleaned.slice(first, last + 1),
      prefix: cleaned.slice(0, first).trim()
    };
  }

  /* Parse backup-estimate.sh JSON and render formatted text */
  function formatEstimate(rawOutput) {
    var extracted = extractJsonFromOutput(rawOutput);
    var data;
    try {
      if (!extracted.json) {
        throw new Error('No JSON found');
      }
      data = JSON.parse(extracted.json);
    } catch (e) {
      return 'Could not parse estimate data.\n\n' + stripAnsi(rawOutput);
    }

    var lines = [];
    if (extracted.prefix) {
      lines.push(extracted.prefix);
      lines.push('');
    }
    var sep = '─'.repeat(52);

    lines.push('  BACKUP SIZE ESTIMATE');
    lines.push(sep);
    lines.push('');
    lines.push('  Backup Components:');
    lines.push('');
    lines.push('    ' + padRight('Container images', 28) + padLeft(formatBytes(data.images_bytes || 0), 12));
    lines.push('    ' + padRight('Database', 28) + padLeft(formatBytes(data.database_bytes || 0), 12));
    lines.push('    ' + padRight('Environment files', 28) + padLeft(formatBytes(data.env_bytes || 0), 12));
    lines.push('    ' + padRight('TLS certificates', 28) + padLeft(formatBytes(data.tls_bytes || 0), 12));
    lines.push('    ' + padRight('JWT secrets', 28) + padLeft(formatBytes(data.jwt_bytes || 0), 12));

    if (data.pgadmin_bytes > 0) {
      lines.push('    ' + padRight('pgAdmin data', 28) + padLeft(formatBytes(data.pgadmin_bytes), 12));
    }

    lines.push('    ' + padRight('Installation scripts', 28) + padLeft(formatBytes(data.install_repo_bytes || 0), 12));
    lines.push('    ' + '─'.repeat(40));
    lines.push('    ' + padRight('Total (uncompressed)', 28) + padLeft(formatBytes(data.total_uncompressed_bytes || 0), 12));
    lines.push('');

    // Compression options
    var ce = data.compression_estimates || {};
    lines.push(sep);
    lines.push('');
    lines.push('  Compression Options:');
    lines.push('');
    lines.push('    ' + padRight('Method', 22) + padLeft('Result size', 14) + padLeft('Est. time', 14));
    lines.push('    ' + '─'.repeat(50));

    if (ce['gzip-standard']) {
      lines.push('    ' + padRight('gzip (standard)', 22) +
        padLeft(formatBytes(ce['gzip-standard'].size_bytes || 0), 14) +
        padLeft(formatDuration(ce['gzip-standard'].time_seconds || 0), 14));
    }
    if (ce['zstd-fast']) {
      lines.push('    ' + padRight('zstd (fast)', 22) +
        padLeft(formatBytes(ce['zstd-fast'].size_bytes || 0), 14) +
        padLeft(formatDuration(ce['zstd-fast'].time_seconds || 0), 14));
    }
    if (ce['zstd-max']) {
      lines.push('    ' + padRight('zstd (max)', 22) +
        padLeft(formatBytes(ce['zstd-max'].size_bytes || 0), 14) +
        padLeft(formatDuration(ce['zstd-max'].time_seconds || 0), 14));
    }

    lines.push('');

    // Disk space
    lines.push(sep);
    lines.push('');
    lines.push('  Disk Space:');
    lines.push('');
    lines.push('    ' + padRight('Backup location', 28) + (data.target_directory || '?'));
    lines.push('    ' + padRight('Available space', 28) + formatBytes(data.available_bytes || 0));

    if (data.same_disk_as_evi) {
      lines.push('');
      lines.push('    Note: backup location is on the same disk as EVI data.');
      lines.push('    Consider using an external or mounted drive for safety.');
    }

    // Enough space check
    var estCompressed = data.estimated_compressed_bytes || 0;
    var available = data.available_bytes || 0;
    lines.push('');
    if (available > 0 && estCompressed > 0) {
      if (available > estCompressed * 1.5) {
        lines.push('    Sufficient space available for backup.');
      } else if (available > estCompressed) {
        lines.push('    Space is tight. Consider freeing up disk before backup.');
      } else {
        lines.push('    WARNING: Not enough disk space for estimated backup size!');
      }
    }

    lines.push('');

    return lines.join('\n');
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
    hideProgress();
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
    // The backup location is pre-filled to ~/evi/backup in the HTML value attribute.
    // The dispatcher get-defaults provides the resolved home directory path (must run as current user, not root).
    var proc = cockpit.spawn([DISPATCH_PATH, 'get-defaults'], {
      err: 'out'
    });

    proc.then(function (data) {
      var lines = data.split('\n');
      for (var i = 0; i < lines.length; i++) {
        var parts = lines[i].split('=');
        if (parts.length >= 2) {
          var key = parts[0];
          var val = parts.slice(1).join('=');
          if (key === 'DEFAULT_BACKUP_DIR' && val) {
            state.defaultBackupDir = val;
            // Keep ~/evi/backup in the UI; resolved path is used only when calling scripts
          }
        }
      }
    });

    proc.catch(function () {
      // Dispatcher not installed — keep the pre-filled ~/evi/backup value
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
    els.btnTogglePassword = document.getElementById('btn-toggle-password');
    els.iconEye = els.btnTogglePassword ? els.btnTogglePassword.querySelector('.evi-admin-icon-eye') : null;
    els.iconEyeOff = els.btnTogglePassword ? els.btnTogglePassword.querySelector('.evi-admin-icon-eye-off') : null;
    els.btnStart = document.getElementById('btn-backup-start');
    els.btnEstimate = document.getElementById('btn-backup-estimate');
    els.btnClear = document.getElementById('btn-backup-clear');
    els.status = document.getElementById('backup-status');
    els.progressWrapper = document.getElementById('backup-progress');
    els.progressFill = document.getElementById('backup-progress-fill');
    els.progressText = document.getElementById('backup-progress-text');
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
