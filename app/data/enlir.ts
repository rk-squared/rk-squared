import * as _ from 'lodash';
import { logger } from '../utils/logger';

// TODO: Try removing duplicating in unions and arrays - see https://stackoverflow.com/a/45486495/25507

export type EnlirElement =
  | 'Fire'
  | 'Ice'
  | 'Lightning'
  | 'Earth'
  | 'Wind'
  | 'Water'
  | 'Holy'
  | 'Dark'
  | 'Poison'
  | 'NE';
export const allEnlirElements: EnlirElement[] = [
  'Fire',
  'Ice',
  'Lightning',
  'Earth',
  'Wind',
  'Water',
  'Holy',
  'Dark',
  'Poison',
  'NE',
];
export const isEnlirElement = (s: string): s is EnlirElement =>
  allEnlirElements.indexOf(s as EnlirElement) !== -1;

export type EnlirFormula = 'Physical' | 'Magical' | 'Hybrid' | '?';

export type EnlirSchool =
  | '?'
  | 'Bard'
  | 'Black Magic'
  | 'Celerity'
  | 'Combat'
  | 'Dancer'
  | 'Darkness'
  | 'Dragoon'
  | 'Heavy'
  | 'Knight'
  | 'Machinist'
  | 'Monk'
  | 'Ninja'
  | 'Samurai'
  | 'Sharpshooter'
  | 'Special'
  | 'Spellblade'
  | 'Summoning'
  | 'Support'
  | 'Thief'
  | 'White Magic'
  | 'Witch';
export const allEnlirSchools: EnlirSchool[] = [
  '?',
  'Bard',
  'Black Magic',
  'Celerity',
  'Combat',
  'Dancer',
  'Darkness',
  'Dragoon',
  'Heavy',
  'Knight',
  'Machinist',
  'Monk',
  'Ninja',
  'Samurai',
  'Sharpshooter',
  'Special',
  'Spellblade',
  'Summoning',
  'Support',
  'Thief',
  'White Magic',
  'Witch',
];
export const isEnlirSchool = (s: string): s is EnlirSchool =>
  allEnlirSchools.indexOf(s as EnlirSchool) !== -1;

export type EnlirSkillType = 'BLK' | 'NAT' | 'NIN' | 'PHY' | 'SUM' | 'WHT' | '?';

export type EnlirSoulBreakTier =
  | 'Default'
  | 'SB'
  | 'SSB'
  | 'BSB'
  | 'OSB'
  | 'USB'
  | 'CSB'
  | 'Glint'
  | 'AOSB'
  | 'AASB'
  | 'Glint+'
  | 'RW'
  | 'Shared';

// FIXME: Interfaces for remaining Enlir types

export interface EnlirGenericSkill {
  name: string;
  type: EnlirSkillType | null;
  target: string;
  formula: EnlirFormula | null;
  multiplier: number | null;
  element: EnlirElement[] | null;
  time: number | null;
  effects: string;
  counter: boolean;
  autoTarget: string;
  id: number;
  gl: boolean;
}

export interface EnlirAbility extends EnlirGenericSkill {
  rarity: number;
  sb: number;
  uses: number;
  max: number;
  orbs: { [orbName: string]: number[] };
  introducingEvent: string | string;
  nameJp: string;
}

export interface EnlirBraveCommand extends EnlirGenericSkill {
  character: string;
  source: string;
  brave: 0 | 1 | 2 | 3;
  school: EnlirSchool;
  sb: number;
  braveCondition: Array<EnlirElement | EnlirSchool>;
  nameJp: string;
}

export interface EnlirBurstCommand extends EnlirGenericSkill {
  character: string;
  source: string;
  sb: number;
  school: EnlirSchool;
  nameJp: string;
}

export interface EnlirOtherSkill extends EnlirGenericSkill {
  sourceType: string;
  source: string;
  sb: number;
  school: EnlirSchool;
}

export interface EnlirRecordMateria {
  realm: string;
  character: string;
  name: string;
  effect: string;
  unlockCriteria: string;
  nameJp: string;
  id: number;
  gl: boolean;
}

export interface EnlirSoulBreak extends EnlirGenericSkill {
  realm: string;
  character: string;
  points: number;
  tier: EnlirSoulBreakTier;
  master: string | null;
  relic: string;
  nameJp: string;
}

export interface EnlirStatus {
  id: number;
  name: string;
  effects: string;
  defaultDuration: number | null;
  mndModifier: number | null;
  mndModifierIsOpposed: boolean;
  exclusiveStatus: string[] | null;
  codedName: string;
  notes: string | null;
}

export type EnlirSkill =
  | EnlirAbility
  | EnlirBraveCommand
  | EnlirBurstCommand
  | EnlirOtherSkill
  | EnlirSoulBreak;

const rawData = {
  abilities: require('./enlir/abilities.json') as EnlirAbility[],
  braveCommands: require('./enlir/brave.json') as EnlirBraveCommand[],
  burstCommands: require('./enlir/burst.json') as EnlirBurstCommand[],
  characters: require('./enlir/characters.json'),
  magicite: require('./enlir/magicite.json'),
  otherSkills: require('./enlir/otherSkills.json') as EnlirOtherSkill[],
  recordMateria: require('./enlir/recordMateria.json') as EnlirRecordMateria[],
  relics: require('./enlir/relics.json'),
  soulBreaks: require('./enlir/soulBreaks.json') as EnlirSoulBreak[],
  status: require('./enlir/status.json') as EnlirStatus[],
};

// FIXME: Properly update rawData outside of app

interface Command extends EnlirGenericSkill {
  character: string;
  source: string;
}

interface CommandsMap<T> {
  [character: string]: {
    [soulBreak: string]: T[];
  };
}

function makeCommandsMap<T extends Command>(commands: T[]): CommandsMap<T> {
  const result: CommandsMap<T> = {};
  for (const i of commands) {
    result[i.character] = result[i.character] || {};
    result[i.character][i.source] = result[i.character][i.source] || [];
    result[i.character][i.source].push(i);
  }
  return result;
}

export const enlir = {
  abilities: _.keyBy(rawData.abilities, 'id'),
  abilitiesByName: _.keyBy(rawData.abilities, 'name'),
  braveCommands: makeCommandsMap(rawData.braveCommands),
  burstCommands: makeCommandsMap(rawData.burstCommands),
  characters: _.keyBy(rawData.characters, 'id'),
  charactersByName: _.keyBy(rawData.characters, 'name'),
  magicites: _.keyBy(rawData.magicite, 'id'),

  // NOTE: Other Skills' names are not unique, and they often lack IDs, so
  // expose the array.
  otherSkills: rawData.otherSkills,
  otherSkillsByName: _.keyBy(rawData.otherSkills, 'name'),

  relics: _.keyBy(rawData.relics, 'id'),
  recordMateria: _.keyBy(rawData.recordMateria, 'id'),
  soulBreaks: _.keyBy(rawData.soulBreaks, 'id'),
  statusByName: _.keyBy(rawData.status, 'name'),
};

function applyPatch<T>(
  lookup: { [s: string]: T },
  name: string,
  check: (item: T) => boolean,
  apply: (item: T) => void,
) {
  if (!lookup[name]) {
    logger.warn(`Failed to patch ${name}: could not find item`);
    return;
  }
  const item = lookup[name];
  if (!check(item)) {
    logger.warn(`Failed to patch ${name}: item does not match expected contents`);
    return;
  }
  apply(item);
}

/**
 * HACK: Patch Enlir data to make it easier for our text processing.
 */
function patchEnlir() {
  // Pluto Knight Triblade is a very difficult effect to parse.  By revising its
  // wording, we can let our slash-merge feature take care of it.
  applyPatch(
    enlir.statusByName,
    'Pluto Knight Triblade Follow-Up',
    pluto =>
      pluto.effects ===
      'Casts Pluto Knight Triblade and grants Minor Buff Fire, Minor Buff Lightning and Minor Buff Ice after exploiting elemental weakness',
    pluto => {
      pluto.effects =
        'Casts Pluto Knight Triblade and grants Minor Buff Fire/Lightning/Ice after exploiting elemental weakness';
    },
  );

  // A purely conditional attack - we may not even have an Enlir format for
  // this.  The format chosen by the spreadsheet is probably actually intended
  // for threshold attacks, but we'll make it work.
  applyPatch(
    enlir.otherSkillsByName,
    'Runic Awakening',
    runicAwakening =>
      runicAwakening.effects ===
      'Grants Magical Blink 2 to the user, five single attacks (0.52 each) if user has Magical Blink 1/2',
    runicAwakening => {
      runicAwakening.effects =
        'Five single attacks (0.52 each) if user has Magical Blink 1/2, grants Magical Blink 2 to the user';
    },
  );

  // These may be inconsistencies in the spreadsheet - Enlir normally instead
  // lists such things as "All enemies," with the stat mods first.
  // TODO: Verify these against JSON and, where possible, update spreadsheet to make them unnecessary
  applyPatch(
    enlir.soulBreaks,
    '23350002',
    waltz =>
      waltz.target === 'All allies' &&
      waltz.effects ===
        'Grants HP Stock (2000), ATK, DEF, MAG and RES -40% to all enemies for 25 seconds, grants Haste and Burst Mode to the user',
    waltz => {
      waltz.target = 'All enemies';
      waltz.effects =
        'ATK, DEF, MAG and RES -40% for 25 seconds, grants HP Stock (2000) to all allies, grants Haste and Burst Mode to the user';
    },
  );
  applyPatch(
    enlir.soulBreaks,
    '23330001',
    stasis =>
      stasis.target === 'All allies' &&
      stasis.effects ===
        'Grants Magical Blink 1 and Instant Cast 1, ATK, DEF, MAG and RES -70% to all enemies for 8 seconds',
    stasis => {
      stasis.target = 'All enemies';
      stasis.effects =
        'ATK, DEF, MAG and RES -70% for 8 seconds, grants Magical Blink 1 and Instant Cast 1 to all allies';
    },
  );
}
patchEnlir();

/**
 * Handle statuses for which the FFRK Community spreadsheet is inconsistent.
 *
 * NOTE: These are unconfirmed.  (If they were confirmed, we'd just update
 * the spreadsheet.)  Some may be intentional abbreviations.
 *
 * TODO: Try to clean up alternate status names.
 */
const enlirStatusAltName: { [status: string]: EnlirStatus } = {
  IC1: enlir.statusByName['Instant Cast 1'],
  'Critical 100%': enlir.statusByName['100% Critical'],
  'Cast Speed *999': enlir.statusByName['Instant Cast 1'],
};

/**
 * Retrieves an EnlirStatus by name, including support for generic numbers and
 * elements.
 */
export function getEnlirStatusByName(status: string): EnlirStatus | undefined {
  if (enlir.statusByName[status]) {
    return enlir.statusByName[status];
  }

  if (enlirStatusAltName[status]) {
    return enlirStatusAltName[status];
  }

  status = status.replace(/(\d+\??|\?)/, 'X');
  if (enlir.statusByName[status]) {
    return enlir.statusByName[status];
  }

  status = status.replace(/-X/, '+X');
  if (enlir.statusByName[status]) {
    return enlir.statusByName[status];
  }

  for (const i of allEnlirElements) {
    status = status.replace(i, '[Element]');
  }
  if (enlir.statusByName[status]) {
    return enlir.statusByName[status];
  }

  return undefined;
}

export function isSoulBreak(skill: EnlirSkill): skill is EnlirSoulBreak {
  return 'tier' in skill;
}

export function isGlint(skill: EnlirSkill): skill is EnlirSoulBreak {
  return 'tier' in skill && (skill.tier === 'Glint' || skill.tier === 'Glint+');
}

export function isBrave(skill: EnlirSkill): skill is EnlirSoulBreak {
  return 'tier' in skill && skill.tier === 'USB' && skill.effects.match(/Brave Mode/) != null;
}

export function isBurst(skill: EnlirSkill): skill is EnlirSoulBreak {
  return 'tier' in skill && skill.tier === 'BSB';
}

export function isBraveCommand(skill: EnlirSkill): skill is EnlirBraveCommand {
  return 'brave' in skill;
}
