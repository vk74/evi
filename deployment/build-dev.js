#!/usr/bin/env node

// evi Local Podman Build & Management Script
// Version: 2.1.0 (Fixes and Improvements)
// Description: A streamlined Node.js script to manage the local Podman environment for evi.
// Interactive menu system with submenus for container management operations.
//
// Changes in v2.1.0:
// - Fixed container detection and statistics logic (handling JSON Array vs JSON Lines output)
// - Improved cross-platform PATH resolution (Mac/Linux), including Homebrew paths
// - Added automatic detection of 'podman-compose' vs 'podman compose'
// - Robust JSON parsing for Podman output
// - Enhanced error reporting and command execution checks

const { execSync, spawnSync } = require('child_process');
const readline = require('readline');
const fs = require('fs');
const path = require('path');

// --- Configuration ---
const COMPOSE_FILE = 'deployment/podman-compose-dev.yml';
const ENV_FILE = '.env.local'; // Optional file for environment variables

// Global variable to store detected compose command
let CACHED_COMPOSE_CMD = null;

// ANSI colors for better output visibility
const colors = {
  reset: "\x1b[0m",
  bright: "\x1b[1m",
  cyan: "\x1b[36m",
  green: "\x1b[32m",
  red: "\x1b[31m",
  yellow: "\x1b[33m",
  blue: "\x1b[34m",
};

// --- Helper Functions ---

/**
 * Checks if .env.local file exists.
 * @returns {boolean} True if .env.local exists, false otherwise.
 */
function envFileExists() {
  return fs.existsSync(ENV_FILE);
}

/**
 * Enhanced environment setup for command execution.
 * Ensures Podman and other tools are found in PATH.
 */
function getEnv() {
  const env = { ...process.env };
  if (process.platform === 'darwin') {
    // Add common paths for Mac (Homebrew, standard local, Podman specific)
    const extraPaths = [
      '/opt/podman/bin',
      '/opt/homebrew/bin',
      '/usr/local/bin',
      '/usr/bin',
      '/bin',
      '/usr/sbin',
      '/sbin'
    ];
    
    // Add Python user bin paths (for podman-compose via pip)
    const pythonVersions = ['3.13', '3.12', '3.11', '3.10', '3.9', '3.8'];
    const pythonUserBins = pythonVersions.map(v => `${process.env.HOME}/Library/Python/${v}/bin`);
    
    const currentPath = env.PATH || '';
    const newPath = [...extraPaths, ...pythonUserBins, currentPath].join(':');
    env.PATH = newPath;
  }
  return env;
}

/**
 * Executes a shell command synchronously and returns the output as string.
 * Used for getting command results without printing to console.
 * @param {string} command - The command to execute.
 * @param {boolean} ignoreErrors - If true, returns empty string on error instead of throwing.
 * @returns {string} Command output or empty string if ignoreErrors is true and command failed.
 */
function runCommandSilent(command, ignoreErrors = false) {
  try {
    const output = execSync(command, { 
      stdio: ['pipe', 'pipe', 'pipe'], 
      env: getEnv(), 
      encoding: 'utf8',
      timeout: 10000 // 10s timeout to prevent hanging
    });
    return output.trim();
  } catch (error) {
    if (ignoreErrors) {
      return '';
    }
    throw error;
  }
}

/**
 * Robustly parses Podman JSON output.
 * Handles both JSON Array (one large array) and JSON Lines (one object per line).
 * @param {string} output - The raw stdout from podman command.
 * @returns {Array} Array of parsed objects.
 */
function parsePodmanOutput(output) {
  if (!output || !output.trim()) return [];
  
  const trimmed = output.trim();
  
  // Method 1: Try parsing as a single JSON entity (Array or Object)
  try {
    const parsed = JSON.parse(trimmed);
    if (Array.isArray(parsed)) {
      return parsed;
    } else if (parsed && typeof parsed === 'object') {
      return [parsed];
    }
  } catch (e) {
    // Not a single JSON structure, fall through to line-by-line
  }

  // Method 2: Try parsing as JSON Lines (NDJSON)
  const results = [];
  const lines = trimmed.split('\n');
  
  for (const line of lines) {
    const lineTrimmed = line.trim();
    if (!lineTrimmed) continue;
    
    try {
      const parsedLine = JSON.parse(lineTrimmed);
      results.push(parsedLine);
    } catch (e) {
      // If a line is not valid JSON, we skip it.
      // This handles cases where there might be some noise output.
    }
  }
  
  return results;
}

/**
 * Detects the best Podman Compose command available.
 * Checks for 'podman-compose' then 'podman compose'.
 * @returns {string} The command to use (e.g., 'podman-compose' or 'podman compose').
 */
function detectComposeCommand() {
  if (CACHED_COMPOSE_CMD) return CACHED_COMPOSE_CMD;

  log('🔍 Detecting Podman Compose command...', colors.cyan);

  const env = getEnv();
  const options = { stdio: 'ignore', env };

  // 1. Try 'podman-compose' (standalone)
  try {
    execSync('podman-compose --version', options);
    CACHED_COMPOSE_CMD = 'podman-compose';
    log('   Using: podman-compose', colors.green);
    return CACHED_COMPOSE_CMD;
  } catch (e) {}

  // 2. Try 'podman compose' (plugin)
  try {
    execSync('podman compose version', options);
    CACHED_COMPOSE_CMD = 'podman compose';
    log('   Using: podman compose', colors.green);
    return CACHED_COMPOSE_CMD;
  } catch (e) {}

  // 3. Fallback based on OS preference (soft fail)
  if (process.platform === 'darwin') {
     CACHED_COMPOSE_CMD = 'podman-compose';
  } else {
     CACHED_COMPOSE_CMD = 'podman compose';
  }
  
  log(`   Defaulting to: ${CACHED_COMPOSE_CMD} (detection failed, might not work)`, colors.yellow);
  return CACHED_COMPOSE_CMD;
}

/**
 * Gets the Podman compose command string.
 * @param {string} command - The compose command (e.g., 'build', 'up', 'down').
 * @param {string} additionalArgs - Additional arguments to append.
 * @returns {string} The complete podman compose command.
 */
function getComposeCommand(command, additionalArgs = '') {
  const composeCmd = detectComposeCommand();
  let cmd = `${composeCmd} -f "${COMPOSE_FILE}"`;
  cmd += ` ${command}`;
  if (additionalArgs && additionalArgs.trim()) {
    cmd += ` ${additionalArgs.trim()}`;
  }
  return cmd;
}

/**
 * Prints a formatted message to the console.
 */
function log(message, color = colors.reset, isBold = false) {
  const style = isBold ? colors.bright : '';
  console.log(`${style}${color}%s${colors.reset}`, message);
}

/**
 * Executes a shell command synchronously and prints its output.
 */
function runCommand(command, description, quiet = false) {
  log(`\n🚀 Executing: ${description}...`, colors.yellow, true);
  if (!quiet) {
    log(`   Command: ${command}`, colors.reset);
  }
  const startTime = Date.now();
  try {
    const stdio = quiet ? ['pipe', 'pipe', 'pipe'] : 'inherit';
    execSync(command, { stdio, env: getEnv() });
    const endTime = Date.now();
    const duration = ((endTime - startTime) / 1000).toFixed(2);
    log(`✅ Success: "${description}" completed in ${duration}s.`, colors.green);
    return parseFloat(duration);
  } catch (error) {
    log(`❌ Error: "${description}" failed.`, colors.red, true);
    if (quiet) {
      log(`   Command: ${command}`, colors.red);
      log(`   Error: ${error.message}`, colors.red);
      if (error.stderr) {
         log(`   Stderr: ${error.stderr.toString()}`, colors.red);
      }
    }
    throw error;
  }
}

// --- Podman Specific Functions ---

/**
 * Checks if Podman Machine is running (MacOS/Windows) and starts it if needed.
 */
function checkAndStartPodmanMachine() {
  const isMac = process.platform === 'darwin';
  const isWin = process.platform === 'win32';
  
  if (!isMac && !isWin) {
    return; // Linux usually runs native
  }

  log('\n🐳 Checking Podman Machine status...', colors.cyan);

  try {
    runCommandSilent('podman info');
    log('✅ Podman Machine is running.', colors.green);
    return;
  } catch (e) {
    log('⚠️  Podman Machine is NOT running (or info failed).', colors.yellow);
  }

  log('🚀 Starting Podman Machine...', colors.yellow, true);
  try {
      runCommand('podman machine start', 'Start Podman Machine');
  } catch (e) {
      if (e.message.includes('already running') || (e.stdout && e.stdout.includes('already running')) || (e.stderr && e.stderr.includes('already running'))) {
           log('✅ Podman Machine was already running.', colors.green);
           return;
      }
      throw e;
  }
}

/**
 * Gets the podman command.
 * @returns {string} The podman command.
 */
function getPodmanCommand() {
  return 'podman'; // We rely on PATH resolution in getEnv()
}

/**
 * Checks if a volume exists.
 */
function volumeExists(volumeName) {
  try {
    const podmanCmd = getPodmanCommand();
    // Use json format to be sure
    const output = runCommandSilent(`${podmanCmd} volume inspect ${volumeName} --format json`, true);
    const parsed = parsePodmanOutput(output);
    return parsed && parsed.length > 0;
  } catch (error) {
    return false;
  }
}

/**
 * Checks if a container exists and is running.
 */
function getContainerStatus(containerName) {
  try {
    const podmanCmd = getPodmanCommand();
    // Using simple filter might return substring matches, so we iterate results
    const output = runCommandSilent(`${podmanCmd} ps -a --filter name=${containerName} --format json`, true);
    const containers = parsePodmanOutput(output);
    
    if (!containers || containers.length === 0) {
      return { exists: false, isRunning: false };
    }
    
    for (const container of containers) {
       // Normalize names: remove leading / if present (Docker/Podman convention)
       const names = (container.Names || []).map(n => n.startsWith('/') ? n.slice(1) : n);
       // Also check Name field
       if (container.Name) names.push(container.Name.startsWith('/') ? container.Name.slice(1) : container.Name);
       
       // Precise match or contains
       if (names.includes(containerName) || names.some(n => n === containerName)) {
           const state = (container.State || '').toLowerCase();
           const status = (container.Status || '').toLowerCase();
           const isRunning = state === 'running' || status.includes('up');
           return { exists: true, isRunning };
       }
    }
    
    return { exists: false, isRunning: false };
  } catch (error) {
    return { exists: false, isRunning: false };
  }
}

/**
 * Gets all containers with their details.
 */
function getAllContainers() {
  try {
    const podmanCmd = getPodmanCommand();
    const output = runCommandSilent(`${podmanCmd} ps -a --format json`, true);
    return parsePodmanOutput(output);
  } catch (error) {
    return [];
  }
}

/**
 * Gets container stats (current resource usage).
 */
function getContainerStats(containerName) {
  try {
    const podmanCmd = getPodmanCommand();
    const output = runCommandSilent(`${podmanCmd} stats --no-stream --format json ${containerName}`, true);
    const statsList = parsePodmanOutput(output);
    
    if (!statsList || statsList.length === 0) return null;
    
    // Find the specific container stats
    return statsList.find(s => {
        const name = s.Name || '';
        return name === containerName || name.includes(containerName);
    }) || statsList[0]; // Fallback to first if only one requested
  } catch (error) {
    return null;
  }
}

/**
 * Gets container inspect data.
 */
function getContainerInspect(containerName) {
  try {
    if (!containerName) return null;
    const podmanCmd = getPodmanCommand();
    const output = runCommandSilent(`${podmanCmd} inspect ${containerName} --format json`, true);
    const inspected = parsePodmanOutput(output);
    return inspected && inspected.length > 0 ? inspected[0] : null;
  } catch (error) {
    return null;
  }
}

/**
 * Gets volume information including size.
 */
function getVolumeInfo(volumeName) {
  try {
    const podmanCmd = getPodmanCommand();
    const output = runCommandSilent(`${podmanCmd} volume inspect ${volumeName} --format json`, true);
    const volumes = parsePodmanOutput(output);
    return volumes && volumes.length > 0 ? volumes[0] : null;
  } catch (error) {
    return null;
  }
}

/**
 * Formats bytes to human-readable size.
 */
function formatBytes(bytes) {
  if (bytes === undefined || bytes === null || bytes === '') return 'N/A';
  const num = Number(bytes);
  if (isNaN(num)) return bytes; // return as is if not a number
  if (num === 0) return '0 B';
  
  const k = 1024;
  const sizes = ['B', 'KB', 'MB', 'GB', 'TB'];
  const i = Math.floor(Math.log(num) / Math.log(k));
  return Math.round(num / Math.pow(k, i) * 100) / 100 + ' ' + sizes[i];
}

/**
 * Formats duration in seconds to human-readable string.
 */
function formatUptime(seconds) {
  if (!seconds || seconds === 0) return '0s';
  const days = Math.floor(seconds / 86400);
  const hours = Math.floor((seconds % 86400) / 3600);
  const mins = Math.floor((seconds % 3600) / 60);
  const secs = Math.floor(seconds % 60);
  
  const parts = [];
  if (days > 0) parts.push(`${days}d`);
  if (hours > 0) parts.push(`${hours}h`);
  if (mins > 0) parts.push(`${mins}m`);
  if (secs > 0 || parts.length === 0) parts.push(`${secs}s`);
  
  return parts.join(' ');
}

// --- Core Workflow Functions ---

function cleanAll() {
  const timings = {};
  log('\n🧹 Cleaning up ALL Podman artifacts...', colors.cyan, true);
  
  try {
    const cmd = getComposeCommand('down', '-v --rmi all');
    timings['Stop & Remove (Compose)'] = runCommand(cmd, 'Stop Containers, Remove Volumes & Images');
  } catch (e) {
    log('   (Ignored error during down - might not be running)', colors.yellow);
  }

  // Force remove known containers just in case
  try {
    const podmanCmd = getPodmanCommand();
    const containers = ['evi-db', 'evi-backend-local', 'evi-frontend-local'];
    runCommandSilent(`${podmanCmd} rm -f ${containers.join(' ')}`, true);
  } catch (e) {}

  // Prune network, images, builder, volumes
  const pruneCmds = [
      { cmd: 'network prune -f', name: 'Remove Networks' },
      { cmd: 'image prune -af', name: 'Remove Images' },
      { cmd: 'builder prune -af', name: 'Clean Build Cache' },
      { cmd: 'volume prune -f', name: 'Prune Volumes' }
  ];

  const podmanCmd = getPodmanCommand();
  for (const item of pruneCmds) {
      try {
          timings[item.name] = runCommand(`${podmanCmd} ${item.cmd}`, item.name, true);
      } catch(e) {}
  }

  return timings;
}

function buildAndStartDB() {
  const timings = {};
  log('\n🐘 Starting Database Container...', colors.cyan, true);

  const podmanCmd = getPodmanCommand();
  timings['Pull postgres:17'] = runCommand(
    `${podmanCmd} pull docker.io/postgres:17`,
    'Pull latest postgres:17 base image'
  );

  timings['Build DB'] = runCommand(
    getComposeCommand('build', 'evi-database'),
    'Build Database Image'
  );

  timings['Start DB'] = runCommand(
    getComposeCommand('up', '-d evi-database'),
    'Start Database Service'
  );

  return timings;
}

function buildAndStartDBFromCache() {
  const timings = {};
  log('\n🐘 Starting Database Container from CACHE...', colors.cyan, true);

  const originalPullPolicy = process.env.BUILDAH_PULL_NEVER;
  process.env.BUILDAH_PULL_NEVER = '1';

  try {
    timings['Build DB (cache only)'] = runCommand(
      getComposeCommand('build', 'evi-database'),
      'Build Database Image (cache only)'
    );

    timings['Start DB'] = runCommand(
      getComposeCommand('up', '-d evi-database'),
      'Start Database Service'
    );
  } finally {
    if (originalPullPolicy === undefined) {
      delete process.env.BUILDAH_PULL_NEVER;
    } else {
      process.env.BUILDAH_PULL_NEVER = originalPullPolicy;
    }
  }

  return timings;
}

function showSummary(timings) {
  log('\n📊 Execution Summary:', colors.blue, true);
  log('-------------------------', colors.blue);
  let total = 0;
  for (const [action, time] of Object.entries(timings)) {
    log(`${action.padEnd(30)}: ${time.toFixed(2)}s`);
    total += time;
  }
  log('-------------------------', colors.blue);
  log(`${'Total Time'.padEnd(30)}: ${total.toFixed(2)}s`, colors.blue, true);
}

function showContainersDetails() {
  log('\n📋 Current Containers Details:', colors.cyan, true);
  log('========================================', colors.cyan);
  
  const containers = getAllContainers();
  
  if (containers.length === 0) {
    log('No containers found.', colors.yellow);
    return;
  }
  
  for (const container of containers) {
    let containerName = 'Unknown';
    if (container.Names) {
      if (Array.isArray(container.Names)) {
        containerName = container.Names[0] || 'Unknown';
      } else {
        containerName = container.Names;
      }
    } else if (container.Name) {
      containerName = container.Name;
    }
    
    // Clean name
    if (containerName.startsWith('/')) containerName = containerName.slice(1);

    const status = container.Status || container.State || 'Unknown';
    log(`\n${colors.bright}${colors.cyan}Container: ${containerName}${colors.reset}`, colors.cyan);
    log(`  Status: ${status}`, colors.reset);
    
    // Get stats
    const isRunning = (container.State === 'running') || (status.toLowerCase().includes('up'));
    const stats = isRunning ? getContainerStats(containerName) : null;
    const inspect = getContainerInspect(containerName);
    
    // Volumes
    if (inspect && inspect.Mounts) {
      const volumes = inspect.Mounts.filter(m => m.Type === 'volume');
      if (volumes.length > 0) {
        log(`  Volumes:`, colors.reset);
        for (const vol of volumes) {
          const volInfo = getVolumeInfo(vol.Name);
          let sizeStr = 'N/A';
          if (volInfo) {
              const size = volInfo.UsageData?.Size || volInfo.Size;
              sizeStr = formatBytes(size);
          }
          log(`    - ${vol.Name}: ${sizeStr}`, colors.reset);
        }
      }
    }
    
    // Stats
    if (stats) {
      const memUsage = stats.MemUsage || stats.MemUsageRaw || 'N/A';
      const memLimit = stats.MemLimit || stats.MemLimitRaw || 'N/A';
      log(`  RAM Usage: ${memUsage} / ${memLimit}`, colors.reset);
      
      const cpu = stats.CPU || stats.CPUPerc || 'N/A';
      log(`  CPU Usage: ${cpu}`, colors.reset);
    }
    
    // Uptime (calculated if not present in stats)
    if (stats && stats.UpTime) {
         log(`  Uptime: ${stats.UpTime}`, colors.reset);
    } else if (inspect && inspect.State && inspect.State.StartedAt && isRunning) {
         const started = new Date(inspect.State.StartedAt);
         const now = new Date();
         const seconds = Math.floor((now - started) / 1000);
         log(`  Uptime: ${formatUptime(seconds)}`, colors.reset);
    }

    log('  ---', colors.reset);
  }
  log('\n', colors.reset);
}

function deleteDBContainerOnly() {
  const timings = {};
  log('\n🗑️  Deleting DB Container Only...', colors.cyan, true);
  
  const containerName = 'evi-db';
  const status = getContainerStatus(containerName);
  
  if (!status.exists) {
    log(`Container ${containerName} does not exist.`, colors.yellow);
    return timings;
  }
  
  try {
    const podmanCmd = getPodmanCommand();
    
    if (status.isRunning) {
      timings['Stop Container'] = runCommand(
        `${podmanCmd} stop ${containerName}`,
        'Stop DB Container',
        true
      );
    }
    
    timings['Remove Container'] = runCommand(
      `${podmanCmd} rm ${containerName}`,
      'Remove DB Container',
      true
    );
    
    log('✅ DB container deleted successfully. Volume preserved.', colors.green);
  } catch (error) {
    log(`❌ Failed to delete container: ${error.message}`, colors.red, true);
    throw error;
  }
  
  return timings;
}

function deleteDBContainerAndVolume() {
  const timings = {};
  log('\n🗑️  Deleting DB Container and Volume...', colors.cyan, true);
  
  const podmanCmd = getPodmanCommand();
  const volumeName = 'evi_db_volume';
  const containerName = 'evi-db';
  
  try {
    // First, stop and remove container by name
    const status = getContainerStatus(containerName);
    if (status.exists) {
      if (status.isRunning) {
        timings['Stop Container'] = runCommand(
          `${podmanCmd} stop ${containerName}`,
          'Stop DB Container',
          true
        );
      }
      timings['Remove Container'] = runCommand(
        `${podmanCmd} rm ${containerName}`,
        'Remove DB Container',
        true
      );
    }
    
    // Try compose down as well
    try {
      const cmd = getComposeCommand('down', '-v evi-database');
      runCommand(cmd, 'Stop Container and Remove Volume (compose)', true);
    } catch (e) {
      // Ignore compose errors if container doesn't exist
    }
    
    // Remove the volume if it still exists
    if (volumeExists(volumeName)) {
      timings['Remove Volume'] = runCommand(
        `${podmanCmd} volume rm ${volumeName}`,
        'Remove Volume',
        true
      );
    }
    
    log('✅ DB container and volume deleted successfully.', colors.green);
  } catch (error) {
    log(`❌ Failed to delete container and volume: ${error.message}`, colors.red, true);
    throw error;
  }
  
  return timings;
}

async function buildDBWithVolume(useCache, seedDemoData = false) {
  const timings = {};
  const volumeName = 'evi_db_volume';
  
  log('\n🐘 Building DB Container with Volume...', colors.cyan, true);
  if (seedDemoData) {
    log('   Demo catalog data will be seeded.', colors.yellow);
  }
  
  if (volumeExists(volumeName)) {
    log(`❌ Error: Volume ${volumeName} already exists.`, colors.red, true);
    log('   Cannot build with new volume when volume already exists.', colors.red);
    throw new Error(`Volume ${volumeName} already exists`);
  }
  
  try {
    const podmanCmd = getPodmanCommand();
    if (!useCache) {
      timings['Pull postgres:17'] = runCommand(
        `${podmanCmd} pull docker.io/postgres:17`,
        'Pull latest postgres:17 base image'
      );
    } else {
      log('📦 Using cached images only...', colors.yellow);
    }
    
    const originalPullPolicy = process.env.BUILDAH_PULL_NEVER;
    if (useCache) process.env.BUILDAH_PULL_NEVER = '1';
    
    const originalSeedDemoData = process.env.SEED_DEMO_DATA;
    process.env.SEED_DEMO_DATA = seedDemoData ? 'true' : 'false';
    
    try {
      timings['Build DB'] = runCommand(
        getComposeCommand('build', 'evi-database'),
        useCache ? 'Build Database Image (cache only)' : 'Build Database Image'
      );
      
      log('\n🚀 Starting container for initialization...', colors.cyan, true);
      timings['Start DB'] = runCommand(
        getComposeCommand('up', '-d evi-database'),
        'Start Database Service for Initialization'
      );
      
      log('⏳ Waiting for database initialization...', colors.yellow);
      const podmanCmd = getPodmanCommand();
      let retries = 30;
      let dbReady = false;
      while (retries > 0 && !dbReady) {
        try {
          runCommandSilent(`${podmanCmd} exec evi-db pg_isready -U postgres`, false);
          dbReady = true;
        } catch (e) {
          retries--;
          await new Promise(resolve => setTimeout(resolve, 1000));
        }
      }
      
      if (!dbReady) throw new Error('Database did not become ready within timeout period');
      
      log('⏳ Waiting for scripts to complete...', colors.yellow);
      await new Promise(resolve => setTimeout(resolve, 10000));
      
    } finally {
      if (useCache) {
        if (originalPullPolicy === undefined) delete process.env.BUILDAH_PULL_NEVER;
        else process.env.BUILDAH_PULL_NEVER = originalPullPolicy;
      }
      if (originalSeedDemoData === undefined) delete process.env.SEED_DEMO_DATA;
      else process.env.SEED_DEMO_DATA = originalSeedDemoData;
    }
    
    log('✅ DB container built and initialized successfully.', colors.green);
  } catch (error) {
    log(`❌ Failed to build container: ${error.message}`, colors.red, true);
    throw error;
  }
  
  return timings;
}

function buildDBForExistingVolume(useCache) {
  const timings = {};
  const volumeName = 'evi_db_volume';
  
  log('\n🐘 Building DB Container for Existing Volume...', colors.cyan, true);
  
  if (!volumeExists(volumeName)) {
    log(`❌ Error: Volume ${volumeName} does not exist.`, colors.red, true);
    throw new Error(`Volume ${volumeName} does not exist`);
  }
  
  try {
    const podmanCmd = getPodmanCommand();
    if (!useCache) {
      timings['Pull postgres:17'] = runCommand(
        `${podmanCmd} pull docker.io/postgres:17`,
        'Pull latest postgres:17 base image'
      );
    } else {
      log('📦 Using cached images only...', colors.yellow);
    }
    
    const originalPullPolicy = process.env.BUILDAH_PULL_NEVER;
    if (useCache) process.env.BUILDAH_PULL_NEVER = '1';
    
    try {
      timings['Build DB'] = runCommand(
        getComposeCommand('build', 'evi-database'),
        useCache ? 'Build Database Image (cache only)' : 'Build Database Image'
      );
    } finally {
      if (useCache) {
        if (originalPullPolicy === undefined) delete process.env.BUILDAH_PULL_NEVER;
        else process.env.BUILDAH_PULL_NEVER = originalPullPolicy;
      }
    }
    
    log('✅ DB container built successfully.', colors.green);
  } catch (error) {
    log(`❌ Failed to build container: ${error.message}`, colors.red, true);
    throw error;
  }
  
  return timings;
}

function runDBContainer() {
  const timings = {};
  log('\n🚀 Running DB Container...', colors.cyan, true);
  
  const containerName = 'evi-db';
  const status = getContainerStatus(containerName);
  
  if (status.isRunning) {
    log(`⚠️  Container ${containerName} is already running.`, colors.yellow, true);
    return timings;
  }
  
  try {
    timings['Start DB'] = runCommand(
      getComposeCommand('up', '-d evi-database'),
      'Start Database Service'
    );
    log('✅ DB container started successfully.', colors.green);
  } catch (error) {
    log(`❌ Failed to start container: ${error.message}`, colors.red, true);
    throw error;
  }
  
  return timings;
}

// --- Menu Functions ---

async function showDemoDataSubMenu(useCache, buildType) {
  const rl = readline.createInterface({ input: process.stdin, output: process.stdout });
  const menu = `
${colors.cyan}Demo Data Options:${colors.reset}
${colors.yellow}[1]${colors.reset} Deploy without demo data
${colors.yellow}[2]${colors.reset} Deploy and seed demo catalog data
`;
  console.log(menu);
  return new Promise((resolve) => {
    rl.question('Select option: ', async (option) => {
      rl.close();
      let timings = {};
      const scriptStartTime = Date.now();
      try {
        const seedDemoData = option.trim() === '2';
        if (buildType === 'withVolume') {
          timings = await buildDBWithVolume(useCache, seedDemoData);
        } else if (buildType === 'forExistingVolume') {
          timings = await buildDBForExistingVolume(useCache);
        } else {
          log('❌ Invalid build type.', colors.red, true);
          resolve(); return;
        }
        const scriptEndTime = Date.now();
        timings['Total Duration'] = parseFloat(((scriptEndTime - scriptStartTime) / 1000).toFixed(2));
        showSummary(timings);
        log('\n🎉 Done!', colors.green, true);
        resolve();
      } catch (e) {
        log(`\n❌ Script failed: ${e.message}`, colors.red, true);
        resolve();
      }
    });
  });
}

async function showBuildSubMenu(buildType) {
  const rl = readline.createInterface({ input: process.stdin, output: process.stdout });
  const menu = `
${colors.cyan}Build Options:${colors.reset}
${colors.yellow}[1]${colors.reset} Build container from cache (use previously downloaded code)
${colors.yellow}[2]${colors.reset} Pull latest container version
`;
  console.log(menu);
  return new Promise((resolve) => {
    rl.question('Select option: ', async (option) => {
      rl.close();
      try {
        const useCache = option.trim() === '1';
        if (buildType === 'withVolume') await showDemoDataSubMenu(useCache, buildType);
        else if (buildType === 'forExistingVolume') {
          let timings = {};
          const scriptStartTime = Date.now();
          timings = await buildDBForExistingVolume(useCache);
          const scriptEndTime = Date.now();
          timings['Total Duration'] = parseFloat(((scriptEndTime - scriptStartTime) / 1000).toFixed(2));
          showSummary(timings);
          log('\n🎉 Done!', colors.green, true);
        }
        resolve();
      } catch (e) {
        log(`\n❌ Script failed: ${e.message}`, colors.red, true);
        resolve();
      }
    });
  });
}

async function showSubMenu(menuType) {
  const rl = readline.createInterface({ input: process.stdin, output: process.stdout });
  let menu = '';
  let options = {};

  if (menuType === 'delete') {
    menu = `
${colors.cyan}Delete Options:${colors.reset}
${colors.yellow}[1]${colors.reset} Delete DB container only
${colors.yellow}[2]${colors.reset} Delete DB container and volume
`;
    options = {
      '1': () => deleteDBContainerOnly(),
      '2': () => deleteDBContainerAndVolume()
    };
  } else if (menuType === 'build') {
    menu = `
${colors.cyan}Build Options:${colors.reset}
${colors.yellow}[1]${colors.reset} Build DB container and volume (no current DB volume should exist)
${colors.yellow}[2]${colors.reset} Build DB container for existing DB volume
`;
    options = {
      '1': () => showBuildSubMenu('withVolume'),
      '2': () => showBuildSubMenu('forExistingVolume')
    };
  } else if (menuType === 'run') {
    menu = `
${colors.cyan}Run Options:${colors.reset}
${colors.yellow}[1]${colors.reset} Run DB container
`;
    options = { '1': () => runDBContainer() };
  } else {
    log('❌ Invalid menu type.', colors.red, true);
    return;
  }

  console.log(menu);
  return new Promise((resolve) => {
    rl.question('Select option: ', async (option) => {
      rl.close();
      let timings = {};
      const scriptStartTime = Date.now();
      try {
        const action = options[option.trim()];
        if (!action) {
          log('❌ Invalid option.', colors.red, true);
          resolve(); return;
        }
        if (menuType === 'build') {
          await action();
        } else {
          timings = action();
          const scriptEndTime = Date.now();
          timings['Total Duration'] = parseFloat(((scriptEndTime - scriptStartTime) / 1000).toFixed(2));
          showSummary(timings);
          log('\n🎉 Done!', colors.green, true);
        }
        resolve();
      } catch (e) {
        log(`\n❌ Script failed: ${e.message}`, colors.red, true);
        resolve();
      }
    });
  });
}

async function mainMenu() {
  const rl = readline.createInterface({ input: process.stdin, output: process.stdout });
  const menu = `
${colors.cyan}=========================================${colors.reset}
${colors.cyan}  evi Local Podman Manager${colors.reset}
${colors.cyan}=========================================${colors.reset}
${colors.yellow}[1]${colors.reset} 📋 Show current containers details
${colors.yellow}[2]${colors.reset} 🗑️  Delete container(s) / volume(s)
${colors.yellow}[3]${colors.reset} 🔨 Build container(s)
${colors.yellow}[4]${colors.reset} 🚀 Run container(s)
${colors.yellow}[5]${colors.reset} Exit
`;
  console.log(menu);
  rl.question('Select option: ', async (option) => {
    rl.close();
    try {
      switch (option.trim()) {
        case '1': showContainersDetails(); break;
        case '2': await showSubMenu('delete'); break;
        case '3': await showSubMenu('build'); break;
        case '4': await showSubMenu('run'); break;
        case '5': log('👋 Exiting.', colors.yellow); return;
        default: log('❌ Invalid option.', colors.red, true); return;
      }
    } catch (e) {
      log(`\n❌ Script failed: ${e.message}`, colors.red, true);
      process.exit(1);
    }
  });
}

async function main() {
  try {
    if (!fs.existsSync(COMPOSE_FILE)) {
      log(`❌ Error: Compose file not found at "${COMPOSE_FILE}"`, colors.red, true);
      process.exit(1);
    }
    
    // Initial check for Podman
    try {
        const env = getEnv();
        execSync('podman --version', { stdio: 'ignore', env });
    } catch (e) {
        log('❌ Error: "podman" command not found in PATH.', colors.red, true);
        log('   Please install Podman or check your PATH environment variable.', colors.yellow);
        process.exit(1);
    }

    checkAndStartPodmanMachine();
    
    // Auto-detect compose command on startup
    detectComposeCommand();

    const args = process.argv.slice(2);
    if (args.includes('--clean')) {
      cleanAll();
      process.exit(0);
    }
    mainMenu();
  } catch (e) {
    log(`Unexpected error: ${e.message}`, colors.red, true);
    process.exit(1);
  }
}

main();