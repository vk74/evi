#!/usr/bin/env node

// evi GitHub Build & Deployment Preparation Script
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
  const baseTag = `ghcr.io/your-org/evi`;
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
function buildImages(noCache = false) {
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
      noCache, // noCache parameter
      true     // parallel
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
      'local-evi-database',
      imageTags.database
    );
    timings['Tag Database Latest'] = dockerUtils.tagImage(
      'local-evi-database',
      imageTags.databaseLatest
    );
    
    // Tag backend image
    timings['Tag Backend Image'] = dockerUtils.tagImage(
      'local-evi-backend',
      imageTags.backend
    );
    timings['Tag Backend Latest'] = dockerUtils.tagImage(
      'local-evi-backend',
      imageTags.backendLatest
    );
    
    // Tag frontend image
    timings['Tag Frontend Image'] = dockerUtils.tagImage(
      'local-evi-frontend',
      imageTags.frontend
    );
    timings['Tag Frontend Latest'] = dockerUtils.tagImage(
      'local-evi-frontend',
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
    const packageDir = path.join(CONFIG.artifactsDir, `evi-deployment-${version}`);
    fileUtils.ensureDir(packageDir);
    
    // Copy all artifacts to package directory
    const artifacts = fileUtils.listFiles(CONFIG.artifactsDir);
    for (const artifact of artifacts) {
      if (artifact !== `evi-deployment-${version}`) {
        const srcPath = path.join(CONFIG.artifactsDir, artifact);
        const destPath = path.join(packageDir, artifact);
        fileUtils.copyFile(srcPath, destPath);
      }
    }
    
    // Create package info file
    const packageInfo = {
      name: 'evi-deployment',
      version: version,
      generated: new Date().toISOString(),
      description: 'evi Production Deployment Package',
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
  logger.info(`Deployment Package: evi-deployment-${version}`);
  
  logger.separator('Generated Docker Images');
  logger.info(`Database: ${imageTags.database}`);
  logger.info(`Backend: ${imageTags.backend}`);
  logger.info(`Frontend: ${imageTags.frontend}`);
  
  logger.separator('Next Steps');
  logger.info('1. Push images to GitHub Container Registry:');
  logger.info('   docker push ghcr.io/your-org/evi-database:latest');
  logger.info('   docker push ghcr.io/your-org/evi-backend:latest');
  logger.info('   docker push ghcr.io/your-org/evi-frontend:latest');
  
  logger.info('2. Create GitHub release with deployment package');
  logger.info('3. Update image tags in production templates');
  
  logger.separator('Files Ready for Deployment');
  const artifacts = fileUtils.listFiles(CONFIG.artifactsDir);
  for (const artifact of artifacts) {
    logger.info(`  - ${artifact}`);
  }
  
  logger.summary(timings);
}

// Check if GitHub CLI is available
function checkGitHubCLI() {
  try {
    require('child_process').execSync('gh --version', { stdio: 'pipe' });
    return true;
  } catch (error) {
    return false;
  }
}

// Push images to GitHub Container Registry
function pushImages() {
  logger.step('Pushing images to GitHub Container Registry...');
  
  const timings = {};
  const imageTags = generateImageTags('latest');
  
  try {
    // Push database image
    timings['Push Database Image'] = dockerUtils.pushImage(imageTags.databaseLatest);
    
    // Push backend image
    timings['Push Backend Image'] = dockerUtils.pushImage(imageTags.backendLatest);
    
    // Push frontend image
    timings['Push Frontend Image'] = dockerUtils.pushImage(imageTags.frontendLatest);
    
    logger.success('Images pushed successfully');
    return timings;
  } catch (error) {
    logger.error(`Failed to push images: ${error.message}`);
    throw error;
  }
}

// Create GitHub release
function createGitHubRelease(version) {
  logger.step('Creating GitHub release...');
  
  const timings = {};
  
  try {
    if (!checkGitHubCLI()) {
      logger.warning('GitHub CLI not found. Please install it first:');
      logger.info('  brew install gh  # macOS');
      logger.info('  or visit: https://cli.github.com/');
      logger.info('Then run: gh auth login');
      return { 'GitHub CLI Check': 0 };
    }
    
    const packageDir = path.join(CONFIG.artifactsDir, `evi-deployment-${version}`);
    
    // Create release with deployment package
    const command = `gh release create v${version} "${packageDir}" --title "evi v${version}" --notes "evi Application Release v${version}"`;
    timings['Create GitHub Release'] = dockerUtils.runCommand(command, 'Create GitHub Release');
    
    logger.success('GitHub release created successfully');
    return timings;
  } catch (error) {
    logger.error(`Failed to create GitHub release: ${error.message}`);
    throw error;
  }
}

// Update image tags in production templates
function updateImageTags(version) {
  logger.step('Updating image tags in production templates...');
  
  const timings = {};
  
  try {
    const imageTags = generateImageTags('latest');
    
    // Update docker-compose template
    const composeTemplate = path.join(CONFIG.templatesDir, 'docker-compose.production.yml');
    const composeContent = fileUtils.readFile(composeTemplate);
    
    // Replace version tags with latest
    const updatedCompose = composeContent
      .replace(/ghcr\.io\/your-org\/evi-database:{{APP_VERSION}}/g, imageTags.databaseLatest)
      .replace(/ghcr\.io\/your-org\/evi-backend:{{APP_VERSION}}/g, imageTags.backendLatest)
      .replace(/ghcr\.io\/your-org\/evi-frontend:{{APP_VERSION}}/g, imageTags.frontendLatest);
    
    fileUtils.writeFile(composeTemplate, updatedCompose);
    timings['Update Docker Compose Template'] = 0.1;
    
    // Regenerate artifacts with updated tags
    timings = { ...timings, ...generateArtifacts(version) };
    timings = { ...timings, ...generateDeploymentPackage(version) };
    
    logger.success('Image tags updated successfully');
    return timings;
  } catch (error) {
    logger.error(`Failed to update image tags: ${error.message}`);
    throw error;
  }
}

// Display main menu and handle user input
async function mainMenu() {
  const readline = require('readline');
  const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout
  });

  const menu = `
${logger.colors.cyan}=========================================${logger.colors.reset}
${logger.colors.cyan}  evi GitHub Build & Deployment Manager${logger.colors.reset}
${logger.colors.cyan}=========================================${logger.colors.reset}
${logger.colors.yellow}[1]${logger.colors.reset} Build all containers from cache
${logger.colors.yellow}[2]${logger.colors.reset} Rebuild all containers without cache
${logger.colors.yellow}[3]${logger.colors.reset} Push built containers to GitHub registry
${logger.colors.yellow}[4]${logger.colors.reset} Create GitHub release with deployment package
${logger.colors.yellow}[5]${logger.colors.reset} Update image tags in production templates
${logger.colors.yellow}[6]${logger.colors.reset} Exit
`;

  console.log(menu);

  rl.question('Please select an option: ', async (option) => {
    rl.close();
    let timings = {};
    const scriptStartTime = Date.now();

    try {
      const version = getPackageVersion();
      
      switch (option.trim()) {
        case '1':
          timings = { ...timings, ...buildImages() };
          timings = { ...timings, ...tagImages(version) };
          break;
        case '2':
          timings = { ...timings, ...buildImages(true) }; // noCache = true
          timings = { ...timings, ...tagImages(version) };
          break;
        case '3':
          timings = { ...timings, ...pushImages() };
          break;
        case '4':
          timings = { ...timings, ...createGitHubRelease(version) };
          break;
        case '5':
          timings = { ...timings, ...updateImageTags(version) };
          break;
        case '6':
          logger.info('👋 Exiting. No action taken.');
          return;
        default:
          logger.error('❌ Invalid option. Please run the script again.');
          return;
      }

      const scriptEndTime = Date.now();
      const totalScriptDuration = ((scriptEndTime - scriptStartTime) / 1000).toFixed(2);
      timings['Total Script Duration'] = parseFloat(totalScriptDuration);

      logger.summary(timings);
      logger.complete('GitHub build operation completed successfully!');
      
    } catch (error) {
      logger.error(`Operation failed: ${error.message}`);
      process.exit(1);
    }
  });
}

// Main execution function
async function main() {
  const startTime = Date.now();
  let timings = {};
  
  try {
    logger.separator('evi GitHub Build & Deployment Preparation');
    
    // Get version
    const version = getPackageVersion();
    logger.info(`Building version: ${version}`);
    
    // Parse command line arguments
    const args = process.argv.slice(2);
    const shouldClean = args.includes('--clean');
    const useMenu = !args.includes('--no-menu');
    
    if (shouldClean) {
      logger.info('Clean mode enabled - will perform complete cleanup');
    }
    
    // If menu is requested, show interactive menu
    if (useMenu) {
      mainMenu();
      return;
    }
    
    // Execute build steps (legacy mode)
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
