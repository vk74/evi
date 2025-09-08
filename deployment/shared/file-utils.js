#!/usr/bin/env node

// ev2 File Utilities
// Version: 1.0
// Description: Common file operations for deployment scripts
// Backend file: file-utils.js

const fs = require('fs');
const path = require('path');
const logger = require('./logger');

/**
 * Checks if a file exists
 * @param {string} filePath - Path to the file
 * @returns {boolean} True if file exists
 */
function fileExists(filePath) {
  try {
    return fs.statSync(filePath).isFile();
  } catch (error) {
    return false;
  }
}

/**
 * Checks if a directory exists
 * @param {string} dirPath - Path to the directory
 * @returns {boolean} True if directory exists
 */
function dirExists(dirPath) {
  try {
    return fs.statSync(dirPath).isDirectory();
  } catch (error) {
    return false;
  }
}

/**
 * Creates a directory if it doesn't exist
 * @param {string} dirPath - Path to the directory
 * @returns {boolean} True if directory was created or already exists
 */
function ensureDir(dirPath) {
  try {
    if (!dirExists(dirPath)) {
      fs.mkdirSync(dirPath, { recursive: true });
      logger.info(`Created directory: ${dirPath}`);
    }
    return true;
  } catch (error) {
    logger.error(`Failed to create directory ${dirPath}: ${error.message}`);
    return false;
  }
}

/**
 * Reads a file and returns its contents
 * @param {string} filePath - Path to the file
 * @param {string} encoding - File encoding (default: 'utf8')
 * @returns {string} File contents
 */
function readFile(filePath, encoding = 'utf8') {
  try {
    return fs.readFileSync(filePath, encoding);
  } catch (error) {
    logger.error(`Failed to read file ${filePath}: ${error.message}`);
    throw error;
  }
}

/**
 * Writes content to a file
 * @param {string} filePath - Path to the file
 * @param {string} content - Content to write
 * @param {string} encoding - File encoding (default: 'utf8')
 * @returns {boolean} True if write was successful
 */
function writeFile(filePath, content, encoding = 'utf8') {
  try {
    const dir = path.dirname(filePath);
    ensureDir(dir);
    fs.writeFileSync(filePath, content, encoding);
    logger.info(`Written file: ${filePath}`);
    return true;
  } catch (error) {
    logger.error(`Failed to write file ${filePath}: ${error.message}`);
    return false;
  }
}

/**
 * Copies a file from source to destination
 * @param {string} srcPath - Source file path
 * @param {string} destPath - Destination file path
 * @returns {boolean} True if copy was successful
 */
function copyFile(srcPath, destPath) {
  try {
    const destDir = path.dirname(destPath);
    ensureDir(destDir);
    fs.copyFileSync(srcPath, destPath);
    logger.info(`Copied file: ${srcPath} -> ${destPath}`);
    return true;
  } catch (error) {
    logger.error(`Failed to copy file ${srcPath} to ${destPath}: ${error.message}`);
    return false;
  }
}

/**
 * Removes a file if it exists
 * @param {string} filePath - Path to the file
 * @returns {boolean} True if file was removed or didn't exist
 */
function removeFile(filePath) {
  try {
    if (fileExists(filePath)) {
      fs.unlinkSync(filePath);
      logger.info(`Removed file: ${filePath}`);
    }
    return true;
  } catch (error) {
    logger.error(`Failed to remove file ${filePath}: ${error.message}`);
    return false;
  }
}

/**
 * Removes a directory and all its contents
 * @param {string} dirPath - Path to the directory
 * @returns {boolean} True if directory was removed or didn't exist
 */
function removeDir(dirPath) {
  try {
    if (dirExists(dirPath)) {
      fs.rmSync(dirPath, { recursive: true, force: true });
      logger.info(`Removed directory: ${dirPath}`);
    }
    return true;
  } catch (error) {
    logger.error(`Failed to remove directory ${dirPath}: ${error.message}`);
    return false;
  }
}

/**
 * Lists files in a directory
 * @param {string} dirPath - Path to the directory
 * @param {string} extension - Optional file extension filter
 * @returns {Array} Array of file names
 */
function listFiles(dirPath, extension = null) {
  try {
    if (!dirExists(dirPath)) {
      return [];
    }
    
    const files = fs.readdirSync(dirPath);
    
    if (extension) {
      return files.filter(file => file.endsWith(extension));
    }
    
    return files;
  } catch (error) {
    logger.error(`Failed to list files in ${dirPath}: ${error.message}`);
    return [];
  }
}

/**
 * Processes a template file by replacing placeholders
 * @param {string} templatePath - Path to the template file
 * @param {Object} variables - Object with variable replacements
 * @param {string} destPath - Destination file path
 * @returns {boolean} True if processing was successful
 */
function processTemplate(templatePath, variables, destPath) {
  try {
    const template = readFile(templatePath);
    let processed = template;
    
    // Replace variables in format {{VARIABLE_NAME}}
    for (const [key, value] of Object.entries(variables)) {
      const placeholder = new RegExp(`{{${key}}}`, 'g');
      processed = processed.replace(placeholder, value);
    }
    
    return writeFile(destPath, processed);
  } catch (error) {
    logger.error(`Failed to process template ${templatePath}: ${error.message}`);
    return false;
  }
}

/**
 * Gets file size in bytes
 * @param {string} filePath - Path to the file
 * @returns {number} File size in bytes
 */
function getFileSize(filePath) {
  try {
    const stats = fs.statSync(filePath);
    return stats.size;
  } catch (error) {
    logger.error(`Failed to get file size for ${filePath}: ${error.message}`);
    return 0;
  }
}

/**
 * Gets file modification time
 * @param {string} filePath - Path to the file
 * @returns {Date} File modification time
 */
function getFileModTime(filePath) {
  try {
    const stats = fs.statSync(filePath);
    return stats.mtime;
  } catch (error) {
    logger.error(`Failed to get file modification time for ${filePath}: ${error.message}`);
    return new Date(0);
  }
}

module.exports = {
  fileExists,
  dirExists,
  ensureDir,
  readFile,
  writeFile,
  copyFile,
  removeFile,
  removeDir,
  listFiles,
  processTemplate,
  getFileSize,
  getFileModTime
};
