#!/usr/bin/env -S npx ts-node
/**
 * @file
 * Download data from the Enlir spreadsheet and convert to JSON.
 *
 * @see https://developers.google.com/sheets/api/quickstart/nodejs
 */

import * as fs from 'fs-extra';
import { google } from 'googleapis';
import * as path from 'path';
import { sprintf } from 'sprintf-js';
import * as yargs from 'yargs';

import * as _ from 'lodash';

// This is equivalent to `typeof google.auth.OAuth2`, but importing it directly
// (and listing it as a dev. dependency) appears to be necessary to silence
// TypeScript warnings.
import { OAuth2Client } from 'google-auth-library';

import { logger } from '../app/utils/logger';
import { authorize, enlirSpreadsheetIds, loadEnlirCredentials, workPath } from './enlirClient';

function logError(e: Error, rowNumber: number, colNumber: number, colName: string, row: string[]) {
  logger.error(`Error on row ${rowNumber + 1} ${colName}: ${e}`);
  logger.error(JSON.stringify(row, undefined, 2));
}

const toBool = (value: string) => value === 'Y';
const toInt = (value: string) => (value === '' ? null : +value);
const toFloat = (value: string) =>
  !value ? null : Number.parseFloat(value.replace(',', '.'));
const toString = (value: string) => (value === '' ? null : value);
const checkToBool = (value: string) => value === '✓';
const toDate = (value: string) => {
  if (!value || value === '?') {
    return null;
  }
  const m = value.match(/^(\d{1,2})\/(\d{1,2})\/(\d{4})$/);
  if (!m) {
    throw new Error(`Failed to parse date ${value}`);
  }
  return sprintf('%04i-%02i-%02i', +m[3], +m[1], +m[2]);
};

function isDataMined(dataMinedCol:number, globalCol:number, row:any[]) {
  return row[dataMinedCol] === '✓' || row[globalCol] === '✓';
}

function dashAs<TDash, TValue>(
  dashValue: TDash,
  f: (value: string) => TValue,
): (value: string) => TValue | TDash {
  return (value: string) => (value === '-' ? dashValue : f(value));
}
const dashBlank = <T>(f: (value: string) => T) => dashAs('', f);
const dashNull = <T>(f: (value: string) => T) => dashAs(null, f);
function toCommaSeparatedArray<T>(f: (value: string | null) => T): (value: string) => T[] | null {
  return (value: string) => (value == null || value === '' ? null : value.split(', ').map(f));
}

function toStringWithDecimals(value: string) {
  // Convert commas (European decimal separator) to decimals for versions
  // of the spreadsheet prior to 5/6/2019.
  //
  // We used to also convert '' to null, but nearly all skills, statuses,
  // legend materia, and record materia have non-null effect(s), so requiring
  // code to support null adds too much complexity for too little benefit.
  if(!value) {
    return '';
  }
  return value.replace(/(\d+),(\d+)/g, '$1.$2');
}

function toStringWithLookup(lookup: _.Dictionary<string>) {
  return (s: string) => lookup[s] || s;
}

function toCommon(field: string, value: string) {
  if (field === 'effects' || field === 'effect') {
    return toStringWithDecimals(value);
  } else if (field === 'character' || field === 'realm' || field === 'relic') {
    return dashNull(toString)(value);
  } else if (field === 'id') {
    return toInt(value);
  } else if (field === 'gl') {
    return checkToBool(value);
  } else {
    return toString(value);
  }
}

const stats = new Set(['HP', 'ATK', 'DEF', 'MAG', 'RES', 'MND', 'ACC', 'EVA', 'SPD']);

const elementAbbreviations: _.Dictionary<string> = {
  'Wat.': 'Water',
  'Ea.': 'Earth',
};

// noinspection JSUnusedGlobalSymbols
/**
 * Fields common to "skills" - abilities, soul breaks, etc.
 */
const skillFields: { [col: string]: (value: string) => any } = {
  Type: toString,
  Target: dashNull(toString),
  Formula: toString,
  Multiplier: toFloat,
  Element: dashAs([], toCommaSeparatedArray(toStringWithLookup(elementAbbreviations))),
  Time: toFloat,
  Effects: dashBlank(toStringWithDecimals),
  Counter: toBool,
  'Auto Target': toString,
  SB: toInt,
  Points: toInt,
  Brave: toInt,
  'Brave Condition': toCommaSeparatedArray(toString),
  'Synchro Condition': toCommaSeparatedArray(toString),
  'Soulbreak Bonus': toCommaSeparatedArray(toString),
  'Limit Break Bonus': toCommaSeparatedArray(toString),
  'Minimum LB Points': toInt,
  'Guardian Ability Slot': toString,
};

// The '✓' column indicates whether a row has been confirmed (e.g., verified
// via data mining, instead of just being written up from descriptions).
const shouldAlwaysSkip = (col: string) => col === '✓' || col === 'Img';

// As of May 2019, the Anima column is inconsistent across different tabs:
// "Anima?" for legend materia and "Anima" for soul breaks.
const isAnima = (col: string) => col === 'Anima' || col === 'Anima?';

function checkSkillNotes(
  notes: NotesRowData[] | undefined,
  field: string,
  i: number,
  j: number,
  item: any,
) {
  const cellNote = _.get(notes, [i, 'values', j, 'note']);
  if (cellNote) {
    if (field === 'school') {
      item['schoolDetails'] = cellNote.split(' / ');
    } else if (field === 'type') {
      item['typeDetails'] = cellNote.split('/');
    } else {
      item[field + 'Note'] = cellNote;
    }
  }
}

function convertAbilities(rows: any[], notes?: NotesRowData[]): any[] {
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
      if (
        col === 'Rarity' ||
        col === 'Uses' ||
        col === 'Max' ||
        col === 'Synchro Ability Slot' ||
        col === 'Synchro Condition ID'
      ) {
        item[field] = toInt(rows[i][j]);
      } else if (isAnima(col)) {
        item['anima'] = toInt(rows[i][j]);
      } else if (skillFields[col]) {
        item[field] = skillFields[col](rows[i][j]);
      } else if (col.match(/Orb \d+ Required/)) {
        item.orbs = item.orbs || {};
        orb = rows[i][j];
        if (orb && orb !== '-') {
          item.orbs[orb] = [];
        }
      } else if (col === '' || col.match(/^\d-R\d$/)) {
        // The spreadsheet used to have blank column names for orb costs.  Now,
        // it has columns 1-R1 through 4-R5.  We could perhaps simplify our code
        // by taking advantage of those numbers.
        if (rows[i][j] && orb !== '-' && orb !== null) {
          if (rows[i][j] !== '-' && (orb === '' || orb === '-')) {
            throw new Error(`Got orb count with no orb at row ${i} column ${j}`);
          } else if (!item.orbs[orb].length && (rows[i][j] === '?' || rows[i][j] === '')) {
            // Record Board rank 1 has no orb costs, but the spreadsheet may
            // represent that inconsistently.
            item.orbs[orb].push(0);
          } else {
            item.orbs[orb].push(toInt(rows[i][j]));
          }
        }
      } else {
        item[field] = toCommon(field, rows[i][j]);
      }

      checkSkillNotes(notes, field, i, j, item);
    }

    abilities.push(item);
  }

  return abilities;
}

/**
 * Post-process abilities to remove "(Character Only)" from record boards and
 * replace it with a new character name field.  This is implemented as a
 * post-processor so that it can access the characters list if necessary,
 * although it doesn't currently need it.
 */
function postProcessAbilities(abilities: any[]) {
  // We're looking for abilities ending in "(Character only)".  Allow a single
  // pair of nested parenthesis but no more, so that we can handle names like
  // "(Cecil (Paladin) Only)" and "Jump (III) (Luneth Only)".
  const recordBoardCharacterRegex = / \(([^()]+(?:\([^()]+\))?) Only\)$/;
  _.forEach(abilities, (ability) => {
    const orbs = Object.keys(ability.orbs);
    const m = ability.name.match(recordBoardCharacterRegex);
    if (!m || !orbs[orbs.length - 1].match(/Record Board$/)) {
      return;
    }

    ability.recordBoardCharacter = m[1];
    ability.name = ability.name.replace(recordBoardCharacterRegex, '');
  });
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
      const colWithinStatGroup = col.replace(/ - (50|65|80|99|RS|LD)$/, '');
      if (statGroups.has(col)) {
        currentStatGroup = _.camelCase(col.match(/\((.*)\)/)[0]);
        inSkills = inEquipment = false;
      } else if (currentStatGroup && !stats.has(colWithinStatGroup)) {
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
      const fieldWithinStatGroup = _.camelCase(colWithinStatGroup);
      if (currentStatGroup && !statGroups.has(col)) {
        item[currentStatGroup] = item[currentStatGroup] || {};
        item[currentStatGroup][fieldWithinStatGroup] = toInt(rows[i][j]);
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
    if (item['realm'] === 'DB Only' || item['realm'] === 'SB Only') {
      // Skip "DB Only" (typo for SB Only?) characters like
      // Shadowsmith and Shared.
      logger.debug('Skipping ' + item['name'] + ' (SB Only)');
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
  _.forEach(allData.recordMateria, (i) => {
    if (i.gl) {
      isCharacterInGl[i.character] = true;
    }
  });

  for (const c of characters) {
    c.gl = isCharacterInGl[c.name] || false;
  }
}

function convertEvents(rows: any[]): any[] {
  const fieldAliases: _.Dictionary<string> = {
    memoryCrystals: 'memoryCrystals1',
    memoryCrystalsIi: 'memoryCrystals2',
    memoryCrystalsIii: 'memoryCrystals3',
  };
  const arrayFields = new Set<string>([
    'heroRecords',
    'memoryCrystals1',
    'memoryCrystals2',
    'memoryCrystals3',
    'wardrobeRecords',
    'abilitiesAwarded',
  ]);
  const toCommaSeparatedStringArray = toCommaSeparatedArray(toString);

  const events: any[] = [];

  for (let i = 1; i < rows.length; i++) {
    const item: any = {};
    for (let j = 0; j < rows[0].length; j++) {
      const col = rows[0][j];
      if (shouldAlwaysSkip(col)) {
        continue;
      }

      try {
        let field = _.camelCase(col);
        field = fieldAliases[field] || field;
        if (arrayFields.has(field)) {
          item[field] = toCommaSeparatedStringArray(rows[i][j]);
        } else if (field === 'glDate' || field === 'jpDate') {
          item[field] = dashNull(toDate)(rows[i][j]);
        } else {
          item[field] = toCommon(field, rows[i][j]);
        }
      } catch (e) {
        logError(e, i, j, col, rows[i]);
        throw e;
      }
    }

    events.push(item);
  }

  return events;
}

function convertLegendMateria(rows: any[]): any[] {
  const legendMateria: any[] = [];

  for (let i = 1; i < rows.length; i++) {
    const item: any = {};
    if (!rows.length || !rows[i][0]) {
      // Skip explanatory text at the bottom of the sheet.
      break;
    }      
    for (let j = 0; j < rows[0].length; j++) {
      const col = rows[0][j];
      if (shouldAlwaysSkip(col)) {
        continue;
      }

      const field = _.camelCase(col);
      if (field === 'relic' || field === 'tier') {
        item[field] = dashNull(toString)(rows[i][j]);
      } else if (isAnima(col)) {
        item['anima'] = toInt(rows[i][j]);
      } else {
        item[field] = toCommon(field, rows[i][j]);
      }
    }

    legendMateria.push(item);
  }

  return legendMateria;
}

function convertMagicite(rows: any[]): any[] {
  const magicite: any[] = [];

  let passive: string | null = null;

  const columnsByName: _.Dictionary<string> = _.fromPairs(
    rows[0].map((col: string, i: number) => [col, i]),
  );

  for (let i = 1; i < rows.length; i++) {
    if (!rows[i].length) {
      // Skip explanatory text at the bottom of the sheet.
      break;
    }

    if (!rows[i][columnsByName['ID']]) {
      // Skip magicite that are not yet released and have no ID.
      logger.debug('Skipping ' + rows[i][columnsByName['Name']] + ' (not yet released)');
      continue;
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

      try {
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
            const converter = skillFields[col] || toCommon.bind(undefined, field);
            item.magiciteUltraSkill[field] = converter(rows[i][j]);
          }
        } else {
          item[field] = toCommon(field, rows[i][j]);
        }
      } catch (e) {
        logError(e, i, j, col, rows[i]);
        throw e;
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
        // make more sense there, especially for non-upgradable relics like
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
      } else if (col === 'Effect') {
        item[field] = toStringWithDecimals(rows[i][j]) || null;
      } else if (col === 'Fixed Passive Effects') {
        item['fixedEffects'] = rows[i][j].split('\n');
      } else if (col === 'Random Passive Effects') {
        item['randomEffects'] = rows[i][j].split('\n');
      } else {
        item[field] = toCommon(field, rows[i][j]);
      }
    }

    relics.push(item);
  }

  return relics;
}

/**
 * Convert "skills" - this includes soul breaks, burst commands, brave
 * commands, synchro commands, and "other" skills.  Abilities are more
 * complicated due to orb costs, so they're processed separately.
 */
function convertSkills(rows: any[], notes?: NotesRowData[], requireId = true): any[] {
  const skills: any[] = [];

  const idColumn = rows[0].indexOf('ID');
  const tierColumn = rows[0].indexOf('Tier');

  for (let i = 1; i < rows.length; i++) {
    if (!rows[i].length || !rows[i][0]) {
      // Skip explanatory text at the bottom of the sheet.
      break;
    }

    const item: any = {};

    if (requireId && !rows[i][idColumn]) {
      logger.warn(`Skipping row ${i + 1}: Missing ID number`);
      logger.warn(rows[i].join(', '));
      continue;
    }
    if (tierColumn !== -1 && !rows[i][tierColumn]) {
      logger.warn(`Skipping row ${i + 1}: Missing tier`);
      logger.warn(rows[i].join(', '));
      continue;
    }

    for (let j = 0; j < rows[0].length; j++) {
      const col = rows[0][j];
      if (shouldAlwaysSkip(col)) {
        continue;
      }

      const field = _.camelCase(col);
      try {
        if (skillFields[col]) {
          item[field] = skillFields[col](rows[i][j]);
        } else {
          item[field] = toCommon(field, rows[i][j]);          
        }
      } catch (e) {
        logError(e, i, j, col, rows[i]);
        throw e;
      }

      checkSkillNotes(notes, field, i, j, item);
    }

    skills.push(item);
  }

  return skills;
}

const convertOtherSkills = (rows: any[], notes?: NotesRowData[]) =>
  convertSkills(rows, notes, false);

function convertStatus(rows: any[]): any[] {
  const status: any[] = [];

  const statusFields: { [field: string]: (value: string) => any } = {
    defaultDuration: dashNull(toInt),
    exclusiveStatus: dashNull(toCommaSeparatedArray(toString)),
    notes: dashNull(toString),
  };

  for (let i = 1; i < rows.length; i++) {
    const item: any = {};

    // Skip placeholder rows, notes, etc.
    if (!rows[i][0]) {
      continue;
    }

    for (let j = 0; j < rows[0].length; j++) {
      const col = rows[0][j];

      const field = _.camelCase(col);
      try {
        if (field === 'mndModifier') {
          if (rows[i][j]) {
            item['mndModifier'] = toFloat(rows[i][j].replace('± ', '').replace('%', ''));
            item['mndModifierIsOpposed'] = rows[i][j].startsWith('± ');
          } else {
            item['mndModifier'] = null;
            item['mndModifierIsOpposed'] = false;
          }
        } else if (field === 'commonName') {
          // Rename for consistency with other Enlir sheets
          item['name'] = rows[i][j];
        } else {
          const converter = statusFields[field] || toCommon.bind(undefined, field);
          item[field] = converter(rows[i][j]);
        }
      } catch (e) {
        logError(e, i, j, col, rows[i]);
        throw e;
      }
    }

    status.push(item);
  }
  return status;
}

interface NotesRowData {
  values?: Array<{
    note?: string;
  }>;
}

interface DataType {
  sheet: string;
  localName: string;
  includeNotes?: boolean;
  converter: (rows: any[], notes?: NotesRowData[]) => any[];
  postProcessor?: (data: any[], allData: { [localName: string]: any[] }) => void;
}

const dataTypes: DataType[] = [
  {
    sheet: 'Abilities',
    localName: 'abilities',
    includeNotes: true,
    converter: convertAbilities,
    postProcessor: postProcessAbilities,
  },
  {
    sheet: 'Brave',
    localName: 'brave',
    includeNotes: true,
    converter: convertSkills,
  },
  {
    sheet: 'Burst',
    localName: 'burst',
    includeNotes: true,
    converter: convertSkills,
  },
  {
    sheet: 'Characters',
    localName: 'characters',
    converter: convertCharacters,
    postProcessor: postProcessCharacters,
  },
  {
    sheet: 'Events',
    localName: 'events',
    converter: convertEvents,
  },
  {
    sheet: 'Guardian Summon Commands',
    localName: 'guardianCommands',
    converter: convertSkills,
  },
  {
    sheet: 'Legend Materia',
    localName: 'legendMateria',
    converter: convertLegendMateria,
  },
  {
    sheet: 'Limit Breaks',
    localName: 'limitBreaks',
    includeNotes: true,
    converter: convertSkills,
  },
  {
    sheet: 'Magicite',
    localName: 'magicite',
    converter: convertMagicite,
  },
  {
    sheet: 'Other',
    localName: 'otherSkills',
    includeNotes: true,
    converter: convertOtherSkills,
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
    sheet: 'Hero Artifacts',
    localName: 'heroArtifacts',
    converter: convertRelics,
  },
  {
    sheet: 'Synchro',
    localName: 'synchro',
    includeNotes: true,
    converter: convertAbilities,
  },
  {
    sheet: 'Soul Breaks',
    localName: 'soulBreaks',
    includeNotes: true,
    converter: convertSkills,
  },
  {
    sheet: 'Status',
    localName: 'status',
    converter: convertStatus,
  },
];

async function downloadEnlir(auth: OAuth2Client, spreadsheetId: string) {
  const sheets = google.sheets({ version: 'v4', auth });
  const jsonOptions = { spaces: 2 };

  for (const { sheet, localName, includeNotes } of dataTypes) {
    logger.info(`Downloading ${localName}...`);

    const valuesRes = await sheets.spreadsheets.values.get({
      spreadsheetId,
      range: sheet,
    });
    await fs.writeJson(path.join(workPath, localName + '.json'), valuesRes.data, jsonOptions);

    if (includeNotes) {
      // https://stackoverflow.com/a/53473537/25507
      const sheetRes = await sheets.spreadsheets.get({
        spreadsheetId,
        ranges: valuesRes.data.range,
        fields: 'sheets/data/rowData/values/note',
      });
      await fs.writeJson(
        path.join(workPath, localName + '.notes.json'),
        sheetRes.data,
        jsonOptions,
      );
    }
  }
}

async function convertEnlir(outputDirectory: string) {
  await fs.ensureDir(outputDirectory);

  const allData: { [name: string]: any[] } = {};
  for (const { localName, includeNotes, converter } of dataTypes) {
    logger.info(`Converting ${localName}...`);

    const rawData = await fs.readJson(path.join(workPath, localName + '.json'));

    let notes: any;
    if (includeNotes) {
      notes = await fs.readJson(path.join(workPath, localName + '.notes.json'));
      notes = notes.sheets[0].data[0].rowData;
    }
    // Filter out undatamined rows as these frequently contain unparsable data.
    const dataMinedCol = rawData.values[0].indexOf('✓');
    const globalCol = rawData.values[0].indexOf('GL');
    let filteredRows: any[] = [];
    let filteredNotes: any[] = [];
    if (dataMinedCol != -1 && globalCol != -1) {
      for (let i = 0; i < rawData.values.length; i++) {
        if(isDataMined(dataMinedCol, globalCol, rawData.values[i])) {
          filteredRows.push(rawData.values[i]);
          if (notes)
            filteredNotes.push(notes[i]);
        } 
      }      
      logger.info("Discarding " + (rawData.values.length - filteredRows.length) + " un-datamined rows.");
    } else {
      filteredRows = rawData.values;
      filteredNotes = notes;
    }
    allData[localName] = converter(filteredRows, filteredNotes);
    
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

async function main() {
  if (argv.download) {
    const enlirCredentials = await loadEnlirCredentials();
    if (!enlirCredentials) {
      return;
    }

    const auth = await authorize(enlirCredentials);
    await downloadEnlir(auth, enlirSpreadsheetIds[argv.sheet]);
  }
  await convertEnlir(argv.outputDirectory as string);
}

main().catch((e) => console.error(e));
