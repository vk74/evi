#!/usr/bin/env node

// evi Local Podman Build & Management Script
// Version: 1.1.1 (Postgres 17 + pg_cron cache modes)
// Description: A streamlined Node.js script to manage the local Podman environment for evi.
// Now focuses on "Database First" workflow.
//
// Changes in v1.1:
// - Added explicit podman pull for postgres:17 to refresh local image cache before DB rebuild
// - Added option to build & start DB using cached images only (no remote pulls) for offline/fast startup
//
// Changes in v1.1.1:
// - Fixed podman pull command to use full image name (docker.io/postgres:17) to resolve short-name resolution issues
// - Added cross-platform support: uses podman-compose on macOS and podman compose on Linux

const { execSync } = require('child_process');
const readline = require('readline');
const fs = require('fs');

// --- Configuration ---
const COMPOSE_FILE = 'deployment/local/podman-compose.yml';
const ENV_FILE = '.env.local'; // Optional file for environment variables

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
 * Gets the Podman compose command based on the operating system.
 * - macOS: Uses 'podman-compose' (Python-based standalone tool)
 * - Linux: Uses 'podman compose' (built-in Podman compose plugin)
 * @param {string} command - The compose command (e.g., 'build', 'up', 'down').
 * @param {string} additionalArgs - Additional arguments to append.
 * @returns {string} The complete podman compose command for the current platform.
 */
function getComposeCommand(command, additionalArgs = '') {
  const isMac = process.platform === 'darwin';
  const isLinux = process.platform === 'linux';
  
  // On macOS, use podman-compose (Python-based standalone tool)
  // On Linux, use podman compose (built-in command)
  const composeCmd = isMac ? 'podman-compose' : 'podman compose';
  
  let cmd = `${composeCmd} -f "${COMPOSE_FILE}"`;
  
  cmd += ` ${command}`;
  
  // Add additional arguments if provided
  if (additionalArgs && additionalArgs.trim()) {
    cmd += ` ${additionalArgs.trim()}`;
  }
  
  return cmd;
}

/**
 * Prints a formatted message to the console.
 * @param {string} message - The message to print.
 * @param {string} color - The color to use for the message.
 * @param {boolean} isBold - Whether to make the text bold.
 */
function log(message, color = colors.reset, isBold = false) {
  const style = isBold ? colors.bright : '';
  console.log(`${style}${color}%s${colors.reset}`, message);
}

/**
 * Executes a shell command synchronously and prints its output.
 * Records and returns the execution time.
 * @param {string} command - The command to execute.
 * @param {string} description - A description of the action being performed.
 * @param {boolean} quiet - If true, suppresses command output (default: false).
 */
function runCommand(command, description, quiet = false) {
  log(`\n🚀 Executing: ${description}...`, colors.yellow, true);
  if (!quiet) {
    log(`   Command: ${command}`, colors.reset);
  }
  const startTime = Date.now();
  try {
    const stdio = quiet ? ['pipe', 'pipe', 'pipe'] : 'inherit';
    // Add /opt/podman/bin and Python user bin directories to PATH for the child process on macOS
    // This fixes "command not found" when running from IDEs/scripts where PATH might differ
    // On macOS, podman-compose is installed via pip, so we need to include Python bin paths
    const env = { ...process.env };
    if (process.platform === 'darwin') {
        // Try to find podman-compose in common Python user bin locations
        const pythonVersions = ['3.13', '3.12', '3.11', '3.10', '3.9'];
        const pythonUserBins = pythonVersions.map(v => `${process.env.HOME}/Library/Python/${v}/bin`).join(':');
        env.PATH = `/opt/podman/bin:${pythonUserBins}:${env.PATH || ''}`;
    }
    
    execSync(command, { stdio, env });
    const endTime = Date.now();
    const duration = ((endTime - startTime) / 1000).toFixed(2);
    log(`✅ Success: "${description}" completed in ${duration}s.`, colors.green);
    return parseFloat(duration);
  } catch (error) {
    log(`❌ Error: "${description}" failed.`, colors.red, true);
    if (quiet) {
      log(`   Command that failed: ${command}`, colors.red);
      log(`   Error details: ${error.message}`, colors.red);
    }
    // We don't always exit on error, letting the caller handle it or decide
    throw error;
  }
}

// --- Podman Specific Functions ---

/**
 * Checks if Podman Machine is running (MacOS/Windows) and starts it if needed.
 * This is crucial for Podman on non-Linux systems.
 */
function checkAndStartPodmanMachine() {
  const isMac = process.platform === 'darwin';
  const isWin = process.platform === 'win32';
  
  if (!isMac && !isWin) {
    return; // Linux usually runs native
  }

  log('\n🐳 Checking Podman Machine status...', colors.cyan);

  const env = { ...process.env };
  if (isMac) {
      env.PATH = `/opt/podman/bin:${env.PATH || ''}`;
  }

  try {
    // Check machine status
    // 'podman machine list' output format varies, but we check if 'Running' exists or check via json
    // Safer way: try running a simple podman command
    try {
      execSync('podman info', { stdio: 'pipe', env }); // Use updated env with PATH
      log('✅ Podman Machine is running.', colors.green);
      return;
    } catch (e) {
      log('⚠️  Podman Machine is NOT running (or info failed).', colors.yellow);
    }

    log('🚀 Starting Podman Machine...', colors.yellow, true);
    // Try to start, but catch "already running" error which is actually a success state
    try {
        runCommand('podman machine start', 'Start Podman Machine');
    } catch (e) {
        if (e.message.includes('already running') || e.stdout?.includes('already running') || e.stderr?.includes('already running')) {
             log('✅ Podman Machine was already running (detected during start).', colors.green);
             return;
        }
        throw e;
    }
    
  } catch (error) {
    log('❌ Failed to manage Podman Machine.', colors.red);
    log('   Please ensure Podman is installed and initialized (podman machine init).', colors.yellow);
    process.exit(1);
  }
}

// --- Core Workflow Functions ---

/**
 * Performs a complete cleanup: stops containers, removes volumes, images, networks, and build cache.
 * This effectively resets the entire Podman environment to a clean state.
 */
function cleanAll() {
  const timings = {};
  log('\n🧹 Cleaning up ALL Podman artifacts (containers, volumes, images, networks, build cache)...', colors.cyan, true);
  
  // 1. Stop containers, remove volumes and images using compose
  // --rmi all removes all images created by compose
  try {
    const cmd = getComposeCommand('down', '-v --rmi all');
    timings['Stop & Remove (Compose)'] = runCommand(cmd, 'Stop Containers, Remove Volumes & Images');
  } catch (e) {
    log('   (Ignored error during down - might not be running)', colors.yellow);
  }

  // 2. Extra cleanup to be sure (force remove specific known container names if compose missed them)
  // This helps if the user changed project names or context
  try {
    // Force remove known service containers
    const containers = ['evi-database-local', 'evi-backend-local', 'evi-frontend-local'];
    runCommand(`podman rm -f ${containers.join(' ')}`, 'Force Remove Containers', true);
  } catch (e) {}

  // 3. Remove unused networks
  try {
    timings['Remove Networks'] = runCommand('podman network prune -f', 'Remove Unused Networks', true);
  } catch (e) {
    log('   (Ignored error during network prune)', colors.yellow);
  }

  // 4. Remove unused images (all dangling and unused images)
  try {
    timings['Remove Images'] = runCommand('podman image prune -af', 'Remove Unused Images', true);
  } catch (e) {
    log('   (Ignored error during image prune)', colors.yellow);
  }

  // 5. Clean build cache
  try {
    timings['Clean Build Cache'] = runCommand('podman builder prune -af', 'Clean Build Cache', true);
  } catch (e) {
    log('   (Ignored error during builder prune)', colors.yellow);
  }

  // 6. Final volume cleanup (in case something was missed)
  try {
    timings['Prune Volumes'] = runCommand('podman volume prune -f', 'Prune Unused Volumes', true);
  } catch (e) {
    log('   (Ignored error during volume prune)', colors.yellow);
  }

  return timings;
}

/**
 * Builds and starts ONLY the database container using Podman compose.
 * Always refreshes the base postgres:17 image from the registry so that
 * the local Podman image cache is up to date before building.
 * Builds the database image and starts the container in detached mode.
 */
function buildAndStartDB() {
  const timings = {};
  log('\n🐘 Starting Database Container...', colors.cyan, true);

  // 0. Ensure local cache has the latest postgres:17 image
  // This updates Podman's image cache with the latest upstream image.
  timings['Pull postgres:17'] = runCommand(
    'podman pull docker.io/postgres:17',
    'Pull latest postgres:17 base image'
  );

  // 1. Build the database image using Podman compose
  // This builds the image from the Containerfile in the db directory
  timings['Build DB'] = runCommand(
    getComposeCommand('build', 'evi-database'),
    'Build Database Image'
  );

  // 2. Start the database service in detached mode
  timings['Start DB'] = runCommand(
    getComposeCommand('up', '-d evi-database'),
    'Start Database Service'
  );

  return timings;
}

/**
 * Builds and starts ONLY the database container using Podman compose,
 * but relies strictly on the local image cache (no remote pulls).
 * Useful for offline mode or when you explicitly want to reuse
 * previously pulled postgres:17 and already built DB images.
 */
function buildAndStartDBFromCache() {
  const timings = {};
  log('\n🐘 Starting Database Container from CACHE (no pulls)...', colors.cyan, true);

  // Temporarily instruct Podman/Buildah to never pull images during build.
  const originalPullPolicy = process.env.BUILDAH_PULL_NEVER;
  process.env.BUILDAH_PULL_NEVER = '1';

  try {
    // 1. Build DB image strictly from cached layers/images
    timings['Build DB (cache only)'] = runCommand(
      getComposeCommand('build', 'evi-database'),
      'Build Database Image (cache only)'
    );

    // 2. Start the database service in detached mode
    timings['Start DB'] = runCommand(
      getComposeCommand('up', '-d evi-database'),
      'Start Database Service'
    );
  } finally {
    // Restore previous pull policy so it does not leak outside this flow
    if (originalPullPolicy === undefined) {
      delete process.env.BUILDAH_PULL_NEVER;
    } else {
      process.env.BUILDAH_PULL_NEVER = originalPullPolicy;
    }
  }

  return timings;
}

/**
 * Displays a summary of the execution timings.
 */
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

// --- Main Menu ---

async function mainMenu() {
  const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout
  });

  const menu = `
${colors.cyan}=========================================${colors.reset}
${colors.cyan}  evi Local Podman Manager (DB First)${colors.reset}
${colors.cyan}=========================================${colors.reset}
${colors.yellow}[1]${colors.reset} 🗑️  DELETE ALL (Containers & Volumes) - Reset Environment
${colors.yellow}[2]${colors.reset} 🐘 Build & Start DB ONLY (pull latest postgres:17)
${colors.yellow}[3]${colors.reset} 🐘 Build & Start DB from CACHE ONLY (no pulls)
${colors.yellow}[4]${colors.reset} Exit
`;

  console.log(menu);

  rl.question('Select option: ', async (option) => {
    rl.close();
    let timings = {};
    const scriptStartTime = Date.now();

    try {
      switch (option.trim()) {
        case '1':
          // Confirm before delete
          const confirmRl = readline.createInterface({ input: process.stdin, output: process.stdout });
          confirmRl.question(`\n${colors.red}⚠️  ARE YOU SURE? This will DELETE ALL DATABASE DATA! (y/N): ${colors.reset}`, async (ans) => {
            confirmRl.close();
            if (ans.toLowerCase() === 'y') {
              timings = cleanAll();
              showSummary(timings);
            } else {
              log('Cancelled.', colors.yellow);
            }
            // Show menu again? Or exit? Let's exit for simplicity in this script style.
          });
          return; // Return here because of async callback inside

        case '2':
          timings = buildAndStartDB();
          break;

        case '3':
          timings = buildAndStartDBFromCache();
          break;

        case '4':
          log('👋 Exiting.', colors.yellow);
          return;

        default:
          log('❌ Invalid option.', colors.red, true);
          return;
      }

      // If we didn't return early (like in case 1), show summary
      const scriptEndTime = Date.now();
      timings['Total Duration'] = parseFloat(((scriptEndTime - scriptStartTime) / 1000).toFixed(2));
      showSummary(timings);
      log('\n🎉 Done!', colors.green, true);

    } catch (e) {
      log(`\n❌ Script failed: ${e.message}`, colors.red, true);
      process.exit(1);
    }
  });
}

// --- Entry Point ---

async function main() {
  try {
    // 0. Check Environment
    if (!fs.existsSync(COMPOSE_FILE)) {
      log(`❌ Error: Compose file not found at "${COMPOSE_FILE}"`, colors.red, true);
      process.exit(1);
    }

    // 1. Check Podman Machine
    checkAndStartPodmanMachine();

    // 2. Parse Args (if any) - keeping it simple for now, relying on menu
    const args = process.argv.slice(2);
    if (args.includes('--clean')) {
      cleanAll();
      process.exit(0);
    }

    // 3. Show Menu
    mainMenu();

  } catch (e) {
    log(`Unexpected error: ${e.message}`, colors.red, true);
    process.exit(1);
  }
}

main();
