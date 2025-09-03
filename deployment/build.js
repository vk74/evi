#!/usr/bin/env node

// ev2 Local Docker Build & Management Script
// Version: 1.0
// Description: A streamlined Node.js script to build, run, and clean the local Docker environment for ev2.
// Replaces the previous dev-docker.js and cleanup-docker.sh scripts.

const { execSync } = require('child_process');
const readline = require('readline');
const os = require('os');
const path = require('path');

// --- Configuration ---
const DOCKER_COMPOSE_FILE = 'deployment/docker-compose.local.yml';
const ENV_FILE = '.env.local'; // This script assumes the .env.local file exists.

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
    execSync(command, { stdio });
    const endTime = Date.now();
    const duration = ((endTime - startTime) / 1000).toFixed(2);
    log(`✅ Success: "${description}" completed in ${duration}s.`, colors.green);
    return parseFloat(duration);
  } catch (error) {
    log(`❌ Error: "${description}" failed.`, colors.red, true);
    if (quiet) {
      log(`   Command that failed: ${command}`, colors.red);
      // Show error output even in quiet mode
      log(`   Error details: ${error.message}`, colors.red);
    }
    process.exit(1);
  }
}

// --- Core Functions ---

/**
 * Performs a full cleanup of the Docker environment, removing containers, volumes, and networks.
 */
function cleanDocker() {
  const totalTime = runCommand(
    `docker-compose -f ${DOCKER_COMPOSE_FILE} --env-file ${ENV_FILE} down -v --remove-orphans`,
    'Full Docker Cleanup'
  );
  return { 'Full Cleanup': totalTime };
}

/**
 * Builds and starts all services defined in the docker-compose file.
 */
function buildAndUpAll() {
  const timings = {};
  timings['Build All Services'] = runCommand(
    `docker-compose -f ${DOCKER_COMPOSE_FILE} --env-file ${ENV_FILE} build --parallel`,
    'Build All Services'
  );
  timings['Start All Services'] = runCommand(
    `docker-compose -f ${DOCKER_COMPOSE_FILE} --env-file ${ENV_FILE} up -d`,
    'Start All Services'
  );
  return timings;
}

/**
 * Builds and starts a specific service.
 * @param {string} serviceName - The name of the service to build (e.g., 'ev2-backend').
 */
function buildAndUpSingle(serviceName) {
  const timings = {};
  const capitalizedName = serviceName.charAt(0).toUpperCase() + serviceName.slice(1);
  timings[`Build ${capitalizedName}`] = runCommand(
    `docker-compose -f ${DOCKER_COMPOSE_FILE} --env-file ${ENV_FILE} build ${serviceName}`,
    `Build ${capitalizedName}`
  );
  timings[`Start ${capitalizedName}`] = runCommand(
    `docker-compose -f ${DOCKER_COMPOSE_FILE} --env-file ${ENV_FILE} up -d ${serviceName}`,
    `Start ${capitalizedName} and its dependencies`
  );
  return timings;
}

/**
 * Performs full rebuild of all services without cache, including cleanup and restart.
 */
function fullRebuildNoCache() {
  const timings = {};
  timings['Stop All Services'] = runCommand(
    `docker-compose -f ${DOCKER_COMPOSE_FILE} --env-file ${ENV_FILE} down`,
    'Stop All Services'
  );
  timings['Build All Services (No Cache)'] = runCommand(
    `docker-compose -f ${DOCKER_COMPOSE_FILE} --env-file ${ENV_FILE} build --no-cache --parallel`,
    'Build All Services (No Cache)'
  );
  timings['Start All Services'] = runCommand(
    `docker-compose -f ${DOCKER_COMPOSE_FILE} --env-file ${ENV_FILE} up -d`,
    'Start All Services'
  );
  return timings;
}

/**
 * Displays a summary of the execution timings.
 * @param {object} timings - An object containing action descriptions and their durations.
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

/**
 * Starts existing containers without rebuilding them.
 * Throws an error if no containers exist.
 */
function startCurrentContainers() {
  const timings = {};
  
  // Check if containers exist (even if stopped)
  log('🔍 Checking if containers exist...', colors.cyan);
  try {
    const checkCommand = `docker-compose -f ${DOCKER_COMPOSE_FILE} --env-file ${ENV_FILE} ps -a -q`;
    const containerIds = execSync(checkCommand, { encoding: 'utf8' }).trim();
    
    if (!containerIds) {
      log('❌ Error: No containers found. Please build containers first using option 1 or 6.', colors.red, true);
      process.exit(1);
    }
    
    log(`✅ Found ${containerIds.split('\n').filter(id => id).length} existing container(s)`, colors.green);
  } catch (error) {
    log('❌ Error: Failed to check container status.', colors.red, true);
    process.exit(1);
  }
  
  timings['Start Existing Containers'] = runCommand(
    `docker-compose -f ${DOCKER_COMPOSE_FILE} --env-file ${ENV_FILE} up -d`,
    'Start Existing Containers'
  );
  return timings;
}

// --- Main Application Logic ---

/**
 * Displays the main menu and handles user input.
 */
async function mainMenu() {
  const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout
  });

  const menu = `
${colors.cyan}=========================================${colors.reset}
${colors.cyan}  ev2 Local Docker Environment Manager${colors.reset}
${colors.cyan}=========================================${colors.reset}
${colors.yellow}[1]${colors.reset} Build & Start All Services
${colors.yellow}[2]${colors.reset} Build & Start ev2-frontend
${colors.yellow}[3]${colors.reset} Build & Start ev2-backend
${colors.yellow}[4]${colors.reset} Build & Start ev2-database
${colors.yellow}[5]${colors.reset} Full Docker Cleanup (down -v)
${colors.yellow}[6]${colors.reset} Rebuild & Start All (No Cache)
${colors.yellow}[7]${colors.reset} Start Current Set of Containers
${colors.yellow}[8]${colors.reset} Exit
`;

  console.log(menu);

  rl.question('Please select an option: ', async (option) => {
    rl.close();
    let timings = {};
    const scriptStartTime = Date.now();

    switch (option.trim()) {
      case '1':
        timings = buildAndUpAll();
        break;
      case '2':
        timings = buildAndUpSingle('ev2-frontend');
        break;
      case '3':
        timings = buildAndUpSingle('ev2-backend');
        break;
      case '4':
        timings = buildAndUpSingle('ev2-database');
        break;
      case '5':
        timings = cleanDocker();
        break;
      case '6':
        timings = fullRebuildNoCache();
        break;
      case '7':
        timings = startCurrentContainers();
        break;
      case '8':
        log('👋 Exiting. No action taken.', colors.yellow);
        return;
      default:
        log('❌ Invalid option. Please run the script again.', colors.red, true);
        return;
    }

    const scriptEndTime = Date.now();
    const totalScriptDuration = ((scriptEndTime - scriptStartTime) / 1000).toFixed(2);
    timings['Total Script Duration'] = parseFloat(totalScriptDuration);

    showSummary(timings);
    log('\n🎉 All operations completed!', colors.green, true);
  });
}

// Check if docker-compose file exists before running
try {
  const fs = require('fs');
  if (!fs.existsSync(DOCKER_COMPOSE_FILE)) {
    log(`❌ Error: Docker compose file not found at "${DOCKER_COMPOSE_FILE}"`, colors.red, true);
    log('   Please ensure you are running this script from the project root directory.', colors.yellow);
    process.exit(1);
  }
  mainMenu();
} catch (e) {
  log(`An unexpected error occurred: ${e.message}`, colors.red, true);
  process.exit(1);
}
