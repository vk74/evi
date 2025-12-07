#!/usr/bin/env node

// evi Local Podman Build & Management Script
// Version: 2.0 (Migration to Podman)
// Description: A streamlined Node.js script to manage the local Podman environment for evi.
// Now focuses on "Database First" workflow.

const { execSync } = require('child_process');
const readline = require('readline');
const fs = require('fs');

// --- Configuration ---
const DOCKER_COMPOSE_FILE = 'deployment/local/podman-compose.yml';
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
 * Gets the podman compose command.
 * Uses 'podman-compose' which is the standard tool for Podman.
 * @param {string} command - The compose command (e.g., 'build', 'up', 'down').
 * @param {string} additionalArgs - Additional arguments to append.
 * @returns {string} The complete podman-compose command.
 */
function getComposeCommand(command, additionalArgs = '') {
  // Use 'podman compose' (the integrated v2 command) instead of 'podman-compose' (separate python script)
  // This delegates to whatever compose provider podman is configured to use (often docker-compose or built-in)
  
  let cmd = `podman compose -f "${DOCKER_COMPOSE_FILE}"`;
  
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
    // Use full path for podman on macOS if standard path fails
    // This fixes "command not found" when running from IDEs/scripts where PATH might differ
    
    // Better approach: Add /opt/podman/bin to PATH for the child process
    const env = { ...process.env };
    if (process.platform === 'darwin') {
        env.PATH = `/opt/podman/bin:${env.PATH || ''}`;
    }

    // Replace "podman compose" with fully qualified path if needed (though env.PATH should handle "podman")
    // But "podman compose" is a subcommand, so "podman" just needs to be found.
    // However, if we were using "podman-compose" script, we'd need to find it. 
    // Since we switched to "podman compose", we rely on "podman" binary being found.
    
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
 * Performs a complete cleanup: stops containers and removes volumes.
 * This effectively resets the database.
 */
function cleanAll() {
  const timings = {};
  log('\n🧹 Cleaning up ALL containers and volumes...', colors.cyan, true);
  
  // 1. Stop containers and remove volumes using compose
  // podman-compose down -v works similar to docker compose
  try {
    const cmd = getComposeCommand('down', '-v');
    timings['Stop & Remove Volumes'] = runCommand(cmd, 'Stop Containers & Remove Volumes');
  } catch (e) {
    log('   (Ignored error during down - might not be running)', colors.yellow);
  }

  // 2. Extra cleanup to be sure (force remove specific known container/volume names if compose missed them)
  // This helps if the user changed project names or context
  try {
    // Force remove known service containers
    const containers = ['evi-database-local', 'evi-backend-local', 'evi-frontend-local'];
    runCommand(`podman rm -f ${containers.join(' ')}`, 'Force Remove Containers', true);
  } catch (e) {}

  try {
    // Prune volumes to ensure data is gone
    runCommand('podman volume prune -f', 'Prune Unused Volumes', true);
  } catch (e) {}

  return timings;
}

/**
 * Builds and starts ONLY the database container.
 */
function buildAndStartDB() {
  const timings = {};
  log('\n🐘 Starting Database Container...', colors.cyan, true);

  // 1. Build the database image (optional, but good practice if Dockerfile changed)
  timings['Build DB'] = runCommand(
    getComposeCommand('build', 'evi-database'),
    'Build Database Image'
  );

  // 2. Up the database service
  timings['Start DB'] = runCommand(
    getComposeCommand('up', '-d evi-database'),
    'Start Database Service'
  );

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
${colors.yellow}[2]${colors.reset} 🐘 Build & Start DB ONLY
${colors.yellow}[3]${colors.reset} Exit
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
    if (!fs.existsSync(DOCKER_COMPOSE_FILE)) {
      log(`❌ Error: Compose file not found at "${DOCKER_COMPOSE_FILE}"`, colors.red, true);
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
