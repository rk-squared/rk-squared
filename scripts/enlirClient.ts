import * as fs from 'fs-extra';
import { google } from 'googleapis';
import * as path from 'path';
import * as readline from 'readline';

import { logger } from './logger';

// This is equivalent to `typeof google.auth.OAuth2`, but importing it directly
// (and listing it as a dev. dependency) appears to be necessary to silence
// TypeScript warnings.
import { OAuth2Client } from 'google-auth-library';

// tslint:disable no-console

function questionAsync(r: readline.ReadLine, query: string): Promise<string> {
  return new Promise<string>(resolve => {
    r.question(query, resolve);
  });
}

export const workPath = path.join(__dirname, '..', 'tmp');
fs.ensureDirSync(workPath);

// The file token.json stores the user's access and refresh tokens.  It's
// created automatically when the authorization flow completes for the first
// time.
const tokenPath = (readWrite: boolean) =>
  path.join(workPath, readWrite ? 'readWriteToken.json' : 'token.json');

// noinspection SpellCheckingInspection
export const enlirSpreadsheetIds: { [name: string]: string } = {
  enlir: '16K1Zryyxrh7vdKVF1f7eRrUAOC5wuzvC3q2gFLch6LQ',
  community: '1f8OJIQhpycljDQ8QNDk_va1GJ1u7RVoMaNjFcHH0LKk',
  testCopy: '1adnGvYsHhxTk78RqTPDDYhALCbvBc6LF9avu_Pz0hgE',
};

interface GoogleApiCredentials {
  installed: {
    client_id: string;
    project_id: string;
    auth_uri: string;
    token_uri: string;
    auth_provider_x509_cert_url: string;
    client_secret: string;
    redirect_uris: [string, string];
  };
}

/**
 * Create an OAuth2 client with the given credentials, and then execute the
 * given callback function.
 */
export async function authorize(
  credentials: GoogleApiCredentials,
  readWrite = false,
): Promise<OAuth2Client> {
  const { client_secret, client_id, redirect_uris } = credentials.installed;
  const oAuth2Client = new google.auth.OAuth2(client_id, client_secret, redirect_uris[0]);

  // Check if we have previously stored a token.
  try {
    const token = await fs.readJson(tokenPath(readWrite));
    oAuth2Client.setCredentials(token);
    return oAuth2Client;
  } catch (e) {
    return getNewToken(oAuth2Client, readWrite);
  }
}

/**
 * Get and store new token after prompting for user authorization, and then
 * execute the given callback with the authorized OAuth2 client.
 */
async function getNewToken(oAuth2Client: OAuth2Client, readWrite = false): Promise<OAuth2Client> {
  const authUrl = oAuth2Client.generateAuthUrl({
    access_type: 'offline',
    scope: ['https://www.googleapis.com/auth/spreadsheets' + (readWrite ? '' : '.readonly')],
  });

  console.log('Authorize this app by visiting this url:', authUrl);
  const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout,
  });
  const code = await questionAsync(rl, 'Enter the code from that page here: ');
  rl.close();

  const token = (await oAuth2Client.getToken(code)).tokens;
  oAuth2Client.setCredentials(token);

  // Store the token to disk for later program executions
  const filename = tokenPath(readWrite);
  await fs.writeFile(filename, JSON.stringify(token));
  logger.info(`Token stored to ${filename}`);

  return oAuth2Client;
}

export async function loadEnlirCredentials() {
  const enlirCredentialsFilename = path.resolve(__dirname, '..', 'credentials.json');
  try {
    return await fs.readJson(enlirCredentialsFilename);
  } catch (e) {
    console.error(e.message);
    console.error('Please create a credentials.json file, following the instructions at');
    console.error('https://developers.google.com/sheets/api/quickstart/nodejs');
    return null;
  }
}

const numberToLetter = (n: number) => String.fromCharCode('A'.charCodeAt(0) + n);

export function rowColToCellId(row: number, col: number): string {
  let colLetter: string;
  if (col >= 26) {
    colLetter = numberToLetter(Math.floor(col / 26) - 1) + numberToLetter(col % 26);
  } else {
    colLetter = numberToLetter(col);
  }
  return colLetter + (row + 1);
}
