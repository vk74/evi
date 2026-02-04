#!/usr/bin/env node

// evi Version Synchronization Script
// Version: 1.2.0
// Description: Propagates container versions from root package.json to env templates (no interactive prompts).
// Backend file: sync-version.js
// Logic: Reads eviDbVersion, eviFeVersion, eviBeVersion from root package.json (fallback to .version) and updates
// dev-ops/common/env/evi.template.env and deploy/env/evi.template.env. For full interactive sync (prompts, 02_schema), use release.sh prepare.
//
// Changes in v1.2.0:
// - Multi-version: read eviDbVersion, eviFeVersion, eviBeVersion from root package.json; update each EVI_*_IMAGE line with its version.
// - No longer updates back/package.json or front/package.json. Deploy env template added. Version format allows X.Y.Z-suffix (same as release.sh).
//
// Changes in v1.1.0:
// - Paths updated for dev-ops layout: package.json and env template relative to dev-ops/release/

const fs = require('fs');
const path = require('path');

// --- Configuration ---
const ROOT_PACKAGE_JSON = path.join(__dirname, '..', '..', 'package.json');
const ENV_TEMPLATE = path.join(__dirname, '..', 'common', 'env', 'evi.template.env');
const DEPLOY_ENV_TEMPLATE = path.join(__dirname, '..', '..', 'deploy', 'env', 'evi.template.env');

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
 * Validates version format: X.Y.Z or X.Y.Z-suffix (same as release.sh).
 * @param {string} version - Version string to validate
 * @returns {boolean} True if version is valid, false otherwise
 */
function isValidVersion(version) {
  if (!version || typeof version !== 'string') {
    return false;
  }
  return /^[0-9]+\.[0-9]+\.[0-9]+(-[a-zA-Z0-9.]+)?$/.test(version);
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
 * Updates a single component's image version in evi.template.env. Matches EVI_DB_IMAGE, EVI_FE_IMAGE, or EVI_BE_IMAGE.
 * @param {string[]} lines - Lines of the file (modified in place)
 * @param {string} envVar - EVI_DB_IMAGE | EVI_FE_IMAGE | EVI_BE_IMAGE
 * @param {string} newVersion - New version to set
 * @returns {Array<{oldVersion: string, newVersion: string}>} Changes made
 */
function updateEnvTemplateLineForComponent(lines, envVar, newVersion) {
  const changes = [];
  const re = new RegExp(`^(${envVar})=(.+)$`);
  for (let i = 0; i < lines.length; i++) {
    const match = lines[i].match(re);
    if (match) {
      const line = lines[i];
      const oldVersion = extractVersionFromImageTag(line);
      if (oldVersion && oldVersion !== newVersion) {
        lines[i] = line.replace(`:${oldVersion}`, `:${newVersion}`);
        changes.push({ oldVersion, newVersion });
      }
      break;
    }
  }
  return changes;
}

/**
 * Updates evi.template.env with three container versions (db, fe, be).
 * @param {string} filePath - Path to evi.template.env
 * @param {string} versionDb - evi-db version
 * @param {string} versionFe - evi-fe version
 * @param {string} versionBe - evi-be version
 * @returns {{ updated: boolean, changes: Array<{var: string, oldVersion: string, newVersion: string}> }}
 */
function updateEnvTemplateWithThreeVersions(filePath, versionDb, versionFe, versionBe) {
  if (!fs.existsSync(filePath)) {
    return { updated: false, changes: [] };
  }
  const content = readTextFile(filePath);
  const lines = content.split('\n');
  const allChanges = [];
  const c1 = updateEnvTemplateLineForComponent(lines, 'EVI_DB_IMAGE', versionDb);
  c1.forEach(c => allChanges.push({ var: 'EVI_DB_IMAGE', ...c }));
  const c2 = updateEnvTemplateLineForComponent(lines, 'EVI_FE_IMAGE', versionFe);
  c2.forEach(c => allChanges.push({ var: 'EVI_FE_IMAGE', ...c }));
  const c3 = updateEnvTemplateLineForComponent(lines, 'EVI_BE_IMAGE', versionBe);
  c3.forEach(c => allChanges.push({ var: 'EVI_BE_IMAGE', ...c }));
  if (allChanges.length > 0) {
    writeTextFile(filePath, lines.join('\n'));
  }
  return { updated: allChanges.length > 0, changes: allChanges };
}

/**
 * Main: read eviDbVersion, eviFeVersion, eviBeVersion from root package.json and propagate to env templates.
 */
function main() {
  try {
    log('\n🔄 Syncing container versions from package.json to env templates...', colors.cyan, true);

    if (!fs.existsSync(ROOT_PACKAGE_JSON)) {
      log(`❌ Root package.json not found: ${ROOT_PACKAGE_JSON}`, colors.red, true);
      process.exit(1);
    }

    const rootPackage = readJsonFile(ROOT_PACKAGE_JSON);
    const fallback = rootPackage.version || '';
    const versionDb = rootPackage.eviDbVersion || fallback;
    const versionFe = rootPackage.eviFeVersion || fallback;
    const versionBe = rootPackage.eviBeVersion || fallback;

    if (!versionDb || !versionFe || !versionBe) {
      log(`❌ Root package.json must have eviDbVersion, eviFeVersion, eviBeVersion (or version as fallback).`, colors.red, true);
      process.exit(1);
    }

    for (const v of [versionDb, versionFe, versionBe]) {
      if (!isValidVersion(v)) {
        log(`❌ Invalid version in package.json: "${v}". Use X.Y.Z or X.Y.Z-suffix.`, colors.red, true);
        process.exit(1);
      }
    }

    log(`📦 evi-db: ${versionDb}, evi-fe: ${versionFe}, evi-be: ${versionBe}`, colors.blue);

    const updates = [];

    log(`\n📝 Updating dev-ops/common/env/evi.template.env...`, colors.cyan);
    const result1 = updateEnvTemplateWithThreeVersions(ENV_TEMPLATE, versionDb, versionFe, versionBe);
    if (result1.updated) {
      for (const c of result1.changes) {
        updates.push({ file: 'dev-ops/common/env/evi.template.env', ...c });
        log(`   ✅ ${c.var}: ${c.oldVersion} → ${c.newVersion}`, colors.green);
      }
    } else {
      log(`   ℹ️  Already up to date`, colors.blue);
    }

    if (fs.existsSync(DEPLOY_ENV_TEMPLATE)) {
      log(`\n📝 Updating deploy/env/evi.template.env...`, colors.cyan);
      const result2 = updateEnvTemplateWithThreeVersions(DEPLOY_ENV_TEMPLATE, versionDb, versionFe, versionBe);
      if (result2.updated) {
        for (const c of result2.changes) {
          updates.push({ file: 'deploy/env/evi.template.env', ...c });
          log(`   ✅ ${c.var}: ${c.oldVersion} → ${c.newVersion}`, colors.green);
        }
      } else {
        log(`   ℹ️  Already up to date`, colors.blue);
      }
    } else {
      log(`\n📝 deploy/env/evi.template.env not found, skipping`, colors.yellow);
    }

    log(`\n📊 Summary:`, colors.blue, true);
    if (updates.length === 0) {
      log(`   Env templates already match package.json.`, colors.green);
    } else {
      log(`   Updated ${updates.length} line(s) in env template(s).`, colors.green);
    }

    log(`\n✅ Sync completed. For full sync (02_schema, interactive prompts), use: ./release.sh prepare`, colors.green, true);
    process.exit(0);
  } catch (error) {
    log(`\n❌ Synchronization failed: ${error.message}`, colors.red, true);
    process.exit(1);
  }
}

// Run main function
main();
