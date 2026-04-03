/**
 * Simple logger — prints to console with timestamp and level.
 * Add file logging here if you want persistent logs.
 */

function log(level, message) {
  const ts = new Date().toTimeString().slice(0, 8);
  const labels = { INFO: '\x1b[36m[INFO]\x1b[0m', OK: '\x1b[32m[OK]\x1b[0m', ERR: '\x1b[31m[ERR]\x1b[0m', WARN: '\x1b[33m[WARN]\x1b[0m', MSG: '\x1b[35m[MSG]\x1b[0m', AI: '\x1b[32m[AI]\x1b[0m', STT: '\x1b[34m[STT]\x1b[0m' };
  console.log(`${ts} ${labels[level] || `[${level}]`} ${message}`);
}

module.exports = { log };
