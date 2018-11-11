#!/usr/bin/env npx ts-node
/**
 * @file
 * Download data from the Enlir spreadsheet and convert to JSON.
 *
 * @see https://developers.google.com/sheets/api/quickstart/nodejs
 */

import * as fs from 'fs-extra';
import { google } from 'googleapis';
import * as path from 'path';
import * as readline from 'readline';
import * as yargs from 'yargs';

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

// noinspection SpellCheckingInspection
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
const toFloat = (value: string) => value === '' ? null : Number.parseFloat(value.replace(',', '.'));
const toString = (value: string) => value === '' ? null : value;
const checkToBool = (value: string) => value === '✓';

function toStringWithDecimals(value: string) {
  if (value === '') {
    return null;
  } else {
    return value.replace(/(\d+),(\d+)/, '$1.$2');
  }
}

function toCommon(field: string, value: string) {
  if (field === 'effects' || field === 'effect') {
    return toStringWithDecimals(value);
  } else if (field === 'id') {
    return toInt(value);
  } else if (field === 'gl') {
    return checkToBool(value);
  } else {
    return toString(value);
  }
}

const stats = new Set(['HP', 'ATK', 'DEF', 'MAG', 'RES', 'MND', 'ACC', 'EVA', 'SPD']);

const shouldAlwaysSkip = (col: string) => col === '✓' || col === 'Img';

function convertAbilities(rows: any[]): any[] {
  const abilities = [];

  for (let i = 1; i < rows.length; i++) {
    const item: any = {};

    let orb: string | null = null;

    for (let j = 0; j < rows[0].length; j++) {
      const col = rows[0][j];
      if (shouldAlwaysSkip(col)) {
        continue;
      }

      const field = _.camelCase(col);
      if (col === 'Counter') {
        item[field] = toBool(rows[i][j]);
      } else if (col === 'Rarity' || col === 'SB' || col === 'Uses' || col === 'Max') {
        item[field] = toInt(rows[i][j]);
      } else if (col === 'Multiplier' || col === 'Time') {
        item[field] = toFloat(rows[i][j]);
      } else if (col.match(/Orb \d+ Required/)) {
        item.orbs = item.orbs || {};
        orb = rows[i][j];
        if (orb) {
          item.orbs[orb] = [];
        }
      } else if (col === '') {
        if (rows[i][j]) {
          if (orb == null || orb === '') {
            throw new Error(`Got orb count with no orb at ${i} ${j}`);
          } else {
            item.orbs[orb].push(toInt(rows[i][j]));
          }
        }
      } else {
        item[field] = toCommon(field, rows[i][j]);
      }
    }

    abilities.push(item);
  }

  return abilities;
}

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

  let inEquipment = false;
  let inSkills = false;

  for (let i = 1; i < rows.length; i++) {
    const item: any = {};
    for (let j = 0; j < rows[0].length; j++) {
      const col = rows[0][j];
      if (shouldAlwaysSkip(col)) {
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
        item[currentStatGroup] = item[currentStatGroup] || {};
        item[currentStatGroup][field] = toInt(rows[i][j]);
      } else if (inSkills) {
        item['skills'] = item['skills'] || {};
        item['skills'][field] = toInt(rows[i][j]);
      } else if (inEquipment) {
        item['equipment'] = item['equipment'] || {};
        item['equipment'][field] = toBool(rows[i][j]);
      } else {
        item[field] = toCommon(field, rows[i][j]);
      }
    }
    characters.push(item);
  }

  return characters;
}

function convertMagicite(rows: any[]): any[] {
  return rows;
}

function convertRecordMateria(rows: any[]): any[] {
  const recordMateria: any[] = [];

  for (let i = 1; i < rows.length; i++) {
    const item: any = {};
    for (let j = 0; j < rows[0].length; j++) {
      const col = rows[0][j];
      if (shouldAlwaysSkip(col)) {
        continue;
      }

      const field = _.camelCase(col);
      item[field] = toCommon(field, rows[i][j]);
    }

    recordMateria.push(item);
  }

  return recordMateria;
}

function convertRelics(rows: any[]): any[] {
  const statAlias: { [col: string]: string } = {
    rar: 'Rarity',
    lv: 'Level',
  };

  function isStat(col: string): boolean {
    return stats.has(col.toUpperCase()) || col === 'Level' || col === 'Rarity';
  }

  // If this is an alternate stat (e.g., Blv for base level, or Matk for
  // maximum attack), then see what the stat would be.
  function colAsAltStat(col: string): string {
    const result = col.substr(1);
    return statAlias[result] || result;
  }

  function altStatField(col: string): string | null {
    if (col[0] === 'M') {
      return 'maxStats';
    } else if (col[0] === 'B') {
      return 'baseStats';
    } else {
      return null;
    }
  }

  function isAltStat(col: string): boolean {
    return !!altStatField(col) && isStat(colAsAltStat(col));
  }

  function toStat(field: string, value: string): number | 'S' | null {
    if (field === 'rarity' && value === 'S') {
      return 'S';
    } else {
      return toInt(value);
    }
  }

  const relics = [];

  for (let i = 1; i < rows.length; i++) {
    const item: any = {};

    for (let j = 0; j < rows[0].length; j++) {
      const col = rows[0][j];
      if (shouldAlwaysSkip(col)) {
        continue;
      }
      if (col === 'Synergy' || col === 'Combine') {
        if (rows[i][j]) {
          throw new Error(`Unexpected data for row ${i} column ${j}: ${rows[i][j]}`);
        }
        continue;
      }

      const field = _.camelCase(col);
      if (isStat(col)) {
        item.stats = item.stats || {};
        item.stats[field] = toStat(field, rows[i][j]);
      } else if (isAltStat(col)) {
        const f1 = altStatField(col) as string;
        const f2 = _.camelCase(colAsAltStat(col));
        item[f1] = item[f1] || {};
        item[f1][f2] = toStat(f2, rows[i][j]);
      } else {
        item[field] = toCommon(field, rows[i][j]);
      }
    }

    relics.push(item);
  }

  return relics;
}

const dataTypes = [
  {
    sheet: 'Abilities',
    localName: 'abilities',
    converter: convertAbilities,
  },
  {
    sheet: 'Characters',
    localName: 'characters',
    converter: convertCharacters,
  },
  {
    sheet: 'Magicite',
    localName: 'magicite',
    converter: convertMagicite,
  },
  {
    sheet: 'Record Materia',
    localName: 'recordMateria',
    converter: convertRecordMateria,
  },
  {
    sheet: 'Relics',
    localName: 'relics',
    converter: convertRelics,
  },
];

async function downloadEnlir(auth: OAuth2Client) {
  const sheets = google.sheets({ version: 'v4', auth });

  for (const { sheet, localName } of dataTypes) {
    console.log(`Downloading ${localName}...`);
    const res = await sheets.spreadsheets.values.get({
      spreadsheetId: enlirSpreadsheetId,
      range: sheet,
    });
    await fs.writeJson(path.join(workPath, localName + '.json'), res.data);
  }
}

async function convertEnlir() {
  for (const {localName, converter} of dataTypes) {
    console.log(`Converting ${localName}...`);
    const rawData = fs.readJsonSync(path.join(workPath, localName + '.json'));
    const data = converter(rawData.values);
    fs.writeJsonSync(path.join(outPath, localName + '.json'), data, {spaces: 2});
  }
}

const argv = yargs
  .option('download', {
    alias: 'd',
    default: true
  })
  .argv;

async function main() {
  if (argv.download) {
    const auth = await authorize(enlirCredentials);
    await downloadEnlir(auth);
  }
  await convertEnlir();
}

main().catch(e => console.error(e));
