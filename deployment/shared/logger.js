#!/usr/bin/env node

// evi Shared Logger Utility
// Version: 1.0
// Description: Common logging utility for deployment scripts
// Backend file: logger.js

const colors = {
  reset: "\x1b[0m",
  bright: "\x1b[1m",
  cyan: "\x1b[36m",
  green: "\x1b[32m",
  red: "\x1b[31m",
  yellow: "\x1b[33m",
  blue: "\x1b[34m",
  magenta: "\x1b[35m",
  gray: "\x1b[90m"
};

/**
 * Prints a formatted message to the console
 * @param {string} message - The message to print
 * @param {string} color - The color to use for the message
 * @param {boolean} isBold - Whether to make the text bold
 */
function log(message, color = colors.reset, isBold = false) {
  const style = isBold ? colors.bright : '';
  console.log(`${style}${color}%s${colors.reset}`, message);
}

/**
 * Logs an info message
 * @param {string} message - The message to log
 */
function info(message) {
  log(`ℹ️  ${message}`, colors.blue);
}

/**
 * Logs a success message
 * @param {string} message - The message to log
 */
function success(message) {
  log(`✅ ${message}`, colors.green);
}

/**
 * Logs a warning message
 * @param {string} message - The message to log
 */
function warning(message) {
  log(`⚠️  ${message}`, colors.yellow);
}

/**
 * Logs an error message
 * @param {string} message - The message to log
 */
function error(message) {
  log(`❌ ${message}`, colors.red, true);
}

/**
 * Logs a step message
 * @param {string} message - The message to log
 */
function step(message) {
  log(`🚀 ${message}`, colors.cyan, true);
}

/**
 * Logs a progress message
 * @param {string} message - The message to log
 */
function progress(message) {
  log(`⏳ ${message}`, colors.magenta);
}

/**
 * Logs a completion message
 * @param {string} message - The message to log
 */
function complete(message) {
  log(`🎉 ${message}`, colors.green, true);
}

/**
 * Logs a separator line
 * @param {string} title - Optional title for the separator
 */
function separator(title = '') {
  const line = '='.repeat(50);
  if (title) {
    log(`\n${line}`, colors.cyan);
    log(`  ${title}`, colors.cyan, true);
    log(`${line}`, colors.cyan);
  } else {
    log(`\n${line}`, colors.gray);
  }
}

/**
 * Logs execution timing information
 * @param {string} action - The action that was performed
 * @param {number} duration - Duration in seconds
 */
function timing(action, duration) {
  log(`⏱️  ${action}: ${duration.toFixed(2)}s`, colors.gray);
}

/**
 * Logs a summary of execution timings
 * @param {Object} timings - Object containing action descriptions and their durations
 */
function summary(timings) {
  separator('Execution Summary');
  let total = 0;
  for (const [action, time] of Object.entries(timings)) {
    timing(action, time);
    total += time;
  }
  separator();
  timing('Total Time', total);
  separator();
}

module.exports = {
  log,
  info,
  success,
  warning,
  error,
  step,
  progress,
  complete,
  separator,
  timing,
  summary,
  colors
};
