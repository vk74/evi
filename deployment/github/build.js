#!/usr/bin/env node

// ev2 GitHub Build & Deployment Preparation Script
// Version: 1.0
// Description: Prepares Docker containers and deployment artifacts for GitHub CI/CD
// Backend file: build.js

const path = require('path');
const logger = require('../shared/logger');
const dockerUtils = require('../shared/docker-utils');
const fileUtils = require('../shared/file-utils');

// Configuration
const CONFIG = {
  projectRoot: path.resolve(__dirname, '../../'),
  localComposeFile: path.join(__dirname, '../local/docker-compose.yml'),
  localEnvFile: path.join(__dirname, '../../.env.local'),
  templatesDir: path.join(__dirname, 'templates'),
  artifactsDir: path.join(__dirname, 'artifacts'),
  packageJson: path.join(__dirname, '../../package.json')
};

// Get package version
function getPackageVersion() {
  try {
    const packageJson = JSON.parse(fileUtils.readFile(CONFIG.packageJson));
    return packageJson.version || '1.0.0';
  } catch (error) {
    logger.warning('Could not read package version, using default: 1.0.0');
    return '1.0.0';
  }
}

// Generate Docker image tags
function generateImageTags(version) {
  const baseTag = `ghcr.io/your-org/ev2`;
  return {
    database: `${baseTag}-database:${version}`,
    backend: `${baseTag}-backend:${version}`,
    frontend: `${baseTag}-frontend:${version}`,
    databaseLatest: `${baseTag}-database:latest`,
    backendLatest: `${baseTag}-backend:latest`,
    frontendLatest: `${baseTag}-frontend:latest`
  };
}

// Clean previous artifacts
function cleanArtifacts() {
  logger.step('Cleaning previous artifacts...');
  
  const timings = {};
  
  try {
    // Remove artifacts directory
    if (fileUtils.dirExists(CONFIG.artifactsDir)) {
      fileUtils.removeDir(CONFIG.artifactsDir);
      timings['Remove Artifacts Directory'] = 0.1;
    }
    
    // Recreate artifacts directory
    fileUtils.ensureDir(CONFIG.artifactsDir);
    timings['Create Artifacts Directory'] = 0.1;
    
    logger.success('Artifacts cleaned successfully');
    return timings;
  } catch (error) {
    logger.error(`Failed to clean artifacts: ${error.message}`);
    throw error;
  }
}

// Build Docker images
function buildImages() {
  logger.step('Building Docker images...');
  
  const timings = {};
  
  try {
    // Check if local compose file exists
    if (!fileUtils.fileExists(CONFIG.localComposeFile)) {
      throw new Error(`Local compose file not found: ${CONFIG.localComposeFile}`);
    }
    
    // Check if local env file exists
    if (!fileUtils.fileExists(CONFIG.localEnvFile)) {
      logger.warning('Local env file not found, using default values');
    }
    
    // Build images
    timings['Build Docker Images'] = dockerUtils.buildImages(
      CONFIG.localComposeFile,
      CONFIG.localEnvFile,
      false, // noCache
      true   // parallel
    );
    
    logger.success('Docker images built successfully');
    return timings;
  } catch (error) {
    logger.error(`Failed to build images: ${error.message}`);
    throw error;
  }
}

// Tag images for GitHub Container Registry
function tagImages(version) {
  logger.step('Tagging images for GitHub Container Registry...');
  
  const timings = {};
  const imageTags = generateImageTags(version);
  
  try {
    // Tag database image
    timings['Tag Database Image'] = dockerUtils.tagImage(
      'local-ev2-database',
      imageTags.database
    );
    timings['Tag Database Latest'] = dockerUtils.tagImage(
      'local-ev2-database',
      imageTags.databaseLatest
    );
    
    // Tag backend image
    timings['Tag Backend Image'] = dockerUtils.tagImage(
      'local-ev2-backend',
      imageTags.backend
    );
    timings['Tag Backend Latest'] = dockerUtils.tagImage(
      'local-ev2-backend',
      imageTags.backendLatest
    );
    
    // Tag frontend image
    timings['Tag Frontend Image'] = dockerUtils.tagImage(
      'local-ev2-frontend',
      imageTags.frontend
    );
    timings['Tag Frontend Latest'] = dockerUtils.tagImage(
      'local-ev2-frontend',
      imageTags.frontendLatest
    );
    
    logger.success('Images tagged successfully');
    return timings;
  } catch (error) {
    logger.error(`Failed to tag images: ${error.message}`);
    throw error;
  }
}

// Generate production artifacts
function generateArtifacts(version) {
  logger.step('Generating production artifacts...');
  
  const timings = {};
  const imageTags = generateImageTags(version);
  
  try {
    // Variables for template processing
    const variables = {
      APP_VERSION: version,
      DATABASE_IMAGE: imageTags.database,
      BACKEND_IMAGE: imageTags.backend,
      FRONTEND_IMAGE: imageTags.frontend,
      POSTGRES_PASSWORD: '{{POSTGRES_PASSWORD}}',
      JWT_SECRET: '{{JWT_SECRET}}',
      FRONTEND_API_URL: '{{FRONTEND_API_URL}}',
      ADMIN_USERNAME: '{{ADMIN_USERNAME}}',
      ADMIN_PASSWORD: '{{ADMIN_PASSWORD}}',
      ADMIN_EMAIL: '{{ADMIN_EMAIL}}',
      SSL_CERT_PATH: '{{SSL_CERT_PATH}}',
      SSL_KEY_PATH: '{{SSL_KEY_PATH}}'
    };
    
    // Process docker-compose template
    const composeTemplate = path.join(CONFIG.templatesDir, 'docker-compose.production.yml');
    const composeOutput = path.join(CONFIG.artifactsDir, 'docker-compose.production.yml');
    
    if (fileUtils.fileExists(composeTemplate)) {
      fileUtils.processTemplate(composeTemplate, variables, composeOutput);
      timings['Generate Docker Compose'] = 0.1;
    }
    
    // Copy environment template
    const envTemplate = path.join(CONFIG.templatesDir, 'env.template');
    const envOutput = path.join(CONFIG.artifactsDir, '.env.template');
    
    if (fileUtils.fileExists(envTemplate)) {
      fileUtils.copyFile(envTemplate, envOutput);
      timings['Copy Environment Template'] = 0.1;
    }
    
    // Copy initialization script
    const initTemplate = path.join(CONFIG.templatesDir, 'init.sh');
    const initOutput = path.join(CONFIG.artifactsDir, 'init.sh');
    
    if (fileUtils.fileExists(initTemplate)) {
      fileUtils.copyFile(initTemplate, initOutput);
      // Make script executable
      require('child_process').execSync(`chmod +x "${initOutput}"`);
      timings['Copy Init Script'] = 0.1;
    }
    
    // Copy README
    const readmeTemplate = path.join(CONFIG.templatesDir, 'README.md');
    const readmeOutput = path.join(CONFIG.artifactsDir, 'README.md');
    
    if (fileUtils.fileExists(readmeTemplate)) {
      fileUtils.copyFile(readmeTemplate, readmeOutput);
      timings['Copy README'] = 0.1;
    }
    
    logger.success('Production artifacts generated successfully');
    return timings;
  } catch (error) {
    logger.error(`Failed to generate artifacts: ${error.message}`);
    throw error;
  }
}

// Generate deployment package
function generateDeploymentPackage(version) {
  logger.step('Generating deployment package...');
  
  const timings = {};
  
  try {
    // Create deployment package directory
    const packageDir = path.join(CONFIG.artifactsDir, `ev2-deployment-${version}`);
    fileUtils.ensureDir(packageDir);
    
    // Copy all artifacts to package directory
    const artifacts = fileUtils.listFiles(CONFIG.artifactsDir);
    for (const artifact of artifacts) {
      if (artifact !== `ev2-deployment-${version}`) {
        const srcPath = path.join(CONFIG.artifactsDir, artifact);
        const destPath = path.join(packageDir, artifact);
        fileUtils.copyFile(srcPath, destPath);
      }
    }
    
    // Create package info file
    const packageInfo = {
      name: 'ev2-deployment',
      version: version,
      generated: new Date().toISOString(),
      description: 'ev2 Production Deployment Package',
      files: fileUtils.listFiles(packageDir)
    };
    
    fileUtils.writeFile(
      path.join(packageDir, 'package-info.json'),
      JSON.stringify(packageInfo, null, 2)
    );
    
    timings['Create Deployment Package'] = 0.2;
    
    logger.success(`Deployment package created: ${packageDir}`);
    return timings;
  } catch (error) {
    logger.error(`Failed to generate deployment package: ${error.message}`);
    throw error;
  }
}

// Display summary and next steps
function displaySummary(version, timings) {
  logger.separator('Build Summary');
  
  const imageTags = generateImageTags(version);
  
  logger.info(`Version: ${version}`);
  logger.info(`Artifacts Directory: ${CONFIG.artifactsDir}`);
  logger.info(`Deployment Package: ev2-deployment-${version}`);
  
  logger.separator('Generated Docker Images');
  logger.info(`Database: ${imageTags.database}`);
  logger.info(`Backend: ${imageTags.backend}`);
  logger.info(`Frontend: ${imageTags.frontend}`);
  
  logger.separator('Next Steps');
  logger.info('1. Push images to GitHub Container Registry:');
  logger.info('   docker push ghcr.io/your-org/ev2-database:latest');
  logger.info('   docker push ghcr.io/your-org/ev2-backend:latest');
  logger.info('   docker push ghcr.io/your-org/ev2-frontend:latest');
  
  logger.info('2. Create GitHub release with deployment package');
  logger.info('3. Update image tags in production templates');
  
  logger.separator('Files Ready for Deployment');
  const artifacts = fileUtils.listFiles(CONFIG.artifactsDir);
  for (const artifact of artifacts) {
    logger.info(`  - ${artifact}`);
  }
  
  logger.summary(timings);
}

// Main execution function
async function main() {
  const startTime = Date.now();
  let timings = {};
  
  try {
    logger.separator('ev2 GitHub Build & Deployment Preparation');
    
    // Get version
    const version = getPackageVersion();
    logger.info(`Building version: ${version}`);
    
    // Parse command line arguments
    const args = process.argv.slice(2);
    const shouldClean = args.includes('--clean');
    
    if (shouldClean) {
      logger.info('Clean mode enabled - will perform complete cleanup');
    }
    
    // Execute build steps
    if (shouldClean) {
      timings = { ...timings, ...cleanArtifacts() };
    }
    
    timings = { ...timings, ...buildImages() };
    timings = { ...timings, ...tagImages(version) };
    timings = { ...timings, ...generateArtifacts(version) };
    timings = { ...timings, ...generateDeploymentPackage(version) };
    
    // Display summary
    displaySummary(version, timings);
    
    const totalTime = (Date.now() - startTime) / 1000;
    timings['Total Build Time'] = totalTime;
    
    logger.complete('GitHub build preparation completed successfully!');
    
  } catch (error) {
    logger.error(`Build failed: ${error.message}`);
    process.exit(1);
  }
}

// Check prerequisites
function checkPrerequisites() {
  logger.step('Checking prerequisites...');
  
  // Check if Docker is running
  if (!dockerUtils.isDockerRunning()) {
    logger.error('Docker is not running. Please start Docker first.');
    process.exit(1);
  }
  
  // Check if templates directory exists
  if (!fileUtils.dirExists(CONFIG.templatesDir)) {
    logger.error(`Templates directory not found: ${CONFIG.templatesDir}`);
    process.exit(1);
  }
  
  logger.success('Prerequisites check passed');
}

// Run main function
if (require.main === module) {
  checkPrerequisites();
  main();
}

module.exports = {
  main,
  cleanArtifacts,
  buildImages,
  tagImages,
  generateArtifacts,
  generateDeploymentPackage
};
