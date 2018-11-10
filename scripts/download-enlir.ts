#!/usr/bin/env npx ts-node

import * as fs from 'fs-extra';
import { google } from 'googleapis';
import { APIEndpoint } from 'googleapis-common';
import * as path from 'path';
import * as readline from 'readline';

import * as _ from 'lodash';

// This is equivalent to `typeof google.auth.OAuth2`, but importing it directly
// (and listing it as a dev. dependency) appears to be necessary to silence
// TypeScript warnings.
import { OAuth2Client } from 'google-auth-library';

// tslint:disable no-console

function questionAsync(r: readline.ReadLine, query: string): Promise<string> {
  return new Promise<string>((resolve) => {
    r.question(query, resolve);
  });
}

const workPath = path.join(__dirname, 'tmp');
const outPath = path.join(__dirname, '..', 'app', 'data', 'enlir');
fs.ensureDirSync(workPath);

// The file token.json stores the user's access and refresh tokens, and is
// created automatically when the authorization flow completes for the first
// time.
const tokenPath = path.join(workPath, 'token.json');

// Load client secrets from a local file.
const enlirCredentials = require('../credentials.json');

const enlirSpreadsheetId = '16K1Zryyxrh7vdKVF1f7eRrUAOC5wuzvC3q2gFLch6LQ';

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
async function authorize(credentials: GoogleApiCredentials): Promise<OAuth2Client> {
  const { client_secret, client_id, redirect_uris } = credentials.installed;
  const oAuth2Client = new google.auth.OAuth2(client_id, client_secret, redirect_uris[0]);

  // Check if we have previously stored a token.
  try {
    const token = await fs.readJson(tokenPath);
    oAuth2Client.setCredentials(token);
    return oAuth2Client;
  } catch (e) {
    return getNewToken(oAuth2Client);
  }
}

/**
 * Get and store new token after prompting for user authorization, and then
 * execute the given callback with the authorized OAuth2 client.
 */
async function getNewToken(oAuth2Client: OAuth2Client): Promise<OAuth2Client> {
  const authUrl = oAuth2Client.generateAuthUrl({
    access_type: 'offline',
    scope: ['https://www.googleapis.com/auth/spreadsheets.readonly'],
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
  await fs.writeFile(tokenPath, JSON.stringify(token));
  console.log('Token stored to', tokenPath);

  return oAuth2Client;
}

const toBool = (value: string) => value === 'Y';
const toInt = (value: string) => value === '' ? null : +value;

function convertCharacters(rows: any[]): any[] {
  const characters = [];

  const statGroups = new Set([
    'Introducing Event (Lv50)',
    'Introducing Event (Lv65)',
    'Introducing Event (Lv80)',
    'Introducing Event (Lv99)',
    'Introducing Event (Record Spheres)',
    'Introducing Event (Legend Spheres)',
  ]);
  let currentStatGroup: string | null = null;
  const stats = new Set(['HP', 'ATK', 'DEF', 'MAG', 'RES', 'MND', 'ACC', 'EVA', 'SPD']);

  let inEquipment = false;
  let inSkills = false;

  for (let i = 1; i < rows.length; i++) {
    const character: any = {};
    for (let j = 0; j < rows[0].length; j++) {
      const col = rows[0][j];
      if (col === '✓') {
        continue;
      }

      // Check which group of columns we're in.  The code is written like this
      // to try to avoid having to hard-code a list of all equipment types and
      // all skill types.
      if (statGroups.has(col)) {
        currentStatGroup = _.camelCase(col.match(/\((.*)\)/)[0]);
        inSkills = inEquipment = false;
      } else if (currentStatGroup && !stats.has(col)) {
        currentStatGroup = null;
      }
      if (col === 'Dagger') {
        inEquipment = true;
        inSkills = false;
      } else if (col === 'Black Magic') {
        inSkills = true;
        inEquipment = false;
      } else if (col === 'ID' || col.match(/JP/) || col === 'GL') {
        inSkills = inEquipment = false;
      }

      // Process the columns.
      const field = _.camelCase(col);
      if (currentStatGroup && !statGroups.has(col)) {
        character[currentStatGroup] = character[currentStatGroup] || {};
        character[currentStatGroup][field] = toInt(rows[i][j]);
      } else if (inSkills) {
        character['skills'] = character['skills'] || {};
        character['skills'][field] = toInt(rows[i][j]);
      } else if (inEquipment) {
        character['equipment'] = character['equipment'] || {};
        character['equipment'][field] = toBool(rows[i][j]);
      } else if (field === 'id') {
        character[field] = toInt(rows[i][j]);
      } else {
        character[field] = rows[i][j];
      }
    }
    characters.push(character);
  }

  return characters;
}

/**
 * Prints the names and majors of students in a sample spreadsheet:
 * @see https://docs.google.com/spreadsheets/d/1BxiMVs0XRA5nFMdKvBdBZjgmUUqptlbs74OgvE2upms/edit
 */
async function downloadEnlir(auth: OAuth2Client) {
  const sheets = google.sheets({ version: 'v4', auth });

  for (const sheet of ['Characters']) {
    const res = await sheets.spreadsheets.values.get({
      spreadsheetId: enlirSpreadsheetId,
      range: sheet,
    });
    await fs.writeJson(path.join(workPath, _.camelCase(sheet) + '.json'), res.data);
  }
}

async function convertEnlir() {
  const characterData = fs.readJsonSync(path.join(workPath, 'characters.json'));
  const characters = convertCharacters(characterData.values);
  fs.writeJsonSync(path.join(outPath, 'characters.json'), characters, {spaces: 2});
}

async function main() {
  //const auth = await authorize(enlirCredentials);
  //await downloadEnlir(auth);
  await convertEnlir();
}

main().catch(e => console.error(e));
