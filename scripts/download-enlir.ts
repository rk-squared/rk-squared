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

import { logger } from './logger';

import * as _ from 'lodash';

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

const workPath = path.join(__dirname, '..', 'tmp');
fs.ensureDirSync(workPath);

// The file token.json stores the user's access and refresh tokens.  It's
// created automatically when the authorization flow completes for the first
// time.
const tokenPath = path.join(workPath, 'token.json');

// noinspection SpellCheckingInspection
const enlirSpreadsheetIds: { [name: string]: string } = {
  enlir: '16K1Zryyxrh7vdKVF1f7eRrUAOC5wuzvC3q2gFLch6LQ',
  community: '1f8OJIQhpycljDQ8QNDk_va1GJ1u7RVoMaNjFcHH0LKk',
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
  logger.info(`Token stored to ${tokenPath}`);

  return oAuth2Client;
}

const toBool = (value: string) => value === 'Y';
const toInt = (value: string) => (value === '' ? null : +value);
const toFloat = (value: string) =>
  value === '' ? null : Number.parseFloat(value.replace(',', '.'));
const toString = (value: string) => (value === '' ? null : value);
const checkToBool = (value: string) => value === '✓';

function toStringWithDecimals(value: string) {
  if (value === '') {
    return null;
  } else {
    return value.replace(/(\d+),(\d+)/g, '$1.$2');
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

// noinspection JSUnusedGlobalSymbols
/**
 * Fields common to "skills" - abilities, soul breaks, etc.
 */
const skillFields: { [col: string]: (value: string) => any } = {
  Type: toString,
  Target: toString,
  Formula: toString,
  Multiplier: toFloat,
  Element: toString,
  Time: toFloat,
  Effects: toStringWithDecimals,
  Counter: toBool,
  'Auto Target': toString,
  SB: toInt,
  Points: toInt,
};

// The '✓' column indicates whether a row has been confirmed (e.g., verified
// via data mining, instead of just being written up from descriptions).
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
      if (col === 'Rarity' || col === 'Uses' || col === 'Max') {
        item[field] = toInt(rows[i][j]);
      } else if (skillFields[col]) {
        item[field] = skillFields[col](rows[i][j]);
      } else if (col.match(/Orb \d+ Required/)) {
        item.orbs = item.orbs || {};
        orb = rows[i][j];
        if (orb) {
          item.orbs[orb] = [];
        }
      } else if (col === '') {
        if (rows[i][j]) {
          if (orb == null || orb === '') {
            throw new Error(`Got orb count with no orb at row ${i} column ${j}`);
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

  for (let i = 1; i < rows.length; i++) {
    const item: any = {};

    let inEquipment = false;
    let inSkills = false;

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

    if (item['name'] == null && (item['id'] == null || Number.isNaN(item['id']))) {
      // A footer row indicating an upcoming balance change, and not an actual
      // character.
      continue;
    }

    characters.push(item);
  }

  return characters;
}

/**
 * Post-process character data to add whether each character is in GL.  The
 * Characters sheet itself doesn't have a GL column, and the Google Sheets API
 * doesn't appear to offer a way to get at the formatting (background color)
 * that indicates whether a character is in GL.  Instead, we can look at
 * per-character items (specifically, record materia) to see if those are in
 * GL.
 */
function postProcessCharacters(characters: any[], allData: { [localName: string]: any[] }) {
  const isCharacterInGl: { [character: string]: boolean } = {};
  _.forEach(allData.recordMateria, i => {
    if (i.gl) {
      isCharacterInGl[i.character] = true;
    }
  });

  for (const c of characters) {
    c.gl = isCharacterInGl[c.name] || false;
  }
}

function convertMagicite(rows: any[]): any[] {
  const magicite: any[] = [];

  let passive: string | null = null;

  for (let i = 1; i < rows.length; i++) {
    if (!rows[i].length) {
      // Skip explanatory text at the bottom of the sheet.
      break;
    }

    const item: any = {};

    let inUltraSkill = false;
    let skipUltraSkill = false;

    for (let j = 0; j < rows[0].length; j++) {
      const col = rows[0][j];
      if (shouldAlwaysSkip(col)) {
        continue;
      }

      if (col === 'Magicite Ultra Skill') {
        inUltraSkill = true;
        skipUltraSkill = rows[i][j] === '-';
      } else if (col === 'Name (JP)') {
        inUltraSkill = false;
      }

      const field = _.camelCase(col);
      if (col === 'Rarity') {
        item[field] = toInt(rows[i][j]);
      } else if (stats.has(col)) {
        item.stats = item.stats || {};
        item.stats[field] = toInt(rows[i][j]);
      } else if (col.match(/Passive \d+/)) {
        passive = rows[i][j];
        if (passive) {
          item.passives = item.passives || {};
          item.passives[passive] = {};
        }
      } else if (col.match(/^\d+$/)) {
        if (rows[i][j]) {
          if (!passive) {
            throw new Error(`Missing passive at row ${i} column ${j}`);
          }
          item.passives[passive][+col] = toInt(rows[i][j]);
        }
      } else if (col === 'Cooldown' || col === 'Duration') {
        item[field] = toFloat(rows[i][j]);
      } else if (col === 'Magicite Ultra Skill') {
        if (!skipUltraSkill) {
          item.magiciteUltraSkill = {
            name: rows[i][j],
          };
        }
      } else if (inUltraSkill) {
        if (!skipUltraSkill) {
          const converter = skillFields[col] || toCommon;
          item.magiciteUltraSkill[field] = converter(rows[i][j]);
        }
      } else {
        item[field] = toCommon(field, rows[i][j]);
      }
    }

    magicite.push(item);
  }

  return magicite;
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
        // Hack: Duplicate the "normal" rarity at the relic level - it often
        // make more sense there, especially for non-upgradeable relics like
        // accessories.
        if (field === 'rarity') {
          item.rarity = toStat(field, rows[i][j]);
        }

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

function convertSoulBreaks(rows: any[]): any[] {
  const soulBreaks: any[] = [];

  for (let i = 1; i < rows.length; i++) {
    const item: any = {};
    for (let j = 0; j < rows[0].length; j++) {
      const col = rows[0][j];
      if (shouldAlwaysSkip(col)) {
        continue;
      }

      const field = _.camelCase(col);
      if (skillFields[col]) {
        item[field] = skillFields[col](rows[i][j]);
      } else {
        item[field] = toCommon(field, rows[i][j]);
      }
    }

    soulBreaks.push(item);
  }

  return soulBreaks;
}

interface DataType {
  sheet: string;
  localName: string;
  converter: (rows: any[]) => any[];
  postProcessor?: (data: any[], allData: { [localName: string]: any[] }) => void;
}

const dataTypes: DataType[] = [
  {
    sheet: 'Abilities',
    localName: 'abilities',
    converter: convertAbilities,
  },
  {
    sheet: 'Characters',
    localName: 'characters',
    converter: convertCharacters,
    postProcessor: postProcessCharacters,
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
  {
    sheet: 'Soul Breaks',
    localName: 'soulBreaks',
    converter: convertSoulBreaks,
  },
];

async function downloadEnlir(auth: OAuth2Client, spreadsheetId: string) {
  const sheets = google.sheets({ version: 'v4', auth });

  for (const { sheet, localName } of dataTypes) {
    logger.info(`Downloading ${localName}...`);
    const res = await sheets.spreadsheets.values.get({
      spreadsheetId,
      range: sheet,
    });
    await fs.writeJson(path.join(workPath, localName + '.json'), res.data);
  }
}

async function convertEnlir(outputDirectory: string) {
  await fs.ensureDir(outputDirectory);

  const allData: { [name: string]: any[] } = {};
  for (const { localName, converter } of dataTypes) {
    logger.info(`Converting ${localName}...`);
    const rawData = await fs.readJson(path.join(workPath, localName + '.json'));
    allData[localName] = converter(rawData.values);
  }

  for (const { localName, postProcessor } of dataTypes) {
    if (!postProcessor) {
      continue;
    }
    logger.info(`Post-processing ${localName}...`);
    postProcessor(allData[localName], allData);
  }

  for (const { localName } of dataTypes) {
    logger.info(`Writing ${localName}...`);
    const outputFile = path.join(outputDirectory, localName + '.json');
    if (fs.existsSync(outputFile)) {
      fs.renameSync(outputFile, outputFile + '.bak');
    }
    await fs.writeJson(outputFile, allData[localName], { spaces: 2 });
  }
}

const argv = yargs
  .option('download', {
    alias: 'd',
    default: true,
    description: 'Download latest. Use --no-download to only convert previous downloaded data.',
  })
  .option('sheet', {
    default: 'community',
    choices: Object.keys(enlirSpreadsheetIds),
    description: 'Sheets to download: original Enlir data or new Community sheet.',
  })
  .option('output-directory', {
    alias: 'o',
    description: 'output directory',
    demandOption: true,
  }).argv;

// To do: Should we use an API key, rather than OAuth2 credentials, since we're only using public data?
async function loadEnlirCredentials() {
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

async function main() {
  if (argv.download) {
    const enlirCredentials = await loadEnlirCredentials();
    if (!enlirCredentials) {
      return;
    }

    const auth = await authorize(enlirCredentials);
    await downloadEnlir(auth, enlirSpreadsheetIds[argv.sheet]);
  }
  await convertEnlir(argv.outputDirectory);
}

main().catch(e => console.error(e));
