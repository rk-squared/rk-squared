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

/**
 * Actual realms, plus some entries we add to simplify processing
 */
export type EnlirAnyRealm = EnlirRealm | 'Core/Beyond';

export const allEnlirRealms: EnlirRealm[] = [
  'I',
  'II',
  'III',
  'IV',
  'V',
  'VI',
  'VII',
  'VIII',
  'IX',
  'X',
  'XI',
  'XII',
  'XIII',
  'XIV',
  'XV',
  'FFT',
  'Type-0',
  'Beyond',
  'Core',
  'KH',
];

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
export const enlirPrismElementCount = 9; // 8 core + bio; exclude non-elemental
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

export type EnlirLegendMateriaTier = 'LMR' | 'LMR+';

export type EnlirLimitBreakTier = 'OLB' | 'GLB';

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
  | 'TASB'
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

/**
 * Relic (equipment) rarities.  'S' means artifact.
 */
export type EnlirRelicRarity = number | 'S';

interface EnlirRelicStats {
  rarity: EnlirRelicRarity;
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
  effectsNote?: string;
  counter: boolean;
  autoTarget: string;
  id: number;
  gl: boolean;
}

/**
 * A soul break, limit break, or legend materia
 */
export interface EnlirSoulBreakOrLegendMateria {
  id: number;
  name: string;
  anima?: number | null;
  gl: boolean;
}

export interface EnlirAbility extends EnlirGenericSkill {
  school: EnlirSchool;
  rarity: number;
  sb: number;
  uses: number;
  max: number;
  orbs: { [orbName: string]: number[] };
  introducingEvent: string;
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
  tier: EnlirLegendMateriaTier | null;
  effect: string;
  master: string | null;
  relic: string | null;
  nameJp: string;
  id: number;
  anima: number | null;
  gl: boolean;
}

export interface EnlirLimitBreak extends EnlirGenericSkill {
  realm: EnlirRealm;
  character: string;
  tier: EnlirLimitBreakTier;
  minimumLbPoints: number;
  limitBreakBonus: string[];
  relic: string;
  nameJp: string;
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
  rarity: EnlirRelicRarity;
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
  // weren't in ID order.  (This seems to be fixed now.)
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
  | EnlirSoulBreak
  | EnlirLimitBreak;

export enum SbOrLm {
  SoulBreak,
  LegendMateria,
}

export const soulBreakTierOrder: { [t in EnlirSoulBreakTier]: number } = {
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
  TASB: 11,
  CSB: 12,
  RW: 100,
  Shared: 101,
};

export const limitBreakTierOrder: { [t in EnlirLimitBreakTier]: number } = {
  OLB: 1,
  GLB: 0,
};

const rawData = {
  abilities: require('./enlir/abilities.json') as EnlirAbility[],
  braveCommands: require('./enlir/brave.json') as EnlirBraveCommand[],
  burstCommands: require('./enlir/burst.json') as EnlirBurstCommand[],
  characters: require('./enlir/characters.json') as EnlirCharacter[],
  events: require('./enlir/events.json') as EnlirEvent[],
  legendMateria: require('./enlir/legendMateria.json') as EnlirLegendMateria[],
  limitBreaks: require('./enlir/limitBreaks.json') as EnlirLimitBreak[],
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

interface RelicMapType {
  character: string | null;
  name: string;
  relic: string | null;
}

/**
 * Maps from relic IDs (equipment IDs) to soul breaks, limit breaks, or legend
 * materia.
 *
 * The altItems parameter lets us handle the fact that relics "Soul Break" field
 * maps to two different tables.
 */
function makeRelicMap<T extends RelicMapType>(
  relics: EnlirRelic[],
  prop: keyof EnlirRelic,
  items: T[],
  altItems?: RelicMapType[][],
): { [relicId: number]: T } {
  const key = (character: string | null, name: any) => (character || '-') + ':' + name;
  const relicNameMatches = (item: RelicMapType, name: string) =>
    item.relic &&
    (item.relic.replace(/ \([^()]+\)$/, '') === name ||
      item.relic.replace(/ \(.*\)$/, '') === name);

  const result: { [relicId: number]: T } = {};

  const indexedItems = _.keyBy(items, i => key(i.character, i.name));
  const indexedAltItems = altItems
    ? _.keyBy(_.flatten(altItems), i => key(i.character, i.name))
    : {};

  for (const i of relics) {
    if (i[prop]) {
      const found = indexedItems[key(i.character, i[prop])];
      const altFound = indexedAltItems[key(i.character, i[prop])];

      if (altFound && relicNameMatches(altFound, i.name)) {
        continue;
      }

      if (found) {
        result[i.id] = found;
        // Don't warn for shared soul breaks; these don't have 1-to-1 mappings.
        if (i.character && !relicNameMatches(found, i.name)) {
          logger.warn(
            `Name mismatch: relic lists name as ${i.name}, ` +
              `${prop} ${found.name} lists name as ${found.relic}`,
          );
        }
      } else if (!altFound) {
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

  limitBreaks: _.keyBy(rawData.limitBreaks, 'id'),
  limitBreaksByCharacter: makeCharacterMap(rawData.limitBreaks, [
    (i: EnlirLimitBreak) => limitBreakTierOrder[i.tier],
    (i: EnlirLimitBreak) => i.id,
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
    (i: EnlirSoulBreak) => soulBreakTierOrder[i.tier],
    (i: EnlirSoulBreak) => i.sortOrder,
  ]),

  allSoulBreaks: rawData.soulBreaks,
  // True Arcane Soul Breaks result in two entries with the same ID.  The second
  // activation will be under soulBreaks; add the first activation here.
  trueArcane1stSoulBreaks: _.keyBy(rawData.soulBreaks.filter(isTrueArcane1st), 'id'),

  status: _.keyBy(rawData.status, 'id'),
  statusByName: _.keyBy(rawData.status, 'name'),

  synchroCommands: makeIdMultimap(rawData.synchroCommands),
  synchroCommandsByCharacter: makeCommandsMap(rawData.synchroCommands),

  relicSoulBreaks: makeRelicMap(rawData.relics, 'soulBreak', rawData.soulBreaks, [
    rawData.limitBreaks,
  ]),
  relicLimitBreaks: makeRelicMap(rawData.relics, 'soulBreak', rawData.limitBreaks, [
    rawData.soulBreaks,
  ]),
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

function applyEffectsPatch<T extends { effects: string | undefined }>(
  lookup: { [s: string]: T | T[] },
  name: string,
  from: string,
  to: string,
) {
  applyPatch(lookup, name, item => item.effects === from, item => (item.effects = to));
}

function addPatch<T extends { [s: string]: { id: number; name: string } }>(
  lookup: T,
  newItem: Omit<T[string], 'id'>,
) {
  if (lookup[newItem.name]) {
    logger.warn(`Failed to add ${newItem.name}: already exists`);
    return;
  }
  lookup[newItem.name] = { ...newItem, id: NaN } as any;
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

  // Reword Lasswell's AASB to avoid having to avoid invoking our slashMerge
  // code, which handles it poorly.
  // TODO: The update is misleading; it suggests that it refreshes retaliate.
  applyEffectsPatch(
    enlir.statusByName,
    'Azure Oblivion Follow-Up',
    "Casts Azure Oblivion 1/2 after using three Ice abilities if user hasn't/has Retaliate or High Retaliate",
    'Casts Azure Oblivion 1 after using three Ice abilities',
  );
  applyPatch(
    enlir.otherSkillsByName,
    'Azure Oblivion 1',
    skill =>
      skill.effects ===
        'One single attack (5.20) capped at 99999, causes [Imperil Ice 10% (15s)], grants [Buff Ice 10% (15s)] and [High Retaliate] to the user' &&
      enlir.otherSkillsByName['Azure Oblivion 2'].effects ===
        'One single attack (5.20) capped at 99999, causes [DEF, RES and MND -70% (8s)] and [Imperil Ice 10% (15s)], grants [Buff Ice 10% (15s)] to the user',
    skill => {
      skill.effects =
        'One single attack (5.20) capped at 99999, ' +
        'causes [DEF, RES and MND -70% (8s)] if the user has Retaliate or High Retaliate, ' +
        'causes [Imperil Ice 10% (15s)], grants [Buff Ice 10% (15s)] and [High Retaliate] to the user';
    },
  );

  // Multi-character soul breaks like Sarah's USB3 and Xezat's AASB are quite
  // complex.  We'll do whatever hacks it takes to process them.
  applyPatch(
    enlir.soulBreaks,
    '22300009', // Sarah - Song of Reunion
    aria =>
      aria.effects ===
      'Restores HP (85), grants [Regenga], grants [Quick Cast] to the user, ' +
        'grants [Buff Holy 10% (15s)]/[Buff Dark 10% (15s)] if Warrior of Light/Garland is in the party, ' +
        'grants [Buff Holy 20% (15s)] and [Buff Dark 20% (15s)] if both are in the party',
    aria => {
      aria.effects =
        'Restores HP (85), grants [Regenga], grants [Quick Cast] to the user, ' +
        'grants [Buff Holy 10% (15s)] if Warrior of Light is in the party, ' +
        'grants [Buff Dark 10% (15s)] if Garland is in the party, ' +
        'grants [Buff Holy 20% (15s)] and [Buff Dark 20% (15s)] if Warrior of Light and Garland are in the party';
    },
  );
  applyPatch(
    enlir.soulBreaks,
    '22300011',
    song =>
      song.effects ===
      'Restores HP (105), removes KO [Raise: 100%], grants [Last Stand], [Haste], [High Quick Cast 2], ' +
        'grants [Buff Holy 10% (15s)]/[Buff Dark 10% (15s)] and [HP Stock (2000)] if Warrior of Light/Garland is in the party, ' +
        'grants [Buff Holy 20% (15s)] and [Buff Dark 20% (15s)] and [HP Stock (2000)] if both are in the party, ' +
        'grants [Awoken Cornelian Princess] to the user',
    song => {
      song.effects =
        'Restores HP (105), removes KO [Raise: 100%], grants [Last Stand], [Haste], [High Quick Cast 2], ' +
        'grants [Buff Holy 10% (15s)]/[Buff Dark 10% (15s)] and [HP Stock (2000)] if Warrior of Light/Garland is in the party, ' +
        'grants [Buff Holy 20% (15s)] and [Buff Dark 20% (15s)] and [HP Stock (2000)] if Warrior of Light and Garland are in the party, ' +
        'grants [Awoken Cornelian Princess] to the user';
    },
  );

  // "and" vs. "or" is an apparent mistake in the database - and change
  // terminology to match Runic Release.
  applyEffectsPatch(
    enlir.otherSkillsByName,
    'Cross Shift',
    'Six single attacks (2.41 each), grants [Buff Dark 10% (15s)] and [Buff Holy 10% (15s)] every second cast based on element of triggering ability',
    "Six single attacks (2.41 each), grants [Buff Dark 10% (15s)] or [Buff Holy 10% (15s)] every second cast based on triggering ability's element",
  );

  // Status cleanups.  These too should be fixed up.
  applyPatch(
    enlir.statusByName,
    'Windborn Swiftness Mode',
    mode =>
      mode.effects ===
      'Grants [Windborn Swiftness 0]/[Windborn Swiftness 1]/[Windborn Swiftness 2]/[Windborn Swiftness 3] after using a Monk ability',
    mode => {
      // Adequately covered by Windborn Swiftness 0/1/2/3
      mode.effects = '';
    },
  );
  for (let i = 0; i <= 3; i++) {
    applyPatch(
      enlir.statusByName,
      `Windborn Swiftness ${i}`,
      mode => mode.effects.match(/[Gg]rants \[Windborn Swiftness (\d+)],/) != null,
      mode => {
        mode.effects = mode.effects.replace(
          /([Gg]rants) \[Windborn Swiftness (\d+)],/,
          (match, p1, p2) => `${p1} [Windborn Swiftness ${p2}] after using a Monk ability,`,
        );
      },
    );
  }
  applyPatch(
    enlir.statusByName,
    'Awoken Guardian',
    mode =>
      mode.effects ===
      "White Magic abilities don't consume uses and single target heals grant [Stoneskin: 30/40/50/60/70%] to target at ability rank 1/2/3/4/5, dualcasts White Magic abilities",
    mode => {
      mode.effects =
        "White Magic abilities don't consume uses, grants [Stoneskin: 30/40/50/60/70%] at rank 1/2/3/4/5 of the triggering ability to the target after using a single-target heal, dualcasts White Magic abilities";
    },
  );
  applyEffectsPatch(
    enlir.statusByName,
    'Items +1',
    "Increases Items level by 1 after using Potato Masher, removed if user hasn't Synchro Mode",
    'Increases Items level by 1 when set',
  );
  applyEffectsPatch(
    enlir.statusByName,
    'Gulp',
    'Grants [100% Critical 1], [Damage Cap +10000 1] and Proficiency +1 to the user after using two Samurai or Knight abilities, ' +
      'grants [Critical Damage +50% 1] to the user if Hilda is alive after using two Samurai or Knight abilities' +
      ". Proficiency removed if user hasn't Synchro Mode",
    // Remove text about removing status level - why should only this synchro
    // status call that out?
    'Grants [100% Critical 1], [Damage Cap +10000 1] and Proficiency +1 to the user after using two Samurai or Knight abilities, ' +
      'grants [Critical Damage +50% 1] to the user if Hilda is alive after using two Samurai or Knight abilities',
  );
  applyEffectsPatch(
    enlir.statusByName,
    'Eblan Unity',
    'After using three of Eblan Surge or Eblan Struggle, if user has any [Attach Element], grants the same Attach Element to the user',
    'Grants [Conditional Attach Element] to the user after using three of Eblan Surge or Eblan Struggle',
  );
  addPatch(enlir.statusByName, {
    name: 'Buff Fire 10% (5s)',
    effects: 'Increases Fire damage dealt by 10%, cumulable',
    defaultDuration: 5,
    mndModifier: null,
    mndModifierIsOpposed: false,
    exclusiveStatus: null,
    codedName: 'INCREASE_ELEMENT_ATK_FIRE_1_TIME_SHORT',
    notes: null,
  });

  // Legend materia.  These, too, should be upstreamed if possible.
  applyPatch(
    enlir.legendMateria,
    '201070504',
    legendMateria =>
      legendMateria.effect ===
      'Grants [Quick Cast], grants [Lingering Spirit] for 25 seconds when HP fall below 20%',
    legendMateria => {
      legendMateria.effect =
        'Grants [Quick Cast] and [Lingering Spirit] for 25 seconds when HP fall below 20%';
    },
  );

  // Tyro AASB.  This is a mess in Enlir; how should it be explained?
  applyPatch(
    enlir.soulBreaks,
    '20140018',
    tyroAasb =>
      tyroAasb.effects ===
      'Grants [50% Critical] and [Haste], [ATK and DEF +30%] for 25 seconds, grants [Awoken Keeper Mode] and [Unraveled History Follow-Up] to the user',
    tyroAasb => {
      tyroAasb.effects =
        'Grants [50% Critical] and [Haste], [ATK and DEF +30%] for 25 seconds, grants [Awoken Keeper Mode], [Awoken Keeper Mode Critical Chance] and [Unraveled History Follow-Up] to the user';
    },
  );
  applyPatch(
    enlir.statusByName,
    'Awoken Keeper Mode',
    scholar =>
      scholar.effects ===
      "Support abilities don't consume uses, cast speed x2.00/2.25/2.50/2.75/3.00 for Support abilities at ability rank 1/2/3/4/5, " +
        'casts Awoken Keeper Mode Critical after using a Support ability',
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
      'If not resisted, causes [Instant KO] (100%), otherwise, two group attacks (6.00 each), minimum damage 2500, causes [DEF and RES -20%] for 25 seconds',
    ability =>
      (ability.effects =
        'Two group attacks (6.00 each), minimum damage 2500, causes [Instant KO] (100%) and [DEF and RES -20%] for 25 seconds'),
  );
  // Make Steal Time match a more common word order.
  applyPatch(
    enlir.abilitiesByName,
    'Steal Time',
    ability => ability.effects === 'Causes [Slow] (50%), if successful grants [Haste] to the user',
    ability => (ability.effects = 'Causes [Slow] (50%), grants [Haste] to the user if successful'),
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

  // Some Synchro skills and effects are complex and hard to parse:
  // Dk.Cecil's SASB chase is apparently trying to say that it's -1 Gloomshade
  // only if it's at Gloomshade levels 1 and 2, but it's simpler to avoid that.
  applyPatch(
    enlir.otherSkillsByName,
    'Shadow Chaser',
    ability =>
      ability.effects ===
      'One single attack (4.00~7.00 scaling with current HP%) capped at 99999, ' +
        'heals the user for 20% of the damage dealt at Gloomshade levels 1 and 2 ' +
        'and causes -1 Gloomshade to the user, 100% hit rate',
    ability => {
      ability.effects =
        'One single attack (4.00~7.00 scaling with current HP%) capped at 99999, ' +
        'heals the user for 20% of the damage dealt at Gloomshade levels 1 and 2,' +
        'causes -1 Gloomshade to the user, 100% hit rate';
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
      '1/4/8 single ranged/single/single attacks (0.80 each) if the user Physical Blink 0/1/2, ' +
        'grants [Physical Blink 1]/[Physical Blink 1] if the user has Physical Blink 0/1+, 100% hit rate at Physical Blink 0',
    ability => {
      ability.effects =
        '1/4/8 single attacks (0.80 each) if the user has Physical Blink 0/1/2, grants [Physical Blink 1] to the user';
    },
  );
  // For Palom's sync, our parser isn't currently set up to handle "and" conditionals, and this
  // format probably looks better regardless.
  applyEffectsPatch(
    enlir.synchroCommands,
    '31540512',
    'Restores HP (25), restores HP (85) and grants [Instant Cast 1] if the user has Mature Mode level 1, causes Mature Mode -1 to the user',
    'Restores HP (25/85) if the user has Mature Mode level 0/1, grants [Instant Cast 1] if the user has Mature Mode level 1, causes Mature Mode -1 to the user',
  );
  // Use a more standard SB points format for Kuja.
  applyEffectsPatch(
    enlir.synchroCommands, // Kuja - Dark Flare Burst
    '31540384',
    '1/2 single attacks (16.40 each) capped at 99999 if the user has less than/greater than or equal to 1000 SB points, ' +
      'causes [Soul Break Gauge -250] to the user if the user has 1000+ SB points',
    '1/2 single attacks (16.40 each) capped at 99999 if the user has 0/1000 SB points, ' +
      'causes [Soul Break Gauge -250] to the user if the user has 1000+ SB points',
  );
  // Make Raging Wind Mode follow a more common order.
  applyEffectsPatch(
    enlir.statusByName,
    'Raging Wind Mode',
    'If user has any Damage Reduction Barrier, grants [200% ATB 1] to the user after using Violent Tornado or Whirlwind Form',
    'After using Violent Tornado or Whirlwind Form, grants [200% ATB 1] to the user if user has any Damage Reduction Barrier',
  );
  // For Ayame's synchro, fix an apparent mistake in the skill name.  It's
  // equivalent and fits our output format better to say "removed after triggering"
  // than to say that cmd1 removes the status.
  applyEffectsPatch(
    enlir.statusByName,
    'Sword Stance',
    "Casts Sword Stance after using Tachi: Yukikaze, removed if user hasn't Synchro Mode",
    "Casts Taichi Blossom after using Tachi: Yukikaze, removed after triggering or if user hasn't Synchro Mode",
  );
  applyEffectsPatch(
    enlir.synchroCommands,
    '31540074',
    'Five single attacks (0.90 each), 100% additional critical chance if user has any Retaliate, removes [Sword Stance] from the user',
    'Five single attacks (0.90 each), 100% additional critical chance if user has any Retaliate',
  );
  // Simplify Angeal; hopefully the "or" communicates well enough.
  applyEffectsPatch(
    enlir.statusByName,
    'Dream Pioneer Mode',
    'Grants [Dream Pioneer Wind Ability +15% Boost]/[Dream Pioneer Wind Ability +30% Boost]/[Dream Pioneer Wind Ability +50% Boost] ' +
      'after using 1/2/3+ Wind abilities, ' +
      'grants [Dream Pioneer Holy Ability +15% Boost]/[Dream Pioneer Holy Ability +30% Boost]/[Dream Pioneer Holy Ability +50% Boost] ' +
      'after using 1/2/3+ Holy abilities. ' +
      'Only one of these effects can trigger at a time',
    'Grants [Dream Pioneer Wind Ability +15% Boost]/[Dream Pioneer Wind Ability +30% Boost]/[Dream Pioneer Wind Ability +50% Boost] ' +
      'or [Dream Pioneer Holy Ability +15% Boost]/[Dream Pioneer Holy Ability +30% Boost]/[Dream Pioneer Holy Ability +50% Boost] ' +
      'after using 1/2/3+ Wind or Holy abilities',
  );
  // Rain SASB is far too complex to communicate in our allotted space.  Throw
  // away some detail.
  applyEffectsPatch(
    enlir.statusByName,
    'Vagrant Knight Mode',
    'Casts Vagrant Knight Alpha 1/2 at Vagrant Knight Alpha Level 2/3 and Vagrant Knight Beta Level 0 or 1, ' +
      'casts Vagrant Knight Beta 1/2 at Vagrant Knight Beta Level 2/3 and Vagrant Knight Alpha Level 0 or 1, ' +
      'casts Vagrant Knight Gamma 1/2 at Vagrant Knight Alpha Level 1 and Vagrant Knight Beta Level 1/' +
      'Vagrant Knight Alpha Level 2+ and Vagrant Knight Beta Level 2+, ' +
      'all follow-ups only triggered every other cast of either Crimson Charge or Crimson Break',
    'Casts Vagrant Knight Alpha 1/2 after casting Crimson Charge or Crimson Break two times at Vagrant Knight Alpha level 2/3, ' +
      'casts Vagrant Knight Beta 1/2 after casting Crimson Charge or Crimson Break two times at Vagrant Knight Beta level 2/3, ' +
      'casts Vagrant Knight Gamma 1/2 after casting Crimson Charge or Crimson Break two times at Vagrant Knight Alpha & Beta level 1/2',
  );
  // Our code isn't set up to show otherSkills names, but that leaves no good
  // way to handle otherSkills as triggers.  Reword Gladiolus's sync to avoid
  // the issue.
  applyEffectsPatch(
    enlir.statusByName,
    'Precise Guard Mode',
    'Casts Timely Counter when any Damage Reduction Barrier is removed, increases Earth damage dealt by 15/30/50/70% after casting Timely Counter 0/1/2/3+ times',
    'Casts Timely Counter when any Damage Reduction Barrier is removed, increases Earth damage dealt by 15/30/50/70% scaling with 0/1/2/3 uses',
  );

  // Use the older, less verbose format for hybrid effects.  (Personally, I
  // prefer this...)
  applyEffectsPatch(
    enlir.soulBreaks,
    '23380003', // Shadowsmith - Soul of Nihility
    "Ten single attacks (0.71 each), grants [Attach Dark], [Damage Cap +10000] and [Nihility Follow-Up] to the user, grants [PHY +30% Boost] to the user if user's ATK > MAG, grants or [Magical +30% Boost] to the user if user's MAG > ATK",
    'Ten single attacks (0.71 each), grants [Attach Dark], [Damage Cap +10000] and [Nihility Follow-Up] to the user, grants [PHY +30% Boost] or [Magical +30% Boost] to the user',
  );
  applyEffectsPatch(
    enlir.otherSkillsByName,
    '...Work (Earth)',
    'Grants [Attach Earth], grants [BLK +30% Boost 1]/[BLK +50% Boost 1] if MAG > ATK, otherwise grants [PHY +30% Boost 1]/[PHY +50% Boost 1] if Reno, Elena or Tifa are not alive/alive',
    'Grants [Attach Earth], grants [PHY +30% Boost 1]/[PHY +50% Boost 1] or [BLK +30% Boost 1]/[BLK +50% Boost 1] if Reno, Elena or Tifa are not alive/alive',
  );
  applyEffectsPatch(
    enlir.otherSkillsByName,
    '...Work (Lightning)',
    'Grants [Attach Lightning], grants [BLK +30% Boost 1]/[BLK +50% Boost 1] if MAG > ATK, otherwise grants [PHY +30% Boost 1]/[PHY +50% Boost 1] if Reno, Elena or Tifa are not alive/alive',
    'Grants [Attach Lightning], grants [PHY +30% Boost 1]/[PHY +50% Boost 1] or [BLK +30% Boost 1]/[BLK +50% Boost 1] if Reno, Elena or Tifa are not alive/alive',
  );

  // Try to consistently use brackets for actual statuses and no brackets for
  // status levels (such as are used for synchro commands).
  //
  // We also smooth out tiered effects to make them look nicer.
  applyEffectsPatch(
    enlir.synchroCommands,
    '31540523',
    'Grants [Fire Ability +10% Boost 1]/[Fire Ability +15% Boost 1]/[Fire Ability +30% Boost 1]/' +
      '[Fire Ability +50% Boost 1] and [Damage Cap +10000 1] if the user has Chakra level 0/1/2/3, ' +
      'removes [Chakra] from the user',
    'Grants [Fire Ability +10% Boost 1]/[Fire Ability +15% Boost 1]/[Fire Ability +30% Boost 1]/' +
      '[Fire Ability +50% Boost 1] if the user has Chakra level 0/1/2/3, ' +
      'grants [Damage Cap +10000 1] if the user has Chakra level 3, ' +
      'removes Chakra from the user',
  );

  // Apparent mistakes from adding brackets to status names.  Should be
  // upstreamed.  We also add a few explicit "grants" and "causes" verbs - see
  // below.
  applyEffectsPatch(
    enlir.soulBreaks,
    '20210005', // Celes - Maria's Song
    'ATK and MAG +30% to all allies for 25 seconds, grants [Haste], [Attach Holy] and [Burst Mode] to the user',
    '[ATK and MAG +30%] to all allies for 25 seconds, grants [Haste], [Attach Holy] and [Burst Mode] to the user',
  );
  applyEffectsPatch(
    enlir.soulBreaks,
    '22070002', // Kefka - Magic Infusion
    'MAG +20% for 25 seconds, grants [Haste]',
    '[MAG +20%] for 25 seconds, grants [Haste]',
  );
  applyEffectsPatch(
    enlir.soulBreaks,
    '22500004', // Angeal - Idle Rage
    'Ten single attacks (0.71 each), grants 100% Critical to the user, ' +
      'grants [50% Damage Reduction Barrier 2] and [Regenga] to all allies',
    'Ten single attacks (0.71 each), grants [100% Critical] to the user, ' +
      'grants [50% Damage Reduction Barrier 2] and [Regenga] to all allies',
  );
  applyEffectsPatch(
    enlir.soulBreaks,
    '22100007', // Laguna - Ragnarok Buster
    'Seven group ranged attacks (0.75 each), [Imperil Ice 20%] for 25 seconds, grants ATK and RES +30%, [High Quick Cast 1] and [Ice High Quick Cycle] to the user',
    'Seven group ranged attacks (0.75 each), [Imperil Ice 20%] for 25 seconds, grants [ATK and RES +30%], [High Quick Cast 1] and [Ice High Quick Cycle] to the user',
  );
  applyEffectsPatch(
    enlir.soulBreaks,
    '23000002', // Ward - Wordless Promise
    'ATK +50% for 25 seconds, grants [Last Stand]',
    '[ATK +50%] for 25 seconds, grants [Last Stand]',
  );
  applyEffectsPatch(
    enlir.soulBreaks,
    '20860003', // Zidane - Rumble Rush
    'Four single attacks (1.28 each), ATK -50% for 25 seconds, [ATK +35%] to the user for 25 seconds',
    'Four single attacks (1.28 each), [ATK -50%] for 25 seconds, grants [ATK +35%] to the user for 25 seconds',
  );
  applyEffectsPatch(
    enlir.soulBreaks,
    '20860004', // Zidane - Shift Break
    'Four group ranged attacks (1.50 each), ATK -50% for 25 seconds, ATK +35% to the user for 25 seconds',
    'Four group ranged attacks (1.50 each), [ATK -50%] for 25 seconds, grants [ATK +35%] to the user for 25 seconds',
  );
  applyEffectsPatch(
    enlir.soulBreaks,
    '20840006', // Quina - Culinary Curiosity
    'ATK +50% for 25 seconds, grants [Protect], [Shell] and [Haste]',
    '[ATK +50%] for 25 seconds, grants [Protect], [Shell] and [Haste]',
  );
  applyEffectsPatch(
    enlir.soulBreaks,
    '20690002', // Auron - Dragon Fang
    'One group attack (3.20), ATK -50% for 25 seconds',
    'One group attack (3.20), [ATK -50%] for 25 seconds',
  );
  applyEffectsPatch(
    enlir.soulBreaks,
    '22880006', // Aphmau - Imperial Heal
    'Causes Imperil Holy 20%, restores HP (85) to all allies, grants [Imperial Heal] and [Glimpse of Divinity Follow-Up] to the user',
    'Causes [Imperil Holy 20%], restores HP (85) to all allies, grants [Imperial Heal] and [Glimpse of Divinity Follow-Up] to the user',
  );
  applyEffectsPatch(
    enlir.soulBreaks,
    '23200002', // Ignis - Stalwart Cook
    'ATK and RES +30% for 25 seconds, grants [Haste], grants [Ingredients +2] and [Burst Mode] to the user',
    '[ATK and RES +30%] for 25 seconds, grants [Haste], grants [Ingredients +2] and [Burst Mode] to the user',
  );
  applyEffectsPatch(
    enlir.soulBreaks,
    '22700004', // Rapha - Miracle of Scorpio
    'MAG +30% for 25 seconds, grants [Haste] and [Magical Quick Cast 3], grants [Attach Lightning] to the user',
    '[MAG +30%] for 25 seconds, grants [Haste] and [Magical Quick Cast 3], grants [Attach Lightning] to the user',
  );
  applyEffectsPatch(
    enlir.abilitiesByName,
    'Mug Bloodlust',
    'Two single attacks (1.60 each), ATK and DEF -30% for 20 seconds, [ATK and DEF +30%] to the user for 20 seconds',
    'Two single attacks (1.60 each), [ATK and DEF -30%] for 20 seconds, grants [ATK and DEF +30%] to the user for 20 seconds',
  );
  applyEffectsPatch(
    enlir.abilitiesByName,
    'Quadruple Foul',
    'Four random hybrid ranged attacks (1.00 or 3.33), causes Poison (26%), Sleep (26%), Blind (26%) and Silence (26%)',
    'Four random hybrid ranged attacks (1.00 or 3.33), causes [Poison] (26%), [Sleep] (26%), [Blind] (26%) and [Silence] (26%)',
  );
  applyEffectsPatch(
    enlir.abilities,
    '30121431', // Sarah HA - Sacred Prayer
    'Restores 1500 HP and grants [10% Damage Reduction Barrier 1]',
    'Restores 1500 HP, grants [10% Damage Reduction Barrier 1]',
  );

  // Add explicit "grants" and "causes" verbs.  This greatly simplifies parsing.
  applyEffectsPatch(
    enlir.abilitiesByName,
    'Steal Defense',
    '[DEF -40%] for 20 seconds, [DEF +50%] to the user for 20 seconds',
    '[DEF -40%] for 20 seconds, grants [DEF +50%] to the user for 20 seconds',
  );
  applyEffectsPatch(
    enlir.abilitiesByName,
    'Steal Power',
    '[ATK -40%] for 20 seconds, [ATK +50%] to the user for 20 seconds',
    '[ATK -40%] for 20 seconds, grants [ATK +50%] to the user for 20 seconds',
  );
  applyEffectsPatch(
    enlir.soulBreaks,
    '22300005', // Sarah - Age-old Hymn
    'Restores HP (55), grants [Magical Blink 1], [RES and MND +30%] to the user for 25 seconds, grants [Haste] and [Burst Mode] to the user',
    'Restores HP (55), grants [Magical Blink 1], grants [RES and MND +30%] to the user for 25 seconds, grants [Haste] and [Burst Mode] to the user',
  );
  applyEffectsPatch(
    enlir.soulBreaks,
    '22130003', // Leila - Pirate's Knives
    'Six single attacks (1.27 each), [ATK and RES -50%] for 25 seconds, [ATK and RES +30%] to the user for 25 seconds',
    'Six single attacks (1.27 each), [ATK and RES -50%] for 25 seconds, grants [ATK and RES +30%] to the user for 25 seconds',
  );
  applyEffectsPatch(
    enlir.soulBreaks,
    '22230004', // Desch - Roiling Memories
    'Six random attacks (2.94 each), causes [Imperil Lightning 20%] for 25 seconds, [MAG +30%] to the user for 25 seconds',
    'Six random attacks (2.94 each), causes [Imperil Lightning 20%] for 25 seconds, grants [MAG +30%] to the user for 25 seconds',
  );
  applyEffectsPatch(
    enlir.soulBreaks,
    '20070016', // Cecil (Paladin) - Shining Crescent
    'Fifteen single hybrid attacks (0.60 or 1.60 each), grants [Attach Holy], [Awoken Holy], [Damage Cap +10000] to the user and [75% Damage Reduction Barrier 3] to all allies',
    'Fifteen single hybrid attacks (0.60 or 1.60 each), grants [Attach Holy], [Awoken Holy], [Damage Cap +10000] to the user, grants [75% Damage Reduction Barrier 3] to all allies',
  );
  applyEffectsPatch(
    enlir.soulBreaks,
    '22350003', // Edward - Whisperweed Ballad
    'Causes [Imperil Holy 20%] for 25 seconds, [ATK +50%] to all allies for 25 seconds, grants [Haste] and [Burst Mode] to the user',
    'Causes [Imperil Holy 20%] for 25 seconds, grants [ATK +50%] to all allies for 25 seconds, grants [Haste] and [Burst Mode] to the user',
  );
  applyEffectsPatch(
    enlir.soulBreaks,
    '20730003', // Fusoya - Lunarian Might
    'Causes [Imperil Dark 20%] for 25 seconds, [MAG and MND +30%] to all allies for 25 seconds',
    'Causes [Imperil Dark 20%] for 25 seconds, grants [MAG and MND +30%] to all allies for 25 seconds',
  );
  applyEffectsPatch(
    enlir.soulBreaks,
    '20200007', // Lenna - Phoenix of Tycoon
    'Restores HP (55), grants [Reraise: 40%], [RES and MND +30%] to the user for 25 seconds, grants [Haste] and [Burst Mode] to the user',
    'Restores HP (55), grants [Reraise: 40%], grants [RES and MND +30%] to the user for 25 seconds, grants [Haste] and [Burst Mode] to the user',
  );
  applyEffectsPatch(
    enlir.soulBreaks,
    '22510002', // Dorgan - Shiradori
    '[DEF -15%] for 25 seconds, [ATK +15%] to the user for 25 seconds',
    '[DEF -15%] for 25 seconds, grants [ATK +15%] to the user for 25 seconds',
  );
  applyEffectsPatch(
    enlir.soulBreaks,
    '22510003', // Dorgan - Uncharted Lands
    'Causes [Imperil Earth 20%] for 25 seconds, [ATK and DEF +30%] to all allies for 25 seconds, grants [Haste] and [Burst Mode] to the user',
    'Causes [Imperil Earth 20%] for 25 seconds, grants [ATK and DEF +30%] to all allies for 25 seconds, grants [Haste] and [Burst Mode] to the user',
  );
  applyEffectsPatch(
    enlir.soulBreaks,
    '20360007', // Garnet - Trial by Lightning
    'Causes [Imperil Lightning 20%] for 25 seconds, [ATK and MAG +30%] to all allies for 25 seconds, grants [Haste] and [Burst Mode] to the user',
    'Causes [Imperil Lightning 20%] for 25 seconds, grants [ATK and MAG +30%] to all allies for 25 seconds, grants [Haste] and [Burst Mode] to the user',
  );
  applyEffectsPatch(
    enlir.soulBreaks,
    '20970004', // Rikku - Machina Sabotage
    'Four single attacks (1.29 each), [ATK -50%] for 25 seconds, [ATK +50%] to the user for 25 seconds',
    'Four single attacks (1.29 each), [ATK -50%] for 25 seconds, grants [ATK +50%] to the user for 25 seconds',
  );
  applyEffectsPatch(
    enlir.soulBreaks,
    '20970006', // Rikku - Master Thief
    'Six single attacks (1.28 each), [ATK and RES -50%] for 25 seconds, [ATK and RES +30%] to the user for 25 seconds',
    'Six single attacks (1.28 each), [ATK and RES -50%] for 25 seconds, grants [ATK and RES +30%] to the user for 25 seconds',
  );
  applyEffectsPatch(
    enlir.soulBreaks,
    '23350002', // Lilisette - Vivifying Waltz
    'Grants [HP Stock (2000)], [ATK, DEF, MAG and RES -40%] to all enemies for 25 seconds, grants [Haste] and [Burst Mode] to the user',
    'Grants [HP Stock (2000)], causes [ATK, DEF, MAG and RES -40%] to all enemies for 25 seconds, grants [Haste] and [Burst Mode] to the user',
  );
  applyEffectsPatch(
    enlir.soulBreaks,
    '20700004', // Vaan - Pyroclasm
    'Four group ranged attacks (1.50 each), [ATK -50%] for 25 seconds, [ATK +50%] to the user for 25 seconds',
    'Four group ranged attacks (1.50 each), [ATK -50%] for 25 seconds, grants [ATK +50%] to the user for 25 seconds',
  );
  applyEffectsPatch(
    enlir.soulBreaks,
    '20700009', // Vaan - Cruelest Azure
    'Ten random attacks (0.70 each), [ATK and RES -50%] for 25 seconds, [ATK and RES +30%] to the user for 25 seconds, grants [EX: Sky Pirate] to the user',
    'Ten random attacks (0.70 each), [ATK and RES -50%] for 25 seconds, grants [ATK and RES +30%] to the user for 25 seconds, grants [EX: Sky Pirate] to the user',
  );
  applyEffectsPatch(
    enlir.soulBreaks,
    '22320001', // Yda - Twin Snake Dragon Kick
    'Six single attacks (1.30 each), [DEF -50%] for 25 seconds, [ATK +30%] to all allies for 25 seconds',
    'Six single attacks (1.30 each), [DEF -50%] for 25 seconds, grants [ATK +30%] to all allies for 25 seconds',
  );
  applyEffectsPatch(
    enlir.soulBreaks,
    '22320005', // Yda - True Demolition
    'Four group attacks (1.39 each), [DEF and RES -50%] for 25 seconds, [ATK and DEF +30%] to the user for 25 seconds',
    'Four group attacks (1.39 each), [DEF and RES -50%] for 25 seconds, grants [ATK and DEF +30%] to the user for 25 seconds',
  );
  applyEffectsPatch(
    enlir.soulBreaks,
    '23330001', // Orran - Celestial Stasis
    'Grants [Magical Blink 1] and [Instant Cast 1], [ATK, DEF, MAG and RES -70%] to all enemies for 8 seconds',
    'Grants [Magical Blink 1] and [Instant Cast 1], causes [ATK, DEF, MAG and RES -70%] to all enemies for 8 seconds',
  );
  applyEffectsPatch(
    enlir.burstCommands,
    '30511102', // Leila - Poison Cloud XVI
    'Two single attacks (0.86 each), [ATK and MND -20%] for 20 seconds, [ATK and MND +20%] to the user for 20 seconds',
    'Two single attacks (0.86 each), [ATK and MND -20%] for 20 seconds, grants [ATK and MND +20%] to the user for 20 seconds',
  );
  applyEffectsPatch(
    enlir.burstCommands,
    '30511441', // Bartz - Woken Water
    'One single attack (2.00), [ATK -40%] for 20 seconds, [ATK +50%] to the user for 20 seconds',
    'One single attack (2.00), [ATK -40%] for 20 seconds, grants [ATK +50%] to the user for 20 seconds',
  );
  applyEffectsPatch(
    enlir.burstCommands,
    '30510221', // Locke - Mirage Phoenix
    'One single attack (2.00), [ATK and MAG -20%] for 20 seconds, [ATK and MAG +20%] to the user for 20 seconds',
    'One single attack (2.00), [ATK and MAG -20%] for 20 seconds, grants [ATK and MAG +20%] to the user for 20 seconds',
  );
  applyEffectsPatch(
    enlir.burstCommands,
    '30512222', // Locke - On the Hunt
    'Two single ranged attacks (0.86 each), [ATK -50%] for 20 seconds, [ATK +50%] to the user for 20 seconds',
    'Two single ranged attacks (0.86 each), [ATK -50%] for 20 seconds, grants [ATK +50%] to the user for 20 seconds',
  );
  applyEffectsPatch(
    enlir.burstCommands,
    '30510622', // Yuffie - Guardian of Wutai
    'Two single ranged attacks (0.86 each), [ATK and DEF -20%] for 20 seconds, [ATK and DEF +20%] to the user for 20 seconds',
    'Two single ranged attacks (0.86 each), [ATK and DEF -20%] for 20 seconds, grants [ATK and DEF +20%] to the user for 20 seconds',
  );
  applyEffectsPatch(
    enlir.burstCommands,
    '30511672', // Rinoa - Angel Wing Ice Shards
    '[MAG -40%] for 20 seconds, [MAG +30%] to the user for 20 seconds',
    '[MAG -40%] for 20 seconds, grants [MAG +30%] to the user for 20 seconds',
  );
  applyEffectsPatch(
    enlir.burstCommands,
    '30510131', // Zidane - Stellar Circle 5
    'One single attack (2.00), [ATK -40%] for 20 seconds, [ATK +50%] to the user for 20 seconds',
    'One single attack (2.00), [ATK -40%] for 20 seconds, grants [ATK +50%] to the user for 20 seconds',
  );
  applyEffectsPatch(
    enlir.burstCommands,
    '30510132', // Zidane - Stellar Circle 5
    'One single attack (2.00), [DEF -40%] for 20 seconds, [DEF +50%] to the user for 20 seconds',
    'One single attack (2.00), [DEF -40%] for 20 seconds, grants [DEF +50%] to the user for 20 seconds',
  );
  applyEffectsPatch(
    enlir.burstCommands,
    '30510272', // Rikku - Machinations
    'Two single ranged attacks (1.00 each), [ATK and DEF -20%] for 20 seconds, [ATK and DEF +20%] to the user for 20 seconds',
    'Two single ranged attacks (1.00 each), [ATK and DEF -20%] for 20 seconds, grants [ATK and DEF +20%] to the user for 20 seconds',
  );
  applyEffectsPatch(
    enlir.burstCommands,
    '30512452', // Rikku - Team Bomb
    'Two single ranged attacks (0.86 each), [ATK -50%] for 20 seconds, [ATK +50%] to the user for 20 seconds',
    'Two single ranged attacks (0.86 each), [ATK -50%] for 20 seconds, grants [ATK +50%] to the user for 20 seconds',
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

export interface EnlirStatusPlaceholders {
  xValue?: number;
  xValueIsUncertain?: boolean;
  element?: EnlirElement;
  school?: EnlirSchool;
  stat?: EnlirStat;
}

export interface EnlirStatusWithPlaceholders {
  status: EnlirStatus;
  placeholders?: EnlirStatusPlaceholders;
}

/**
 * Retrieves an EnlirStatus by name, including support for generic numbers and
 * elements.
 */
export function getEnlirStatusWithPlaceholders(
  status: string,
): EnlirStatusWithPlaceholders | undefined {
  if (enlir.statusByName[status]) {
    return { status: enlir.statusByName[status] };
  }

  const placeholders: EnlirStatusPlaceholders = {};

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

const getTrueArcaneBaseName = (sb: EnlirSoulBreak) =>
  // To accommodate Rydia's Gaia's Rage, we have to remove realm suffixes as
  // well as "(Release)".
  sb.name.replace(/ \(Release\)$/, '').replace(/ \([IV]+\)$/, '');

/**
 * For a true arcane soul break (TASB), gets the associated status that
 * increments the level.
 */
export function getEnlirTrueArcaneTracker(sb: EnlirSoulBreak): EnlirStatus | undefined {
  const name = getTrueArcaneBaseName(sb);
  return (
    enlir.statusByName[name + ' Ability Tracker'] || enlir.statusByName[name + ' Damage Tracker']
  );
}

/**
 * For a true arcane soul break (TASB), gets the associated status that
 * tracks the level.
 */
export function getEnlirTrueArcaneLevel(sb: EnlirSoulBreak): EnlirStatus | undefined {
  return enlir.statusByName[getTrueArcaneBaseName(sb) + ' Level'];
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
  return (sb.tier === 'USB' || sb.tier === 'AASB') && sb.effects.match(/Brave Mode/) != null;
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

export function isLimitBreak(skill: EnlirSkill): skill is EnlirLimitBreak {
  return 'minimumLbPoints' in skill;
}

export function isTrueArcane1st(sb: EnlirSoulBreak): boolean {
  return sb.tier === 'TASB' && sb.points === 0;
}

export function isTrueArcane2nd(sb: EnlirSoulBreak): boolean {
  return sb.tier === 'TASB' && sb.points !== 0;
}

/**
 * Some of our status-handling code is flexible enough to handle legend materia
 * effects as well.  This function helps implement that.
 */
export function isEnlirStatus(status: EnlirStatus | EnlirLegendMateria): status is EnlirStatus {
  return 'effects' in status;
}

function makeSkillAliases<
  TierT extends string,
  SkillT extends { id: number; character: string | null; tier: TierT }
>(
  skills: _.Dictionary<SkillT>,
  tierAlias: { [s in TierT]: string } | undefined,
  makeAlias: (skill: SkillT, tierText: string, total: number, seen: number) => string,
): { [id: number]: string } {
  const total: { [key: string]: number } = {};
  const seen: { [key: string]: number } = {};
  const makeKey = ({ character, tier }: SkillT) => character + '-' + tier;
  const tierText = tierAlias ? (tier: TierT) => tierAlias[tier] : (tier: TierT) => tier as string;
  _.forEach(skills, i => {
    const key = makeKey(i);
    total[key] = total[key] || 0;
    total[key]++;
  });

  const result: { [id: number]: string } = {};
  _.sortBy(skills, 'sortOrder').forEach(i => {
    const key = makeKey(i);
    seen[key] = seen[key] || 0;
    seen[key]++;

    result[i.id] = makeAlias(i, tierText(i.tier), total[key], seen[key]);
  });

  return result;
}

export function makeSoulBreakAliases(
  soulBreaks: _.Dictionary<EnlirSoulBreak>,
  tierAlias?: { [s in EnlirSoulBreakTier]: string },
): { [id: number]: string } {
  const result = makeSkillAliases(
    soulBreaks,
    tierAlias,
    (sb: EnlirSoulBreak, tierText: string, total: number, seen: number) => {
      let alias = tierText;
      if (isBraveSoulBreak(sb)) {
        alias = 'B' + alias;
      } else if (total > 1 && sb.tier !== 'SB' && sb.tier !== 'RW' && sb.tier !== 'Shared') {
        // Skip numbers for unique SB tier - those are too old to be of interest.
        alias += seen;
      }
      return alias;
    },
  );

  // Special-case a few soul breaks.
  // Bartz - seemed like a good idea, but they're too big...
  /*
  const bsb = tierAlias ? tierAlias['BSB'] : 'USB';
  result[20400009] = bsb + '-wa';
  result[20400011] = bsb + '-e';
  result[20400012] = bsb + '-wi';
  result[20400013] = bsb + '-f';
  */
  // Onion Knight
  const usb = tierAlias ? tierAlias['USB'] : 'USB';
  result[22460006] = 'm-' + usb;
  result[22460007] = 'p-' + usb;

  return result;
}

export function makeLegendMateriaAliases(
  legendMateria: _.Dictionary<EnlirLegendMateria>,
): { [id: number]: string } {
  const total: { [key: string]: number } = {};
  const seen: { [key: string]: number } = {};
  const makeKey = ({ character, tier }: EnlirLegendMateria) => character + (tier || '');
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
    if (lm.tier) {
      alias = lm.tier;
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

export function makeLimitBreakAliases(
  limitBreaks: _.Dictionary<EnlirLimitBreak>,
  tierAlias?: { [s in EnlirLimitBreakTier]: string },
): { [id: number]: string } {
  return makeSkillAliases(
    limitBreaks,
    tierAlias,
    (lb: EnlirLimitBreak, tierText: string, total: number, seen: number) => {
      let alias = tierText;
      if (total > 1) {
        alias += seen;
      }
      return alias;
    },
  );
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

/**
 * Checks whether the given element property is "truly" elemental (not purely
 * non-elemental).
 */
export function isNonElemental(element: EnlirElement[]) {
  return element.length === 1 && element[0] === 'NE';
}

export function getNormalSBPoints(ability: EnlirAbility): number {
  const isFast = ability.time && ability.time <= 1.2;
  const isElemental = ability.element && ability.element.length && !isNonElemental(ability.element);
  const checkSpeed = isFast ? normalSBPoints.fast : normalSBPoints;
  const checkElemental = isElemental ? checkSpeed.elemental : checkSpeed.nonElemental;
  return checkElemental[ability.rarity];
}

export function isNat(skill: EnlirSkill): boolean {
  return (
    skill.type === 'NAT' &&
    skill.formula !== null &&
    skill.formula !== 'Hybrid' &&
    !(skill.typeDetails && skill.typeDetails.length === 2)
  );
}

export function hasSkillType(skill: EnlirGenericSkill, type: EnlirSkillType): boolean {
  return (
    skill.type === type || (skill.typeDetails != null && skill.typeDetails.indexOf(type) !== -1)
  );
}
