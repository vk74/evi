#!/usr/bin/env node

// evi Docker Utilities
// Version: 1.0
// Description: Common Docker operations for deployment scripts
// Backend file: docker-utils.js

const { execSync } = require('child_process');
const logger = require('./logger');

/**
 * Executes a shell command synchronously and logs its output
 * @param {string} command - The command to execute
 * @param {string} description - A description of the action being performed
 * @param {boolean} quiet - If true, suppresses command output
 * @returns {number} Execution time in seconds
 */
function runCommand(command, description, quiet = false) {
  logger.step(`Executing: ${description}...`);
  if (!quiet) {
    logger.info(`Command: ${command}`);
  }
  
  const startTime = Date.now();
  try {
    const stdio = quiet ? ['pipe', 'pipe', 'pipe'] : 'inherit';
    execSync(command, { stdio });
    const endTime = Date.now();
    const duration = (endTime - startTime) / 1000;
    logger.success(`"${description}" completed in ${duration.toFixed(2)}s`);
    return duration;
  } catch (error) {
    logger.error(`"${description}" failed`);
    if (quiet) {
      logger.error(`Command that failed: ${command}`);
      logger.error(`Error details: ${error.message}`);
    }
    throw error;
  }
}

/**
 * Builds Docker images using docker-compose
 * @param {string} composeFile - Path to docker-compose file
 * @param {string} envFile - Path to environment file
 * @param {boolean} noCache - Whether to build without cache
 * @param {boolean} parallel - Whether to build in parallel
 * @returns {number} Execution time in seconds
 */
function buildImages(composeFile, envFile, noCache = false, parallel = true) {
  let command = `docker compose -f "${composeFile}" --env-file "${envFile}" build`;
  
  if (noCache) {
    command += ' --no-cache';
  }
  
  if (parallel) {
    command += ' --parallel';
  }
  
  return runCommand(command, 'Build Docker Images');
}

/**
 * Starts Docker containers using docker-compose
 * @param {string} composeFile - Path to docker-compose file
 * @param {string} envFile - Path to environment file
 * @param {boolean} detached - Whether to run in detached mode
 * @returns {number} Execution time in seconds
 */
function startContainers(composeFile, envFile, detached = true) {
  let command = `docker compose -f "${composeFile}" --env-file "${envFile}" up`;
  
  if (detached) {
    command += ' -d';
  }
  
  return runCommand(command, 'Start Docker Containers');
}

/**
 * Stops and removes Docker containers
 * @param {string} composeFile - Path to docker-compose file
 * @param {string} envFile - Path to environment file
 * @param {boolean} removeVolumes - Whether to remove volumes
 * @returns {number} Execution time in seconds
 */
function stopContainers(composeFile, envFile, removeVolumes = false) {
  let command = `docker compose -f "${composeFile}" --env-file "${envFile}" down`;
  
  if (removeVolumes) {
    command += ' -v';
  }
  
  command += ' --remove-orphans';
  
  return runCommand(command, 'Stop Docker Containers');
}

/**
 * Performs complete Docker cleanup
 * @returns {Object} Object with timing information
 */
function cleanDocker() {
  const timings = {};
  
  logger.warning('Performing complete Docker cleanup...');
  
  try {
    timings['Remove Unused Resources'] = runCommand(
      'docker system prune -a -f --volumes',
      'Remove All Unused Resources',
      true
    );
    
    timings['Remove Remaining Volumes'] = runCommand(
      'docker volume prune -f',
      'Remove Remaining Volumes',
      true
    );
    
    logger.success('Docker cleanup completed successfully');
    return timings;
  } catch (error) {
    logger.error('Docker cleanup failed');
    throw error;
  }
}

/**
 * Tags Docker images for GitHub Container Registry
 * @param {string} imageName - Local image name
 * @param {string} registryTag - Registry tag (e.g., ghcr.io/org/repo:tag)
 * @returns {number} Execution time in seconds
 */
function tagImage(imageName, registryTag) {
  const command = `docker tag ${imageName} ${registryTag}`;
  return runCommand(command, `Tag image ${imageName} as ${registryTag}`);
}

/**
 * Pushes Docker images to registry
 * @param {string} registryTag - Registry tag to push
 * @returns {number} Execution time in seconds
 */
function pushImage(registryTag) {
  const command = `docker push "${registryTag}"`;
  return runCommand(command, `Push image ${registryTag}`);
}

/**
 * Checks if Docker is running
 * @returns {boolean} True if Docker is running
 */
function isDockerRunning() {
  try {
    execSync('docker info', { stdio: 'pipe' });
    return true;
  } catch (error) {
    return false;
  }
}

/**
 * Gets Docker image information
 * @param {string} imageName - Name of the image
 * @returns {Object} Image information
 */
function getImageInfo(imageName) {
  try {
    const output = execSync(`docker images ${imageName} --format "{{.Repository}}:{{.Tag}} {{.Size}} {{.CreatedAt}}"`, { 
      encoding: 'utf8' 
    });
    const lines = output.trim().split('\n');
    return lines.map(line => {
      const [repoTag, size, createdAt] = line.split(' ');
      return { repoTag, size, createdAt };
    });
  } catch (error) {
    logger.warning(`Could not get image info for ${imageName}`);
    return [];
  }
}

module.exports = {
  runCommand,
  buildImages,
  startContainers,
  stopContainers,
  cleanDocker,
  tagImage,
  pushImage,
  isDockerRunning,
  getImageInfo
};
