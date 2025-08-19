#!/usr/bin/env node

/**
 * Version synchronization script for EV2 project
 * Synchronizes version across backend, frontend, and database
 * 
 * Usage:
 *   node scripts/sync-version.js [version]
 *   node scripts/sync-version.js 0.5.0
 */

const fs = require('fs');
const path = require('path');

// Colors for console output
const colors = {
  reset: '\x1b[0m',
  bright: '\x1b[1m',
  red: '\x1b[31m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  magenta: '\x1b[35m',
  cyan: '\x1b[36m'
};

function log(message, color = 'reset') {
  console.log(`${colors[color]}${message}${colors.reset}`);
}

function readVersion() {
  try {
    return fs.readFileSync('VERSION', 'utf8').trim();
  } catch (error) {
    log('❌ Error reading VERSION file', 'red');
    process.exit(1);
  }
}

function updatePackageJson(packagePath, version) {
  try {
    const packageJsonPath = path.resolve(packagePath);
    const packageJson = JSON.parse(fs.readFileSync(packageJsonPath, 'utf8'));
    
    const oldVersion = packageJson.version;
    packageJson.version = version;
    
    fs.writeFileSync(packageJsonPath, JSON.stringify(packageJson, null, 2) + '\n');
    
    log(`✅ ${packagePath}: ${oldVersion} → ${version}`, 'green');
    return true;
  } catch (error) {
    log(`❌ Error updating ${packagePath}: ${error.message}`, 'red');
    return false;
  }
}

function updateDatabaseVersion(dbPath, version) {
  try {
    const files = [
      'db/init/01_schema.sql',
      'db/versions/v0.5.0.sql'
    ];
    
    files.forEach(file => {
      const filePath = path.resolve(file);
      let content = fs.readFileSync(filePath, 'utf8');
      
      // Update version in INSERT statement
      const versionRegex = /INSERT INTO app\.app_version \(version, schema_version\) \nVALUES \('([^']+)', '([^']+)'\)/;
      const match = content.match(versionRegex);
      
      if (match) {
        const newInsert = `INSERT INTO app.app_version (version, schema_version) 
VALUES ('v${version}', '001')`;
        content = content.replace(versionRegex, newInsert);
        fs.writeFileSync(filePath, content);
        log(`✅ ${file}: Updated to v${version}`, 'green');
      }
    });
    
    return true;
  } catch (error) {
    log(`❌ Error updating database files: ${error.message}`, 'red');
    return false;
  }
}

function main() {
  log('🔄 EV2 Version Synchronization', 'cyan');
  log('================================', 'cyan');
  
  // Get version from command line or VERSION file
  const version = process.argv[2] || readVersion();
  
  if (!version) {
    log('❌ No version specified', 'red');
    log('Usage: node scripts/sync-version.js [version]', 'yellow');
    process.exit(1);
  }
  
  log(`📦 Synchronizing version: ${version}`, 'blue');
  log('');
  
  // Update package.json files
  const packages = [
    'back/package.json',
    'front/package.json'
  ];
  
  let success = true;
  
  packages.forEach(pkgPath => {
    if (!updatePackageJson(pkgPath, version)) {
      success = false;
    }
  });
  
  // Update database version files
  if (!updateDatabaseVersion('db', version)) {
    success = false;
  }
  
  // Update root VERSION file
  try {
    fs.writeFileSync('VERSION', version + '\n');
    log(`✅ VERSION: Updated to ${version}`, 'green');
  } catch (error) {
    log(`❌ Error updating VERSION file: ${error.message}`, 'red');
    success = false;
  }
  
  log('');
  if (success) {
    log('🎉 Version synchronization completed successfully!', 'green');
    log('');
    log('Next steps:', 'yellow');
    log('1. Review the changes', 'yellow');
    log('2. Commit the changes: git add . && git commit -m "Sync version to ' + version + '"', 'yellow');
    log('3. Push to repository: git push', 'yellow');
  } else {
    log('❌ Version synchronization failed!', 'red');
    process.exit(1);
  }
}

// Run the script
if (require.main === module) {
  main();
}

module.exports = { updatePackageJson, updateDatabaseVersion, readVersion };
