#!/usr/bin/env node

// evi Version Synchronization Script
// Version: 1.0.0
// Description: Centralized version synchronization script for evi application.
// Backend file: sync-version.js
// Logic: Reads version from root package.json and synchronizes it to all target files (back/package.json, front/package.json, deployment/env/evi.template.env).
// Validates version format (only digits and dots), checks for version decrease with user confirmation, and updates all target files.

const fs = require('fs');
const path = require('path');
const readline = require('readline');

// --- Configuration ---
const ROOT_PACKAGE_JSON = path.join(__dirname, '..', 'package.json');
const BACK_PACKAGE_JSON = path.join(__dirname, '..', 'back', 'package.json');
const FRONT_PACKAGE_JSON = path.join(__dirname, '..', 'front', 'package.json');
const ENV_TEMPLATE = path.join(__dirname, 'env', 'evi.template.env');

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
 * @param {string} message - Message to print
 * @param {string} color - Color code
 * @param {boolean} isBold - Whether to make text bold
 */
function log(message, color = colors.reset, isBold = false) {
  const style = isBold ? colors.bright : '';
  console.log(`${style}${color}%s${colors.reset}`, message);
}

/**
 * Validates version format (MAJOR.MINOR.PATCH - only digits and dots).
 * @param {string} version - Version string to validate
 * @returns {boolean} True if version is valid, false otherwise
 */
function isValidVersion(version) {
  if (!version || typeof version !== 'string') {
    return false;
  }
  // Only digits and dots allowed
  return /^\d+\.\d+\.\d+$/.test(version);
}

/**
 * Compares two version strings.
 * @param {string} version1 - First version
 * @param {string} version2 - Second version
 * @returns {number} -1 if version1 < version2, 0 if equal, 1 if version1 > version2
 */
function compareVersions(version1, version2) {
  const v1Parts = version1.split('.').map(Number);
  const v2Parts = version2.split('.').map(Number);
  
  for (let i = 0; i < 3; i++) {
    if (v1Parts[i] < v2Parts[i]) return -1;
    if (v1Parts[i] > v2Parts[i]) return 1;
  }
  return 0;
}

/**
 * Prompts user for confirmation using readline.
 * @param {string} question - Question to ask
 * @returns {Promise<boolean>} True if user confirmed, false otherwise
 */
function askConfirmation(question) {
  const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout
  });

  return new Promise((resolve) => {
    rl.question(question, (answer) => {
      rl.close();
      const normalized = answer.trim().toLowerCase();
      resolve(normalized === 'y' || normalized === 'yes');
    });
  });
}

/**
 * Reads and parses JSON file.
 * @param {string} filePath - Path to JSON file
 * @returns {object} Parsed JSON object
 */
function readJsonFile(filePath) {
  try {
    const content = fs.readFileSync(filePath, 'utf8');
    return JSON.parse(content);
  } catch (error) {
    log(`❌ Error reading file ${filePath}: ${error.message}`, colors.red, true);
    throw error;
  }
}

/**
 * Writes JSON object to file with proper formatting.
 * @param {string} filePath - Path to JSON file
 * @param {object} data - JSON object to write
 */
function writeJsonFile(filePath, data) {
  try {
    const content = JSON.stringify(data, null, 2) + '\n';
    fs.writeFileSync(filePath, content, 'utf8');
  } catch (error) {
    log(`❌ Error writing file ${filePath}: ${error.message}`, colors.red, true);
    throw error;
  }
}

/**
 * Reads text file content.
 * @param {string} filePath - Path to text file
 * @returns {string} File content
 */
function readTextFile(filePath) {
  try {
    return fs.readFileSync(filePath, 'utf8');
  } catch (error) {
    log(`❌ Error reading file ${filePath}: ${error.message}`, colors.red, true);
    throw error;
  }
}

/**
 * Writes text file content.
 * @param {string} filePath - Path to text file
 * @param {string} content - Content to write
 */
function writeTextFile(filePath, content) {
  try {
    fs.writeFileSync(filePath, content, 'utf8');
  } catch (error) {
    log(`❌ Error writing file ${filePath}: ${error.message}`, colors.red, true);
    throw error;
  }
}

/**
 * Extracts version from image tag in env file line.
 * @param {string} line - Line from env file
 * @returns {string|null} Version string or null if not found
 */
function extractVersionFromImageTag(line) {
  // Match pattern: EVI_(FE|BE|DB)_IMAGE=ghcr.io/NAMESPACE/evi-(fe|be|db):VERSION (namespace: evi-app, vk74, etc.)
  const match = line.match(/^EVI_(FE|BE|DB)_IMAGE=ghcr\.io\/[^/]+\/evi-(fe|be|db):(.+)$/);
  return match ? match[3].trim() : null;
}

/**
 * Updates version in package.json file.
 * @param {string} filePath - Path to package.json
 * @param {string} newVersion - New version to set
 * @param {string} sourceVersion - Source version from root package.json
 * @returns {Promise<{updated: boolean, oldVersion: string|null}>}
 */
async function updatePackageJson(filePath, newVersion, sourceVersion) {
  if (!fs.existsSync(filePath)) {
    log(`❌ File not found: ${filePath}`, colors.red, true);
    throw new Error(`File not found: ${filePath}`);
  }

  const packageData = readJsonFile(filePath);
  const oldVersion = packageData.version || null;

  // Validate current version if exists
  if (oldVersion && !isValidVersion(oldVersion)) {
    log(`❌ Invalid version format in ${filePath}: "${oldVersion}"`, colors.red, true);
    log(`   Version must contain only digits and dots (format: MAJOR.MINOR.PATCH)`, colors.red);
    throw new Error(`Invalid version format: ${oldVersion}`);
  }

  // Check if version decreased
  if (oldVersion && compareVersions(newVersion, oldVersion) < 0) {
    log(`⚠️  Warning: Version will decrease in ${filePath}`, colors.yellow, true);
    log(`   Current version: ${oldVersion}`, colors.yellow);
    log(`   New version: ${newVersion}`, colors.yellow);
    
    const confirmed = await askConfirmation('   Continue and decrease version? (y/n): ');
    if (!confirmed) {
      log('   Update cancelled by user.', colors.yellow);
      throw new Error('Update cancelled by user');
    }
  }

  // Update version
  packageData.version = newVersion;
  writeJsonFile(filePath, packageData);

  return {
    updated: oldVersion !== newVersion,
    oldVersion: oldVersion
  };
}

/**
 * Updates version in image tags in evi.template.env file.
 * @param {string} filePath - Path to evi.template.env
 * @param {string} newVersion - New version to set
 * @returns {Promise<{updated: boolean, changes: Array<{line: string, oldVersion: string, newVersion: string}>}>}
 */
async function updateEnvTemplate(filePath, newVersion) {
  if (!fs.existsSync(filePath)) {
    log(`❌ File not found: ${filePath}`, colors.red, true);
    throw new Error(`File not found: ${filePath}`);
  }

  const content = readTextFile(filePath);
  const lines = content.split('\n');
  const changes = [];
  let hasChanges = false;

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];
    const oldVersion = extractVersionFromImageTag(line);

    if (oldVersion) {
      // Validate current version
      if (!isValidVersion(oldVersion)) {
        log(`❌ Invalid version format in ${filePath} at line ${i + 1}: "${oldVersion}"`, colors.red, true);
        log(`   Version must contain only digits and dots (format: MAJOR.MINOR.PATCH)`, colors.red);
        throw new Error(`Invalid version format: ${oldVersion}`);
      }

      // Check if version decreased
      if (compareVersions(newVersion, oldVersion) < 0) {
        log(`⚠️  Warning: Version will decrease in ${filePath} at line ${i + 1}`, colors.yellow, true);
        log(`   Current version: ${oldVersion}`, colors.yellow);
        log(`   New version: ${newVersion}`, colors.yellow);
        
        const confirmed = await askConfirmation('   Continue and decrease version? (y/n): ');
        if (!confirmed) {
          log('   Update cancelled by user.', colors.yellow);
          throw new Error('Update cancelled by user');
        }
      }

      // Update version in line
      if (oldVersion !== newVersion) {
        lines[i] = line.replace(`:${oldVersion}`, `:${newVersion}`);
        changes.push({
          line: line.trim(),
          oldVersion: oldVersion,
          newVersion: newVersion
        });
        hasChanges = true;
      }
    }
  }

  if (hasChanges) {
    writeTextFile(filePath, lines.join('\n'));
  }

  return {
    updated: hasChanges,
    changes: changes
  };
}

/**
 * Main function to synchronize versions.
 */
async function main() {
  try {
    log('\n🔄 Starting version synchronization...', colors.cyan, true);

    // Check if root package.json exists
    if (!fs.existsSync(ROOT_PACKAGE_JSON)) {
      log(`❌ Root package.json not found: ${ROOT_PACKAGE_JSON}`, colors.red, true);
      process.exit(1);
    }

    // Read version from root package.json
    const rootPackage = readJsonFile(ROOT_PACKAGE_JSON);
    const sourceVersion = rootPackage.version;

    if (!sourceVersion) {
      log(`❌ Version not found in root package.json`, colors.red, true);
      process.exit(1);
    }

    // Validate source version
    if (!isValidVersion(sourceVersion)) {
      log(`❌ Invalid version format in root package.json: "${sourceVersion}"`, colors.red, true);
      log(`   Version must contain only digits and dots (format: MAJOR.MINOR.PATCH)`, colors.red);
      process.exit(1);
    }

    log(`📦 Source version: ${sourceVersion}`, colors.blue);

    const updates = [];

    // Update back/package.json
    log(`\n📝 Updating back/package.json...`, colors.cyan);
    try {
      const result = await updatePackageJson(BACK_PACKAGE_JSON, sourceVersion, sourceVersion);
      if (result.updated) {
        updates.push({
          file: 'back/package.json',
          oldVersion: result.oldVersion,
          newVersion: sourceVersion
        });
        log(`   ✅ Updated: ${result.oldVersion || 'N/A'} → ${sourceVersion}`, colors.green);
      } else {
        log(`   ℹ️  Already up to date: ${sourceVersion}`, colors.blue);
      }
    } catch (error) {
      if (error.message === 'Update cancelled by user') {
        log(`\n❌ Synchronization cancelled.`, colors.red, true);
        process.exit(1);
      }
      throw error;
    }

    // Update front/package.json
    log(`\n📝 Updating front/package.json...`, colors.cyan);
    try {
      const result = await updatePackageJson(FRONT_PACKAGE_JSON, sourceVersion, sourceVersion);
      if (result.updated) {
        updates.push({
          file: 'front/package.json',
          oldVersion: result.oldVersion,
          newVersion: sourceVersion
        });
        log(`   ✅ Updated: ${result.oldVersion || 'N/A'} → ${sourceVersion}`, colors.green);
      } else {
        log(`   ℹ️  Already up to date: ${sourceVersion}`, colors.blue);
      }
    } catch (error) {
      if (error.message === 'Update cancelled by user') {
        log(`\n❌ Synchronization cancelled.`, colors.red, true);
        process.exit(1);
      }
      throw error;
    }

    // Update deployment/env/evi.template.env
    log(`\n📝 Updating deployment/env/evi.template.env...`, colors.cyan);
    try {
      const result = await updateEnvTemplate(ENV_TEMPLATE, sourceVersion);
      if (result.updated) {
        for (const change of result.changes) {
          updates.push({
            file: 'deployment/env/evi.template.env',
            oldVersion: change.oldVersion,
            newVersion: change.newVersion,
            line: change.line
          });
          log(`   ✅ Updated: ${change.oldVersion} → ${change.newVersion}`, colors.green);
        }
      } else {
        log(`   ℹ️  Already up to date: ${sourceVersion}`, colors.blue);
      }
    } catch (error) {
      if (error.message === 'Update cancelled by user') {
        log(`\n❌ Synchronization cancelled.`, colors.red, true);
        process.exit(1);
      }
      throw error;
    }

    // Summary
    log(`\n📊 Synchronization Summary:`, colors.blue, true);
    if (updates.length === 0) {
      log(`   All files are already synchronized with version ${sourceVersion}`, colors.green);
    } else {
      log(`   Updated ${updates.length} file(s):`, colors.green);
      for (const update of updates) {
        if (update.line) {
          log(`   - ${update.file} (${update.line}): ${update.oldVersion} → ${update.newVersion}`, colors.green);
        } else {
          log(`   - ${update.file}: ${update.oldVersion || 'N/A'} → ${update.newVersion}`, colors.green);
        }
      }
    }

    log(`\n✅ Version synchronization completed successfully!`, colors.green, true);
    process.exit(0);

  } catch (error) {
    log(`\n❌ Synchronization failed: ${error.message}`, colors.red, true);
    process.exit(1);
  }
}

// Run main function
main();
