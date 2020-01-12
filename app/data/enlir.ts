import * as _ from 'lodash';
import { logger } from '../utils/logger';
import { arrayify } from '../utils/typeUtils';

// TODO: Try removing duplicating in unions and arrays - see https://stackoverflow.com/a/45486495/25507

export const MAX_ABILITY_RARITY = 6;
export const MAX_ABILITY_RANK = 5;

function addSortOrder(items: any[]): any[] {
  for (let i = 0; i < items.length; i++) {
    items[i].sortOrder = i;
  }
  return items;
}

export type EnlirRealm =
  | 'Beyond'
  | 'Core'
  | 'FFT'
  | 'I'
  | 'II'
  | 'III'
  | 'IV'
  | 'IX'
  | 'KH'
  | 'Type-0'
  | 'V'
  | 'VI'
  | 'VII'
  | 'VIII'
  | 'X'
  | 'XI'
  | 'XII'
  | 'XIII'
  | 'XIV'
  | 'XV';

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

export type EnlirEventType =
  | '?'
  | 'Challenge Event'
  | 'Collection Event'
  | 'Crystal Tower'
  | 'Dungeons Update'
  | 'Endless Battle'
  | 'Festival'
  | 'Magicite Dungeon'
  | 'Mote Dungeon'
  | 'Nightmare Dungeon'
  | 'Record Dungeon'
  | 'Record Missions'
  | 'Survival Event'
  | 'Torment Dungeon';

// Note: Hybrid BLK/WHT or SUM/WHT skills may use Magical instead of Hybrid.
// See, e.g., Exdeath's Double Hole record board ability.
export type EnlirFormula = 'Physical' | 'Magical' | 'Hybrid' | '?';

export type EnlirRelicType =
  | 'Accessory'
  | 'Axe'
  | 'Blitzball'
  | 'Book'
  | 'Bow'
  | 'Bracer'
  | 'Dagger'
  | 'Doll'
  | 'Fist'
  | 'Gambling Gear'
  | 'Gun'
  | 'Gun-Arm'
  | 'Hairpin'
  | 'Hammer'
  | 'Hat'
  | 'Heavy Armor'
  | 'Helm'
  | 'Instrument'
  | 'Katana'
  | 'Keyblade'
  | 'Light Armor'
  | 'Robe'
  | 'Rod'
  | 'Shield'
  | 'Spear'
  | 'Staff'
  | 'Sword'
  | 'Thrown'
  | 'Whip';

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
  | 'SASB'
  | 'RW'
  | 'Shared';

// Note: Lowercase so that we can use it as an array for EnlirRelicStats.  This
// does, however, complicate interacting with user-visible text.
export type EnlirStat = 'atk' | 'def' | 'mag' | 'res' | 'mnd' | 'acc' | 'eva';
export const allEnlirStats: EnlirStat[] = ['atk', 'def', 'mag', 'res', 'mnd', 'acc', 'eva'];

export type EnlirTarget =
  | 'All allies'
  | 'All enemies'
  | 'Ally with status'
  | 'Another ally'
  | 'Lowest HP% ally'
  | 'Random ally'
  | 'Random enemies'
  | 'Random enemy'
  | 'Self'
  | 'Single ally'
  | 'Single enemy'
  | 'Single target'
  | 'Single';

interface EnlirRelicStats {
  rarity: number;
  level: number;
  atk: null | number;
  def: null | number;
  mag: null | number;
  res: null | number;
  mnd: null | number;
  acc: null | number;
  eva: null | number;
}

export interface EnlirGenericSkill {
  name: string;
  type: EnlirSkillType | null;
  typeDetails?: EnlirSkillType[];
  target: EnlirTarget | null;
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

export interface EnlirSoulBreakOrLegendMateria {
  id: number;
  anima: number | null;
  gl: boolean;
}

export interface EnlirAbility extends EnlirGenericSkill {
  school: EnlirSchool;
  rarity: number;
  sb: number;
  uses: number;
  max: number;
  orbs: { [orbName: string]: number[] };
  introducingEvent: string | string;
  nameJp: string;
  recordBoardCharacter?: string;
}

export interface EnlirBraveCommand extends EnlirGenericSkill {
  character: string;
  source: string;
  brave: 0 | 1 | 2 | 3;
  school: EnlirSchool;
  schoolDetails?: EnlirSchool[];
  sb: number;
  braveCondition: Array<EnlirElement | EnlirSchool>;
  nameJp: string;
}

export interface EnlirBurstCommand extends EnlirGenericSkill {
  character: string;
  source: string;
  sb: number;
  school: EnlirSchool;
  schoolDetails?: EnlirSchool[];
  nameJp: string;
}

export interface EnlirCharacter {
  realm: EnlirRealm;
  name: string;
  introducingEventLv50: string;
  lv50: { [key: string]: number };
  introducingEventLv65: string;
  lv65: { [key: string]: number };
  introducingEventLv80: string;
  lv80: { [key: string]: number };
  introducingEventLv99: string;
  lv99: { [key: string]: number };
  introducingEventRecordSpheres: string;
  recordSpheres: { [key: string]: number };
  introducingEventLegendSpheres: string;
  legendSpheres: { [key: string]: number };
  equipment: { [key: string]: boolean };
  skills: { [key: string]: number };
  id: number;
  gl: boolean;
}

export interface EnlirEvent {
  eventName: string;
  realm: EnlirRealm | null;
  glDate: string | null; // ISO-style YYYY-MM-DD string
  jpDate: string | null; // ISO-style YYYY-MM-DD string
  type: EnlirEventType;
  heroRecords: string[] | null;
  memoryCrystals1: string[] | null;
  memoryCrystals2: string[] | null;
  memoryCrystals3: string[] | null;
  wardrobeRecords: string[] | null;
  abilitiesAwarded: string[] | null;
}

export interface EnlirLegendMateria {
  realm: EnlirRealm;
  character: string;
  name: string;
  effect: string;
  master: string | null;
  relic: string | null;
  nameJp: string;
  id: number;
  anima: number | null;
  gl: boolean;
}

export interface EnlirOtherSkill extends EnlirGenericSkill {
  sourceType: string;
  source: string;
  sb: number;
  school: EnlirSchool;
  schoolDetails?: EnlirSchool[];
}

export interface EnlirRecordMateria {
  realm: EnlirRealm;
  character: string;
  name: string;
  effect: string;
  unlockCriteria: string;
  nameJp: string;
  id: number;
  gl: boolean;
}

export interface EnlirRelic {
  name: string;
  realm: EnlirRealm | null;
  type: EnlirRelicType;
  rarity: number;
  stats: EnlirRelicStats;
  effect: null | string;
  character: null | string;
  soulBreak: null | string;
  legendMateria: null | string;
  baseStats: EnlirRelicStats;
  maxStats: EnlirRelicStats;
  id: number;
  gl: boolean;
}

export interface EnlirSoulBreak extends EnlirGenericSkill {
  realm: EnlirRealm | null;
  character: string | null;
  points: number;
  tier: EnlirSoulBreakTier;
  soulbreakBonus: string | null; // Formerly 'master'
  relic: string | null;
  nameJp: string;
  anima: number | null;

  // Added to the spreadsheet to accommodate Balthier's USB1 and USB2, which
  // aren't in ID order.
  sortOrder: number;
}

export interface EnlirStatus {
  id: number;
  name: string;
  effects: string; // May be the empty string; to simplify code, we use '' instead of null
  defaultDuration: number | null;
  mndModifier: number | null;
  mndModifierIsOpposed: boolean;
  exclusiveStatus: string[] | null;
  codedName: string | null;
  notes: string | null;
}

export interface EnlirSynchroCommand extends EnlirGenericSkill {
  character: string;
  source: string;
  synchroAbilitySlot: 1 | 2;
  synchroCondition: EnlirElement | EnlirSchool;
  sb: number | null;
  school: EnlirSchool;
  nameJp: string;
  synchroConditionId: number;
}

export type EnlirSkill =
  | EnlirAbility
  | EnlirBraveCommand
  | EnlirBurstCommand
  | EnlirOtherSkill
  | EnlirSynchroCommand
  | EnlirSoulBreak;

export enum SbOrLm {
  SoulBreak,
  LegendMateria,
}

export const tierOrder: { [t in EnlirSoulBreakTier]: number } = {
  Default: 0,
  SB: 1,
  SSB: 2,
  BSB: 3,
  Glint: 4,
  'Glint+': 5,
  OSB: 6,
  AOSB: 7,
  USB: 8,
  AASB: 9,
  SASB: 10,
  CSB: 11,
  RW: 100,
  Shared: 101,
};

const rawData = {
  abilities: require('./enlir/abilities.json') as EnlirAbility[],
  braveCommands: require('./enlir/brave.json') as EnlirBraveCommand[],
  burstCommands: require('./enlir/burst.json') as EnlirBurstCommand[],
  characters: require('./enlir/characters.json') as EnlirCharacter[],
  events: require('./enlir/events.json') as EnlirEvent[],
  legendMateria: require('./enlir/legendMateria.json') as EnlirLegendMateria[],
  magicite: require('./enlir/magicite.json'),
  otherSkills: require('./enlir/otherSkills.json') as EnlirOtherSkill[],
  recordMateria: require('./enlir/recordMateria.json') as EnlirRecordMateria[],
  relics: require('./enlir/relics.json') as EnlirRelic[],
  soulBreaks: addSortOrder(require('./enlir/soulBreaks.json')) as EnlirSoulBreak[],
  status: require('./enlir/status.json') as EnlirStatus[],
  synchroCommands: require('./enlir/synchro.json') as EnlirSynchroCommand[],
};

// FIXME: Properly update rawData outside of app

interface IdMultimap<T> {
  [id: string]: T[];
}

interface CharacterMap<T> {
  [character: string]: T[];
}

interface Command extends EnlirGenericSkill {
  character: string;
  source: string;
}

interface CommandsMap<T> {
  [character: string]: {
    [soulBreak: string]: T[];
  };
}

/**
 * As _.keyBy(items, 'id'), but store arrays, to handle non-unique IDs.  Enlir
 * data may use non-unique IDs for effects like Ignis BSB and Rikku SASB.
 */
function makeIdMultimap<T extends { id: number }>(items: T[]): IdMultimap<T> {
  const result: IdMultimap<T> = {};
  for (const i of items) {
    result[i.id] = result[i.id] || [];
    result[i.id].push(i);
  }
  return result;
}

function makeCharacterMap<T extends { character: string | null }>(
  items: T[],
  sortOrder: _.Many<_.ListIteratee<T>>,
): CharacterMap<T> {
  const result: CharacterMap<T> = {};

  for (const i of items) {
    if (!i.character) {
      continue;
    }
    result[i.character] = result[i.character] || [];
    result[i.character].push(i);
  }

  return _.mapValues(result, i => _.sortBy(i, sortOrder));
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

/**
 * Maps from relic IDs (equipment IDs) to soul breaks or legend materia.
 */
function makeRelicMap<T extends { character: string | null; name: string; relic: string | null }>(
  relics: EnlirRelic[],
  prop: keyof EnlirRelic,
  items: T[],
): { [relicId: number]: T } {
  const result: { [relicId: number]: T } = {};
  const indexedItems = _.keyBy(items, i => (i.character || '-') + ':' + i.name);
  for (const i of relics) {
    if (i[prop]) {
      const found = indexedItems[(i.character || '-') + ':' + i[prop]];
      if (found) {
        result[i.id] = found;
        // TODO: Enable validation - but there are too many problems right now
        /*
        if (
          found.relic &&
          found.relic.replace(/ \([^()]+\)$/, '') !== i.name &&
          found.relic.replace(/ \(.*\)$/, '') !== i.name
        ) {
          logger.warn(
            `Name mismatch: relic lists name as ${i.name}, ` +
              `${prop} ${found.name} lists name as ${found.relic}`,
          );
        }
        */
      } else {
        logger.warn(`Failed to find ${prop} for ${i.character} - ${i.name} - ${i[prop]}`);
      }
    }
  }
  return result;
}

export interface SharedSoulBreak {
  relic: EnlirRelic;
  soulBreak: EnlirSoulBreak;
}

function getSharedSoulBreaks(
  relics: EnlirRelic[],
  soulBreaks: EnlirSoulBreak[],
): SharedSoulBreak[] {
  const soulBreaksByName = _.keyBy(soulBreaks.filter(i => i.character == null), 'name');
  return relics
    .filter(i => i.soulBreak != null && soulBreaksByName[i.soulBreak] != null)
    .map(i => ({ relic: i, soulBreak: soulBreaksByName[i.soulBreak!] }));
}

const otherSkillSourceKey = (source: string, name: string) => source + '_' + name;

export const enlir = {
  abilities: _.keyBy(rawData.abilities, 'id'),
  abilitiesByName: _.keyBy(rawData.abilities, 'name'),

  braveCommands: makeIdMultimap(rawData.braveCommands),
  braveCommandsByCharacter: makeCommandsMap(rawData.braveCommands),

  burstCommands: makeIdMultimap(rawData.burstCommands),
  burstCommandsByCharacter: makeCommandsMap(rawData.burstCommands),

  characters: _.keyBy(rawData.characters, 'id'),
  charactersByName: _.keyBy(rawData.characters, 'name'),

  events: _.keyBy(rawData.events, 'eventName'),

  legendMateria: _.keyBy(rawData.legendMateria, 'id'),
  legendMateriaByCharacter: makeCharacterMap(rawData.legendMateria, [
    (i: EnlirLegendMateria) => i.relic != null,
    (i: EnlirLegendMateria) => i.id,
  ]),

  magicites: _.keyBy(rawData.magicite, 'id'),

  // NOTE: Other Skills' names are not unique, and they often lack IDs, so
  // expose the raw array.
  otherSkills: rawData.otherSkills,
  otherSkillsByName: _.keyBy(rawData.otherSkills, 'name'),
  otherSkillsBySource: _.keyBy(rawData.otherSkills, i => otherSkillSourceKey(i.source, i.name)),

  relics: _.keyBy(rawData.relics, 'id'),
  relicsByNameWithRealm: _.keyBy(rawData.relics, i => i.name + ' (' + i.realm + ')'),

  recordMateria: _.keyBy(rawData.recordMateria, 'id'),

  soulBreaks: _.keyBy(rawData.soulBreaks, 'id'),
  soulBreaksByCharacter: makeCharacterMap(rawData.soulBreaks, [
    (i: EnlirSoulBreak) => tierOrder[i.tier],
    (i: EnlirSoulBreak) => i.sortOrder,
  ]),

  statusByName: _.keyBy(rawData.status, 'name'),

  synchroCommands: makeIdMultimap(rawData.synchroCommands),
  synchroCommandsByCharacter: makeCommandsMap(rawData.synchroCommands),

  relicSoulBreaks: makeRelicMap(rawData.relics, 'soulBreak', rawData.soulBreaks),
  relicLegendMateria: makeRelicMap(rawData.relics, 'legendMateria', rawData.legendMateria),
  sharedSoulBreaks: getSharedSoulBreaks(rawData.relics, rawData.soulBreaks),
};

function applyPatch<T>(
  lookup: { [s: string]: T | T[] },
  name: string,
  check: (item: T) => boolean,
  apply: (item: T) => void,
) {
  if (!lookup[name]) {
    logger.warn(`Failed to patch ${name}: could not find item`);
    return;
  }
  for (const item of arrayify(lookup[name])) {
    if (!check(item)) {
      logger.warn(`Failed to patch ${name}: item does not match expected contents`);
    } else {
      apply(item);
    }
  }
}

/**
 * HACK: Patch Enlir data to make it easier for our text processing.
 */
function patchEnlir() {
  // Two different follow-up attacks for Gladiolus's AASB is hard.  For now,
  // we'll try rewording it to resemble Squall's.
  // TODO: It's possible that Squall's and Gladiolus's are the same internally and that these should be made consistent
  applyPatch(
    enlir.statusByName,
    'Break Arts Mode',
    mode =>
      mode.effects ===
      'Casts Heavy Strike / Heavy Strike+ / Heavy Strike++ and Orbital Edge after using three Earth attacks if 0/72001/240001 damage was dealt during the status, removed after triggering',
    mode => {
      mode.effects = 'Casts Heavy Strike after using three Earth attacks, removed after triggering';
    },
  );
  applyPatch(
    enlir.otherSkillsByName,
    'Heavy Strike',
    strike =>
      strike.effects === 'Three single attacks (0.52 each), 100% hit rate' &&
      enlir.otherSkillsByName['Heavy Strike+'].effects ===
        'Five single attacks (0.52 each), 100% hit rate' &&
      enlir.otherSkillsByName['Heavy Strike++'].effects ===
        'Five single attacks (0.52 each), 100% hit rate' &&
      enlir.otherSkillsByName['Orbital Edge'].effects ===
        'Ten single attacks (0.50 each) and one single attack (5.00) capped at 99999, 100% hit rate',
    strike => {
      strike.effects =
        '3/5/5 single attacks (0.52 each) if 0/72001/240001 damage was dealt during the status. ' +
        'Additional ten single attacks (0.50 each), followed by one single attack (5.00) capped at 99999 if 240001 damage was dealt during the status';
    },
  );
  applyPatch(
    enlir.otherSkillsByName,
    'Orbital Edge',
    edge =>
      edge.effects ===
      'Ten single attacks (0.50 each) and one single attack (5.00) capped at 99999, 100% hit rate',
    edge => {
      edge.effects =
        'Ten single attacks (0.50 each), followed by one single attack (5.00) capped at 99999, 100% hit rate';
    },
  );

  // Multi-character soul breaks like Sarah's USB3 and Xezat's AASB are pure
  // madness.  I have no shame in whatever hacks it takes to process them.
  applyPatch(
    enlir.soulBreaks,
    '22300009',
    aria =>
      aria.effects ===
      'Restores HP (85), grants Regenga, grants Quick Cast to the user, ' +
        'grants Minor Buff Holy/Dark if Warrior of Light/Garland is in the party, ' +
        'grants Medium Buff Holy/Dark if both are in the party',
    aria => {
      aria.effects =
        'Restores HP (85), grants Regenga, grants Quick Cast to the user, ' +
        'grants Minor Buff Holy if Warrior of Light is in the party, ' +
        'grants Minor Buff Dark if Garland is in the party, ' +
        'grants Medium Buff Holy/Dark if Warrior of Light & Garland are in the party';
    },
  );
  applyPatch(
    enlir.soulBreaks,
    '22300011',
    song =>
      song.effects ===
      'Restores HP (105), removes KO (100% HP), grants Last Stand, Haste, High Quick Cast 2, ' +
        'grants Minor Buff Holy/Dark and HP Stock (2000) if Warrior of Light/Garland is in the party, ' +
        'grants Medium Buff Holy/Dark and HP Stock (2000) if both are in the party, ' +
        'grants Awoken Princess Cornelia to the user',
    song => {
      song.effects =
        'Restores HP (105), removes KO (100% HP), grants Last Stand, Haste, High Quick Cast 2, ' +
        'grants Minor Buff Holy/Dark and HP Stock (2000) if Warrior of Light/Garland is in the party, ' +
        'grants Medium Buff Holy/Dark and HP Stock (2000) if Warrior of Light & Garland are in the party, ' +
        'grants Awoken Princess Cornelia to the user';
    },
  );
  applyPatch(
    enlir.soulBreaks,
    '23160005',
    strike =>
      strike.effects ===
      'Fifteen single attacks (0.60 each), grants Major Buff Ice, Major Buff Earth, Major Buff Lightning, Awoken Spellblade, Damage Cap +10000 to the user, grants 50% Critical to all allies, grants High Quick Cast 1/High Quick Cast 2/Extended 100% Critical, Critical Damage +50% and High Quick Cast 2 if 1/2/3 of Kelger, Galuf or Dorgann are alive to all allies',
    strike => {
      strike.effects =
        'Fifteen single attacks (0.60 each), grants Major Buff Ice, Major Buff Earth, Major Buff Lightning, Awoken Spellblade, Damage Cap +10000 to the user, grants 50% Critical to all allies, grants High Quick Cast 1/2/2 to all allies if 1/2/3 of Kelger/Galuf/Dorgann are alive, grants Extended 100% Critical and Critical Damage +50% to all allies if Kelger & Galuf & Dorgann are alive';
    },
  );
  applyPatch(
    enlir.soulBreaks,
    '23070005',
    marcus =>
      marcus.effects ===
      'Fifteen single attacks (0.60 each), grants Awoken Tantalus, Damage Cap +10000 and Twin Element Mode (Wind/Poison) to the user, ' +
        'causes Minor Imperil Wind and Minor Imperil Poison/Medium Imperil Wind and Medium Imperil Poison if 1/2+ IX characters are alive, ' +
        'grants Instant Cast 1/grants Instant Cast 1 and Weakness +30% Boost to all allies if 3/4+ IX characters are alive',
    marcus => {
      marcus.effects =
        'Fifteen single attacks (0.60 each), grants Awoken Tantalus, Damage Cap +10000 and Twin Element Mode (Wind/Poison) to the user, ' +
        'causes Minor Imperil Wind/Poison if 1 IX character is alive, causes Medium Imperil Wind/Poison if 2+ IX characters are alive, ' +
        'grants Instant Cast 1 to all allies if 3+ IX characters are alive, grants Weakness +30% Boost to all allies if 4+ IX characters are alive';
    },
  );

  // Abbreviations - I don't know if it's best to update Enlir to remove these
  // or not.  Where possible, we update our code to handle abbreviations, but
  // some are too hard.  If we had an actual parser, it would help.
  // Wol - Howl of Hell
  applyPatch(
    enlir.burstCommands,
    '30512822',
    heavyBreak =>
      heavyBreak.effects ===
      'Four single attacks (0.58 each), ATK and MAG -20/30/50% for 15 seconds at Heavy Charge 0/1/2, Heavy Charge =0 to the user',
    heavyBreak => {
      // Insert 'causes' - it's too big to fit on one line, but too much of our
      // processing keys off of it.
      heavyBreak.effects =
        'Four single attacks (0.58 each), ATK and MAG -20/30/50% for 15 seconds at Heavy Charge 0/1/2, causes Heavy Charge =0 to the user';
    },
  );
  // Seifer - Sorceress's Knight
  applyPatch(
    enlir.burstCommands,
    '30510911',
    desperateMadness =>
      desperateMadness.effects ===
      'Four single attacks (0.56 each), Desperate Madness and Radiant Shield 100/125/150/175/200/225/250/275/300% to the user',
    desperateMadness => {
      desperateMadness.effects =
        'Four single attacks (0.56 each), grants Desperate Madness and Radiant Shield: 100/125/150/175/200/225/250/275/300% to the user scaling with uses';
    },
  );

  // Status cleanups.  These too should be fixed up.
  applyPatch(
    enlir.statusByName,
    'Windborn Swiftness Mode',
    mode => mode.effects === 'Grants Windborn Swiftness 0/1/2/3 after using a Monk ability',
    mode => {
      // Adequately covered by Windborn Swiftness 0/1/2/3
      mode.effects = '';
    },
  );
  for (let i = 0; i <= 3; i++) {
    applyPatch(
      enlir.statusByName,
      `Windborn Swiftness ${i}`,
      mode => mode.effects.match(/[Gg]rants Windborn Swiftness (\d+),/) != null,
      mode => {
        mode.effects = mode.effects.replace(
          /([Gg]rants) Windborn Swiftness (\d+),/,
          (match, p1, p2) => `${p1} Windborn Swiftness ${p2} after using a Monk ability,`,
        );
      },
    );
  }
  applyPatch(
    enlir.statusByName,
    'Awoken Guardian',
    mode =>
      mode.effects ===
      "White Magic abilities don't consume uses and single target heals grant Stoneskin: 30/40/50/60/70% to target at ability rank 1/2/3/4/5, dualcasts White Magic abilities",
    mode => {
      mode.effects =
        "White Magic abilities don't consume uses, grants Stoneskin: 30/40/50/60/70% at rank 1/2/3/4/5 of the triggering ability to the target after using a single-target heal, dualcasts White Magic abilities";
    },
  );
  applyPatch(
    enlir.statusByName,
    'Drain Blade Follow-Up',
    mode =>
      mode.effects ===
      "Casts Drain Blade 1/2/3 after using two Dark abilities if the user's current HP percentage is greater than or equal to 100/80/79",
    mode => {
      // Showing 0% is inconsistent with other abilities, but it's a bit clearer.
      mode.effects =
        "Casts Drain Blade 1/2/3 after using two Dark abilities if the user's HP are below 100/80/0%";
    },
  );

  // Legend materia.  These, too, should be upstreamed if possible.
  applyPatch(
    enlir.legendMateria,
    '201070504',
    legendMateria =>
      legendMateria.effect ===
      'Grants Quick Cast, grants Lingering Spirit for 25 seconds when HP fall below 20%',
    legendMateria => {
      legendMateria.effect =
        'Grants Quick Cast and Lingering Spirit for 25 seconds when HP fall below 20%';
    },
  );

  // Paine's AASB. It seems odd for a status to directly grant a status.
  applyPatch(
    enlir.statusByName,
    'Respect Counter Mode',
    mode => mode.effects === 'Cast speed x2.00, grants Respect Counter Critical',
    mode => {
      mode.effects = 'Cast speed x2.00';
    },
  );
  applyPatch(
    enlir.soulBreaks,
    '22420008',
    combo =>
      combo.effects ===
      'Fifteen single attacks (0.60 each), grants Attach Water, Awoken Water, ' +
        'Damage Cap +10000 and Respect Counter Mode to the user',
    combo => {
      combo.effects =
        'Fifteen single attacks (0.60 each), grants Attach Water, Awoken Water, ' +
        'Damage Cap +10000, Respect Counter Mode, and Respect Counter Critical to the user';
    },
  );

  // Tyro AASB.  This is a mess in Enlir; how should it be explained?
  applyPatch(
    enlir.soulBreaks,
    '20140018',
    tyroAasb =>
      tyroAasb.effects ===
      'Grants 50% Critical and Haste, ATK and DEF +30% for 25 seconds, grants Awoken Keeper Mode and Unraveled History Follow-Up to the user',
    tyroAasb => {
      tyroAasb.effects =
        'Grants 50% Critical and Haste, ATK and DEF +30% for 25 seconds, grants Awoken Keeper Mode, Awoken Keeper Mode Critical Chance and Unraveled History Follow-Up to the user';
    },
  );
  applyPatch(
    enlir.statusByName,
    'Awoken Keeper Mode',
    scholar =>
      scholar.effects ===
      "Support abilities don't consume uses, cast speed x2.00/2.25/2.50/2.75/3.00 for Support abilities at ability rank 1/2/3/4/5, grants Awoken Keeper Mode Critical Chance to all allies",
    scholar => {
      scholar.effects =
        "Support abilities don't consume uses, cast speed x2.00/2.25/2.50/2.75/3.00 for Support abilities at ability rank 1/2/3/4/5";
    },
  );

  // Missing / inconsistent data within Enlir - but don't update until we can
  // confirm.
  applyPatch(
    enlir.burstCommands,
    '30511811',
    guyBurstCommand =>
      guyBurstCommand.effects ===
      "Four single attacks (0.14 each), multiplier increases with user's ATK",
    guyBurstCommand => {
      guyBurstCommand.effects = 'Four single attacks (0.14~0.65 each scaling with ATK)';
    },
  );

  // Make the Odin 4* ability resemble a more standard status ailment.
  applyPatch(
    enlir.abilitiesByName,
    'Odin',
    ability =>
      ability.effects ===
      'If not resisted, causes Instant KO (100%), otherwise, two group attacks (6.00 each), Different DEF and RES -20% for 25 seconds',
    ability =>
      (ability.effects =
        'Two group attacks (6.00 each), causes Instant KO (100%) and Different DEF and RES -20% for 25 seconds'),
  );
  // Make Steal Time match a more common word order.
  applyPatch(
    enlir.abilitiesByName,
    'Steal Time',
    ability => ability.effects === 'Causes Slow (50%), if successful grants Haste to the user',
    ability => (ability.effects = 'Causes Slow (50%), grants Haste to the user if successful'),
  );

  // Patch Bahamut (VI) to have an orb cost for rank 1.
  const bahamutOrbs = ['Major Summon', 'Major Non-Elemental', 'Major Dark'];
  applyPatch(
    enlir.abilitiesByName,
    'Bahamut (VI)',
    ability => _.every(bahamutOrbs, i => ability.orbs[i] && ability.orbs[i][0] === 0),
    ability => {
      const bahamutV = enlir.abilitiesByName['Bahamut (V)'];
      for (const orb of bahamutOrbs) {
        ability.orbs[orb][0] = bahamutV.orbs[orb][0];
      }
    },
  );

  // Some Synchro skills are weird and hard to parse:
  // Dk.Cecil's SASB chase is apparently trying to say that it's -1 Gehenna
  // only if it's at Gehenna levels 1 and 2, but it's simpler to avoid that.
  applyPatch(
    enlir.otherSkillsByName,
    'Shadow Chaser',
    ability =>
      ability.effects ===
      'One single attack (4.00~7.00 scaling with current HP%) capped at 99999, ' +
        'heals the user for 20% of the damage dealt at Gehenna levels 1 and 2 ' +
        'and causes -1 Gehenna to the user, 100% hit rate',
    ability => {
      ability.effects =
        'One single attack (4.00~7.00 scaling with current HP%) capped at 99999, ' +
        'heals the user for 20% of the damage dealt at Gehenna levels 1 and 2,' +
        'causes -1 Gehenna to the user, 100% hit rate';
    },
  );
  // Shadow's command is very unique and flavorful, but it becomes much simpler
  // if we omit the special effects at 0 blinks; those have little in-game
  // effect.
  applyPatch(
    enlir.synchroCommands,
    '30549323',
    ability =>
      ability.effects ===
      '1 ranged or 4/8 single attacks (0.80 each) and grants Physical Blink 1/1/0 if the user has Physical Blink 0/1/2, 100% hit rate at Physical Blink 0',
    ability => {
      ability.effects =
        '1/4/8 single attacks (0.80 each) if the user has Physical Blink 0/1/2, grants Physical Blink 1 to the user';
    },
  );
}
patchEnlir();

export function describeRelicStats(relic: EnlirRelic): string {
  return _.filter(
    allEnlirStats.map(i => (relic.stats[i] ? `${i.toUpperCase()} ${relic.stats[i]}` : '')),
  ).join(', ');
}

export function isCoreJob(character: EnlirCharacter): boolean {
  return (
    character.realm === 'Core' &&
    character.name !== 'Tyro' &&
    character.id < enlir.charactersByName['Elarra'].id
  );
}

/**
 * Handle statuses for which the FFRK Community spreadsheet is inconsistent.
 *
 * NOTE: These are unconfirmed.  (If they were confirmed, we'd just update
 * the spreadsheet.)  Some may be intentional abbreviations.
 *
 * TODO: Try to clean up alternate status names.
 */
export const enlirStatusAltName: { [status: string]: EnlirStatus } = {
  'B. M.': enlir.statusByName['Burst Mode'],
  IC1: enlir.statusByName['Instant Cast 1'],
  'Critical 100%': enlir.statusByName['100% Critical'],
};

export interface EnlirStatusPlaceholders {
  xValue?: number;
  xValueIsUncertain?: boolean;
  element?: EnlirElement;
  school?: EnlirSchool;
  stat?: EnlirStat;
}

export interface EnlirStatusWithPlaceholders {
  status: EnlirStatus;
  placeholders: EnlirStatusPlaceholders;
}

/**
 * Retrieves an EnlirStatus by name, including support for generic numbers and
 * elements.
 */
export function getEnlirStatusWithPlaceholders(
  status: string,
): EnlirStatusWithPlaceholders | undefined {
  const placeholders: EnlirStatusPlaceholders = {};
  if (enlir.statusByName[status]) {
    return { status: enlir.statusByName[status], placeholders };
  }

  if (enlirStatusAltName[status]) {
    return { status: enlirStatusAltName[status], placeholders };
  }

  const checkNumbers: Array<[RegExp, string]> = [[/(-\d+)/, '+X'], [/(\d+\??|\?)/, 'X']];
  for (const [search, replace] of checkNumbers) {
    const m = status.match(search);
    if (m) {
      const newStatus = status.replace(search, replace);
      if (newStatus !== status) {
        status = newStatus;
        if (m[0] === '?') {
          placeholders.xValue = NaN;
        } else {
          placeholders.xValue = +m[0].replace('?', '');
          placeholders.xValueIsUncertain = m[0].endsWith('?');
        }
        if (enlir.statusByName[newStatus]) {
          return { status: enlir.statusByName[newStatus], placeholders };
        }
      }
    }
  }

  for (const i of allEnlirElements) {
    const newStatus = status.replace(i, '[Element]');
    if (newStatus !== status) {
      placeholders.element = i;
      status = newStatus;
    }
  }
  if (enlir.statusByName[status]) {
    return { status: enlir.statusByName[status], placeholders };
  }

  for (const i of allEnlirStats) {
    const newStatus = status.replace(i.toUpperCase(), '[Stats]');
    if (newStatus !== status) {
      placeholders.stat = i;
      status = newStatus;
    }
  }
  if (enlir.statusByName[status]) {
    return { status: enlir.statusByName[status], placeholders };
  }

  return undefined;
}

/**
 * Retrieves an EnlirStatus by name, including support for generic numbers and
 * elements.
 */
export function getEnlirStatusByName(status: string): EnlirStatus | undefined {
  const result = getEnlirStatusWithPlaceholders(status);
  return result ? result.status : undefined;
}

/**
 * Gets an EnlirOtherSkill.  Other skills don't have unique names, so this
 * takes an optional source parameter to help disambiguate it.
 */
export function getEnlirOtherSkill(otherSkillName: string, sourceName?: string): EnlirOtherSkill {
  if (sourceName) {
    const key = otherSkillSourceKey(sourceName, otherSkillName);
    if (enlir.otherSkillsBySource[key]) {
      return enlir.otherSkillsBySource[key];
    }
    // This lookup may fail for, e.g., Refia's glint's follow-up, which lists
    // its source as "Explosive Rush Mode 1/2/3" in the spreadsheet.  To
    // accommodate, allow falling back to looking up by name.
  }
  return enlir.otherSkillsByName[otherSkillName];
}

export function isAbility(skill: EnlirSkill): skill is EnlirAbility {
  return 'rarity' in skill;
}

export function isSoulBreak(skill: EnlirSkill): skill is EnlirSoulBreak {
  return 'tier' in skill;
}

export function isGlint(sb: EnlirSoulBreak): boolean {
  return sb.tier === 'Glint' || sb.tier === 'Glint+';
}

export function isBraveSoulBreak(sb: EnlirSoulBreak): boolean {
  return sb.tier === 'USB' && sb.effects.match(/Brave Mode/) != null;
}

export function isBurstSoulBreak(sb: EnlirSoulBreak): boolean {
  return sb.tier === 'BSB';
}

export function isSynchroSoulBreak(sb: EnlirSoulBreak): boolean {
  return sb.tier === 'SASB';
}

export function isBurstCommand(skill: EnlirSkill): skill is EnlirBurstCommand {
  return (
    'character' in skill && 'source' in skill && !isBraveCommand(skill) && !isSynchroCommand(skill)
  );
}

export function isBraveCommand(skill: EnlirSkill): skill is EnlirBraveCommand {
  return 'brave' in skill;
}

export function isSynchroCommand(skill: EnlirSkill): skill is EnlirBraveCommand {
  return 'synchroAbilitySlot' in skill;
}

export function isSharedSoulBreak(sb: EnlirSoulBreak): boolean {
  return sb.character == null;
}

export function makeSoulBreakAliases(
  soulBreaks: _.Dictionary<EnlirSoulBreak>,
  tierAlias?: { [s in EnlirSoulBreakTier]: string },
): { [id: number]: string } {
  const total: { [key: string]: number } = {};
  const seen: { [key: string]: number } = {};
  const makeKey = ({ character, tier }: EnlirSoulBreak) => character + '-' + tier;
  const tierText = tierAlias
    ? (tier: EnlirSoulBreakTier) => tierAlias[tier]
    : (tier: EnlirSoulBreakTier) => tier as string;
  _.forEach(soulBreaks, sb => {
    const key = makeKey(sb);
    total[key] = total[key] || 0;
    total[key]++;
  });

  const result: { [id: number]: string } = {};
  _.sortBy(soulBreaks, 'sortOrder').forEach(sb => {
    const key = makeKey(sb);
    seen[key] = seen[key] || 0;
    seen[key]++;

    let alias = tierText(sb.tier);
    if (isBraveSoulBreak(sb)) {
      alias = 'B' + alias;
    } else if (total[key] > 1 && sb.tier !== 'SB' && sb.tier !== 'RW' && sb.tier !== 'Shared') {
      // Skip numbers for unique SB tier - those are too old to be of interest.
      alias += seen[key];
    }
    result[sb.id] = alias;
  });

  // Special-case a few soul breaks.
  // Bartz - seemed like a good idea, but they're too big...
  /*
  result[20400009] = tierText('BSB') + '-wa';
  result[20400011] = tierText('BSB') + '-e';
  result[20400012] = tierText('BSB') + '-wi';
  result[20400013] = tierText('BSB') + '-f';
  */
  // Onion Knight
  result[22460006] = 'm-' + tierText('USB');
  result[22460007] = 'p-' + tierText('USB');

  return result;
}

export function makeLegendMateriaAliases(
  legendMateria: _.Dictionary<EnlirLegendMateria>,
): { [id: number]: string } {
  const total: { [key: string]: number } = {};
  const seen: { [key: string]: number } = {};
  const makeKey = ({ character, relic }: EnlirLegendMateria) => character + (relic ? '-R' : '-LD');
  _.forEach(legendMateria, lm => {
    const key = makeKey(lm);
    total[key] = total[key] || 0;
    total[key]++;
  });

  const result: { [id: number]: string } = {};
  _.sortBy(legendMateria, 'id').forEach(lm => {
    const key = makeKey(lm);
    seen[key] = seen[key] || 0;
    seen[key]++;

    let alias: string;
    if (lm.relic) {
      alias = 'LMR';
    } else {
      alias = 'LM';
    }
    if (total[key] > 1) {
      alias += seen[key];
    }
    result[lm.id] = alias;
  });

  return result;
}

export enum EnlirAbilityUnlockType {
  Nightmare,
  JobMote,
  TormentRuby,
  RecordBoard,
}

const nightmareAbilities = new Set<string>([
  'Ultima',
  'Crushdown',
  'Reraise',
  'Neo Bahamut',
  'Quadruple Foul',
  'Northern Cross',
  'Meltdown',
  'Curada',
  'Affliction Break',
  'Dervish',
  'Valigarmanda',
  'Omega Drive',
]);

export function getAbilityUnlockType(ability: EnlirAbility): EnlirAbilityUnlockType | null {
  if (ability.rarity < 6) {
    return null;
  } else if (nightmareAbilities.has(ability.name)) {
    return EnlirAbilityUnlockType.Nightmare;
  } else if (ability.recordBoardCharacter) {
    return EnlirAbilityUnlockType.RecordBoard;
  } else if (ability.orbs['Ability Record']) {
    return EnlirAbilityUnlockType.TormentRuby;
  } else {
    return EnlirAbilityUnlockType.JobMote;
  }
}

export const normalSBPoints = {
  nonElemental: [0, 60, 60, 65, 75, 85, 100],
  elemental: [0, 55, 55, 60, 70, 75, 90],
  fast: {
    nonElemental: [0, 0, 0, 0, 0, 75, 90],
    elemental: [0, 0, 0, 0, 0, 65, 80],
  },
};

export function getNormalSBPoints(ability: EnlirAbility): number {
  const isFast = ability.time && ability.time <= 1.2;
  const isElemental = ability.element && ability.element.length;
  const checkSpeed = isFast ? normalSBPoints.fast : normalSBPoints;
  const checkElemental = isElemental ? checkSpeed.elemental : checkSpeed.nonElemental;
  return checkElemental[ability.rarity];
}

export function isNat(skill: EnlirSkill): boolean {
  // NOTE: This does not detect the case where a hybrid WHT/BLK or WHT/SUM
  // skill lists its formula as Magical; see comments on EnlirFormula.
  return skill.type === 'NAT' && skill.formula !== null && skill.formula !== 'Hybrid';
}
