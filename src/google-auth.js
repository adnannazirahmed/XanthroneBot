const { google } = require('googleapis');
const fs = require('fs');
const path = require('path');
const { log } = require('./logger');

const CREDENTIALS_PATH = path.join(process.env.HOME, 'client.json');
const TOKEN_PATH = path.join(process.env.HOME, 'google-token.json');
const SCOPES = [
  'https://www.googleapis.com/auth/calendar',
  'https://www.googleapis.com/auth/tasks'
];

function getOAuthClient() {
  const credentials = JSON.parse(fs.readFileSync(CREDENTIALS_PATH));
  const { client_id, client_secret, redirect_uris } = credentials.installed;
  return new google.auth.OAuth2(client_id, client_secret, redirect_uris[0]);
}

function isAuthorized() {
  return fs.existsSync(TOKEN_PATH);
}

function getAuthorizedClient() {
  if (!isAuthorized()) throw new Error('Not authorized. Send /auth to the bot first.');
  const auth = getOAuthClient();
  const token = JSON.parse(fs.readFileSync(TOKEN_PATH));
  auth.setCredentials(token);
  return auth;
}

function getAuthUrl() {
  const auth = getOAuthClient();
  return auth.generateAuthUrl({ access_type: 'offline', scope: SCOPES });
}

async function saveToken(code) {
  const auth = getOAuthClient();
  const { tokens } = await auth.getToken(code);
  fs.writeFileSync(TOKEN_PATH, JSON.stringify(tokens));
  log('OK', 'Google token saved');
  return tokens;
}

module.exports = { getAuthorizedClient, getAuthUrl, saveToken, isAuthorized };
