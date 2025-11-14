#!/usr/bin/env node

// evi Local Docker Build & Management Script
// Version: 1.2
// Description: A streamlined Node.js script to build, run, and clean the local Docker environment for evi.
// Replaces the previous dev-docker.js and cleanup-docker.sh scripts.

// Changes in v1.1:
// - Made .env.local file optional - script now checks if file exists before using it
// - Added support for --clean flag to clean project containers before showing menu
// - Added project cleanup function that only removes project containers and volumes
// - All docker compose commands now conditionally use --env-file only if .env.local exists

// Changes in v1.2:
// - Improved cleanup function to remove all project resources (evi and ev2)
// - Added pattern-based removal functions for containers, volumes, images, and networks
// - Cleanup now removes old project volumes (local_ev2_*) and new project volumes (local_evi_*)
// - Added step-by-step cleanup process with detailed logging
// - Improved error handling for volume removal (volumes may be in use by stopped containers)

const { execSync } = require('child_process');
const readline = require('readline');
const os = require('os');
const path = require('path');
const fs = require('fs');

// --- Configuration ---
const DOCKER_COMPOSE_FILE = 'deployment/local/docker-compose.yml';
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
 * Gets the docker compose command with optional --env-file flag.
 * @param {string} command - The docker compose command (e.g., 'build', 'up', 'down').
 * @param {string} additionalArgs - Additional arguments to append (e.g., '--parallel', '-d').
 * @returns {string} The complete docker compose command.
 */
function getDockerComposeCommand(command, additionalArgs = '') {
  let cmd = `docker compose -f "${DOCKER_COMPOSE_FILE}"`;
  
  // Only use --env-file if .env.local exists
  if (envFileExists()) {
    cmd += ` --env-file "${ENV_FILE}"`;
  }
  
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
 * Performs cleanup of project containers and volumes only.
 * Removes containers, volumes, and networks for this project.
 * @returns {Object} Object with timing information.
 */
function cleanProjectContainers() {
  const timings = {};
  
  log('\n🧹 Cleaning up project containers and volumes...', colors.cyan, true);
  
  const command = getDockerComposeCommand('down', '-v --remove-orphans');
  const description = 'Stop & Remove Project Containers';
  
  log(`\n🚀 Executing: ${description}...`, colors.yellow, true);
  log(`   Command: ${command}`, colors.reset);
  
  const startTime = Date.now();
  try {
    execSync(command, { stdio: 'inherit' });
    const endTime = Date.now();
    const duration = ((endTime - startTime) / 1000).toFixed(2);
    log(`✅ Success: "${description}" completed in ${duration}s.`, colors.green);
    timings[description] = parseFloat(duration);
    log('✅ Project containers and volumes cleaned successfully.', colors.green);
  } catch (error) {
    const endTime = Date.now();
    const duration = ((endTime - startTime) / 1000).toFixed(2);
    log(`⚠️  Warning: "${description}" failed (this may be normal if no containers exist).`, colors.yellow);
    log(`   Execution time: ${duration}s`, colors.yellow);
    timings[description] = parseFloat(duration);
    // Don't exit on error - containers may not exist, which is fine
  }
  
  return timings;
}

/**
 * Removes containers by name pattern (handles errors gracefully)
 * @param {string} pattern - Pattern to match container names
 * @returns {number} Execution time in seconds
 */
function removeContainersByPattern(pattern) {
  try {
    const containerIds = execSync(
      `docker ps -a --filter "name=${pattern}" --format "{{.ID}}"`,
      { encoding: 'utf8', stdio: 'pipe' }
    ).trim();
    
    if (!containerIds) {
      return 0;
    }
    
    const ids = containerIds.split('\n').filter(id => id);
    if (ids.length === 0) {
      return 0;
    }
    
    log(`   Found ${ids.length} container(s) matching pattern "${pattern}"`, colors.cyan);
    execSync(`docker rm -f ${ids.join(' ')}`, { stdio: 'inherit' });
    return 0.1;
  } catch (error) {
    // Ignore errors - containers may not exist
    return 0;
  }
}

/**
 * Removes volumes by name pattern (handles errors gracefully)
 * @param {string} pattern - Pattern to match volume names (supports partial match)
 * @returns {number} Execution time in seconds
 */
function removeVolumesByPattern(pattern) {
  try {
    // Get all volumes and filter by pattern (Docker filter doesn't support partial matches well)
    const allVolumes = execSync(
      'docker volume ls --format "{{.Name}}"',
      { encoding: 'utf8', stdio: 'pipe' }
    ).trim();
    
    if (!allVolumes) {
      return 0;
    }
    
    const allNames = allVolumes.split('\n').filter(name => name);
    // Filter volumes that match the pattern
    const matchingNames = allNames.filter(name => name.includes(pattern));
    
    if (matchingNames.length === 0) {
      return 0;
    }
    
    log(`   Found ${matchingNames.length} volume(s) matching pattern "${pattern}"`, colors.cyan);
    
    // Try to remove each volume individually to handle errors gracefully
    let removedCount = 0;
    for (const volumeName of matchingNames) {
      try {
        execSync(`docker volume rm -f "${volumeName}"`, { stdio: 'pipe' });
        removedCount++;
      } catch (error) {
        // Volume may be in use, try to force remove by removing containers first
        log(`   ⚠️  Warning: Could not remove volume "${volumeName}" (may be in use)`, colors.yellow);
      }
    }
    
    if (removedCount > 0) {
      log(`   ✅ Removed ${removedCount} volume(s)`, colors.green);
    }
    
    return removedCount > 0 ? 0.1 : 0;
  } catch (error) {
    // Ignore errors - volumes may not exist
    return 0;
  }
}

/**
 * Removes images by reference pattern (handles errors gracefully)
 * @param {string} pattern - Pattern to match image references
 * @returns {number} Execution time in seconds
 */
function removeImagesByPattern(pattern) {
  try {
    const imageIds = execSync(
      `docker images --filter "reference=${pattern}" --format "{{.ID}}"`,
      { encoding: 'utf8', stdio: 'pipe' }
    ).trim();
    
    if (!imageIds) {
      return 0;
    }
    
    const ids = [...new Set(imageIds.split('\n').filter(id => id))]; // Remove duplicates
    if (ids.length === 0) {
      return 0;
    }
    
    log(`   Found ${ids.length} image(s) matching pattern "${pattern}"`, colors.cyan);
    execSync(`docker rmi -f ${ids.join(' ')}`, { stdio: 'inherit' });
    return 0.1;
  } catch (error) {
    // Ignore errors - images may not exist
    return 0;
  }
}

/**
 * Removes networks by name pattern (handles errors gracefully)
 * @param {string} pattern - Pattern to match network names
 * @returns {number} Execution time in seconds
 */
function removeNetworksByPattern(pattern) {
  try {
    const networkNames = execSync(
      `docker network ls --filter "name=${pattern}" --format "{{.Name}}"`,
      { encoding: 'utf8', stdio: 'pipe' }
    ).trim();
    
    if (!networkNames) {
      return 0;
    }
    
    const names = networkNames.split('\n').filter(name => name && name !== 'bridge' && name !== 'host' && name !== 'none');
    if (names.length === 0) {
      return 0;
    }
    
    log(`   Found ${names.length} network(s) matching pattern "${pattern}"`, colors.cyan);
    execSync(`docker network rm ${names.join(' ')}`, { stdio: 'inherit' });
    return 0.1;
  } catch (error) {
    // Ignore errors - networks may not exist or be in use
    log(`   ⚠️  Warning: Could not remove some networks matching "${pattern}" (may be in use)`, colors.yellow);
    return 0;
  }
}

/**
 * Performs a complete cleanup of the Docker environment, removing ALL containers, images, volumes, builds, and networks.
 * This will make Docker Desktop completely clean as if no containers were ever created.
 * Includes cleanup of old project resources (ev2) and new project resources (evi).
 */
function cleanDocker() {
  const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout
  });

  return new Promise((resolve) => {
    log('\n⚠️  WARNING: This will perform a COMPLETE Docker cleanup!', colors.red, true);
    log('   This operation will remove:', colors.yellow);
    log('   • All containers (running and stopped) for evi and ev2 projects', colors.yellow);
    log('   • All images for evi and ev2 projects', colors.yellow);
    log('   • All volumes for evi and ev2 projects', colors.yellow);
    log('   • All networks for evi and ev2 projects', colors.yellow);
    log('   • All unused Docker resources', colors.yellow);
    log('   • All build cache', colors.yellow);
    log('   Docker Desktop will be completely clean!', colors.red, true);
    
    rl.question('\nAre you sure you want to continue? Type "y" to confirm: ', (answer) => {
      rl.close();
      
      if (answer.trim().toLowerCase() !== 'y') {
        log('❌ Cleanup cancelled by user.', colors.yellow);
        resolve({ 'Cleanup Cancelled': 0 });
        return;
      }

      log('\n🧹 Starting complete Docker cleanup...', colors.cyan, true);
      
      const timings = {};
      const startTime = Date.now();
      
      try {
        // Step 1: Stop and remove containers from current docker-compose project
        log('\n📦 Step 1: Stopping and removing containers from current project...', colors.cyan);
        try {
          runCommand(
            getDockerComposeCommand('down', '-v --remove-orphans'),
            'Stop & Remove Current Project Containers'
          );
          timings['Stop & Remove Current Project'] = 0.1;
        } catch (error) {
          log('   ⚠️  Warning: Could not stop current project (may not exist)', colors.yellow);
          timings['Stop & Remove Current Project'] = 0;
        }
        
        // Step 2: Remove all containers matching evi or ev2 patterns
        log('\n📦 Step 2: Removing all project containers (evi and ev2)...', colors.cyan);
        const containerPatterns = ['evi-', 'ev2-', '-evi-', '-ev2-'];
        let containerTime = 0;
        for (const pattern of containerPatterns) {
          containerTime += removeContainersByPattern(pattern);
        }
        timings['Remove Project Containers'] = containerTime || 0.1;
        
        // Step 3: Remove all volumes matching evi or ev2 patterns (including old ev2 volumes)
        log('\n💾 Step 3: Removing all project volumes (evi and ev2)...', colors.cyan);
        const volumePatterns = [
          'local_evi_',
          'local_ev2_',
          'evi_',
          'ev2_',
          '-evi-',
          '-ev2-'
        ];
        let volumeTime = 0;
        for (const pattern of volumePatterns) {
          volumeTime += removeVolumesByPattern(pattern);
        }
        timings['Remove Project Volumes'] = volumeTime || 0.1;
        
        // Step 4: Remove all images matching evi or ev2 patterns
        log('\n🖼️  Step 4: Removing all project images (evi and ev2)...', colors.cyan);
        const imagePatterns = [
          'local-evi-',
          'local-ev2-',
          'evi-',
          'ev2-'
        ];
        let imageTime = 0;
        for (const pattern of imagePatterns) {
          imageTime += removeImagesByPattern(pattern);
        }
        timings['Remove Project Images'] = imageTime || 0.1;
        
        // Step 5: Remove all networks matching evi or ev2 patterns
        log('\n🌐 Step 5: Removing all project networks (evi and ev2)...', colors.cyan);
        const networkPatterns = [
          'evi-',
          'ev2-',
          '-evi-',
          '-ev2-',
          'local_evi',
          'local_ev2'
        ];
        let networkTime = 0;
        for (const pattern of networkPatterns) {
          networkTime += removeNetworksByPattern(pattern);
        }
        timings['Remove Project Networks'] = networkTime || 0.1;
        
        // Step 6: Remove all unused containers, networks, images, and build cache
        log('\n🧹 Step 6: Removing all unused Docker resources...', colors.cyan);
        timings['Remove All Unused Resources'] = runCommand(
          'docker system prune -a -f --volumes',
          'Remove All Unused Resources'
        );
        
        // Step 7: Final cleanup for any remaining volumes
        log('\n💾 Step 7: Final cleanup of any remaining volumes...', colors.cyan);
        timings['Remove Remaining Volumes'] = runCommand(
          'docker volume prune -f',
          'Remove Remaining Volumes'
        );
        
        const totalTime = ((Date.now() - startTime) / 1000).toFixed(2);
        timings['Total Cleanup Time'] = parseFloat(totalTime);
        
        log('\n✨ Docker Desktop is now completely clean!', colors.green, true);
        log('   All evi and ev2 project resources have been removed.', colors.green);
        resolve(timings);
        
      } catch (error) {
        log('❌ Error during cleanup process.', colors.red, true);
        log(`   Error details: ${error.message}`, colors.red);
        resolve({ 'Cleanup Failed': 0 });
      }
    });
  });
}

/**
 * Builds and starts all services defined in the docker-compose file.
 */
function buildAndUpAll() {
  const timings = {};
  timings['Build All Services'] = runCommand(
    getDockerComposeCommand('build', '--parallel'),
    'Build All Services'
  );
  timings['Start All Services'] = runCommand(
    getDockerComposeCommand('up', '-d'),
    'Start All Services'
  );
  return timings;
}

/**
 * Builds and starts a specific service.
 * @param {string} serviceName - The name of the service to build (e.g., 'evi-backend').
 */
function buildAndUpSingle(serviceName) {
  const timings = {};
  const capitalizedName = serviceName.charAt(0).toUpperCase() + serviceName.slice(1);
  timings[`Build ${capitalizedName}`] = runCommand(
    getDockerComposeCommand('build', serviceName),
    `Build ${capitalizedName}`
  );
  timings[`Start ${capitalizedName}`] = runCommand(
    getDockerComposeCommand('up', `-d ${serviceName}`),
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
    getDockerComposeCommand('down', ''),
    'Stop All Services'
  );
  timings['Build All Services (No Cache)'] = runCommand(
    getDockerComposeCommand('build', '--no-cache --parallel'),
    'Build All Services (No Cache)'
  );
  timings['Start All Services'] = runCommand(
    getDockerComposeCommand('up', '-d'),
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
    const checkCommand = getDockerComposeCommand('ps', '-a -q');
    const containerIds = execSync(checkCommand, { encoding: 'utf8' }).trim();
    
    if (!containerIds) {
      log('❌ Error: No containers found. Please build containers first using option 1 or 2.', colors.red, true);
      process.exit(1);
    }
    
    log(`✅ Found ${containerIds.split('\n').filter(id => id).length} existing container(s)`, colors.green);
  } catch (error) {
    log('❌ Error: Failed to check container status.', colors.red, true);
    process.exit(1);
  }
  
  timings['Start Existing Containers'] = runCommand(
    getDockerComposeCommand('up', '-d'),
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
${colors.cyan}  evi Local Docker Environment Manager${colors.reset}
${colors.cyan}=========================================${colors.reset}
${colors.yellow}[1]${colors.reset} Build from cache & start all containers
${colors.yellow}[2]${colors.reset} Rebuild & start all containers
${colors.yellow}[3]${colors.reset} Start current set of containers
${colors.yellow}[4]${colors.reset} Full docker cleanup (down -v)
${colors.yellow}[5]${colors.reset} Exit
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
        timings = fullRebuildNoCache();
        break;
      case '3':
        timings = startCurrentContainers();
        break;
      case '4':
        timings = await cleanDocker();
        break;
      case '5':
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

/**
 * Parses command line arguments.
 * @returns {Object} Object with parsed arguments.
 */
function parseArguments() {
  const args = process.argv.slice(2);
  return {
    clean: args.includes('--clean')
  };
}

/**
 * Main entry point.
 */
async function main() {
  try {
    // Check if docker-compose file exists
    if (!fs.existsSync(DOCKER_COMPOSE_FILE)) {
      log(`❌ Error: Docker compose file not found at "${DOCKER_COMPOSE_FILE}"`, colors.red, true);
      log('   Please ensure you are running this script from the project root directory.', colors.yellow);
      process.exit(1);
    }
    
    // Check .env.local file status
    if (envFileExists()) {
      log(`ℹ️  Using environment file: ${ENV_FILE}`, colors.cyan);
    } else {
      log(`ℹ️  Environment file ${ENV_FILE} not found. Using default values from docker-compose.yml`, colors.yellow);
    }
    
    // Parse command line arguments
    const args = parseArguments();
    
    // If --clean flag is provided, clean project containers first
    if (args.clean) {
      log('\n🧹 Cleaning project containers before showing menu...', colors.cyan, true);
      const cleanupTimings = cleanProjectContainers();
      showSummary(cleanupTimings);
      log('\n✅ Cleanup completed. Showing menu...\n', colors.green);
    }
    
    // Always show menu (as per requirement)
    mainMenu();
  } catch (e) {
    log(`An unexpected error occurred: ${e.message}`, colors.red, true);
    process.exit(1);
  }
}

// Run main function
main();
