import * as _ from 'lodash';
import { logger } from '../utils/logger';

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

// FIXME: Interfaces for remaining Enlir types

export type EnlirStat = 'atk' | 'def' | 'mag' | 'res' | 'mnd' | 'acc' | 'eva';
export const allEnlirStats: EnlirStat[] = ['atk', 'def', 'mag', 'res', 'mnd', 'acc', 'eva'];

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
  realm: string;
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
 *
 * NOTE: Does not include shared soul breaks.
 */
function makeRelicMap<T extends { character: string | null; name: string; relic: string | null }>(
  relics: EnlirRelic[],
  prop: keyof EnlirRelic,
  items: T[],
): { [relicId: number]: T } {
  const result: { [relicId: number]: T } = {};
  const indexedItems = _.keyBy(items, i => (i.character || '') + ':' + i.name);
  for (const i of relics) {
    if (i[prop] && i.character) {
      const found = indexedItems[i.character + ':' + i[prop]];
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

  braveCommands: _.keyBy(rawData.braveCommands, 'id'),
  braveCommandsByCharacter: makeCommandsMap(rawData.braveCommands),

  burstCommands: _.keyBy(rawData.burstCommands, 'id'),
  burstCommandsByCharacter: makeCommandsMap(rawData.burstCommands),

  characters: _.keyBy(rawData.characters, 'id'),
  charactersByName: _.keyBy(rawData.characters, 'name'),

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

  synchroCommands: _.keyBy(rawData.synchroCommands, 'id'),
  synchroCommandsByCharacter: makeCommandsMap(rawData.synchroCommands),

  relicSoulBreaks: makeRelicMap(rawData.relics, 'soulBreak', rawData.soulBreaks),
  relicLegendMateria: makeRelicMap(rawData.relics, 'legendMateria', rawData.legendMateria),
  sharedSoulBreaks: getSharedSoulBreaks(rawData.relics, rawData.soulBreaks),
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
 * Inserts 'causes' for soul breaks that cause imperils.  With 'causes' in the
 * original text, it's too big to fit on one line.  Ideally, we'd make our
 * parser smart enough to handle this, but too much code keys off of it.
 */
function applyCausesImperilPatch<T extends { effects: string }>(
  lookup: { [s: string]: T },
  name: string,
) {
  applyPatch(
    lookup,
    name,
    item => item.effects.match(/\d+ each\), Imperil /) != null,
    item => {
      item.effects = item.effects.replace(/(\d+ each\)), Imperil /, m => m + ', causes Imperil ');
    },
  );
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
        'Additional ten single attacks (0.50 each), followed by one single attack (5.00) capped at 99999, if 240001 damage was dealt during the status.';
    },
  );

  // Update Enna to resemble Gladiolus and Squall.  TODO: More consistency
  applyPatch(
    enlir.statusByName,
    'God of Creation Mode',
    mode => mode.effects === 'Casts Whimsical Crash after using 3 Earth attacks',
    mode => {
      mode.effects = mode.effects + ', removed after triggering';
    },
  );
  applyPatch(
    enlir.otherSkillsByName,
    'Whimsical Crash',
    crash =>
      crash.effects ===
      '3/5/15 single attacks (1.20 each) if the user dealt 0/72001/240001 damage ' +
        'with Earth attacks during the status, removes God of Creation Mode. ' +
        'Additional one single attack (17.30) capped at 99999 if the final damage threshold was met',
    crash => {
      crash.effects =
        '3/5/15 single attacks (1.20 each) if 0/72001/240001 damage was dealt during the status. ' +
        'Additional one single attack (17.30) capped at 99999 if 240001 damage was dealt during the status';
    },
  );

  // Sarah's USB3 and Xezat's AASB are pure madness.  I have no shame in
  // whatever hacks it takes to process them.
  applyPatch(
    enlir.soulBreaks,
    '22300009',
    aria =>
      aria.effects ===
      'Restores HP (85), grants Regenga, grants Quick Cast to the user, ' +
        'grants Minor Buff Holy/Dark if Warrior of Light/Garland is in the party, ' +
        'grants Medium Buff Holy and Medium Buff Dark if both are in the party',
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
    '23160005',
    strike =>
      strike.effects ===
      'Fifteen single attacks (0.60 each), grants Major Buff Ice, Major Buff Earth, Major Buff Lightning, Awoken Spellblade, Damage Cap +10000 to the user, grants 50% Critical to all allies, grants High Quick Cast 1/High Quick Cast 2/Extended 100% Critical, Critical Damage +50% and High Quick Cast 2 if 1/2/3 of Kelger, Galuf or Dorgann are alive to all allies',
    strike => {
      strike.effects =
        'Fifteen single attacks (0.60 each), grants Major Buff Ice, Major Buff Earth, Major Buff Lightning, Awoken Spellblade, Damage Cap +10000 to the user, grants 50% Critical to all allies, grants High Quick Cast 1/2/2 to all allies if 1/2/3 of Kelger/Galuf/Dorgann are alive, grants Extended 100% Critical and Critical Damage +50% to all allies if Kelger & Galuf & Dorgann are alive';
    },
  );

  // A purely conditional attack - we may not even have an Enlir format for
  // this.  The format chosen by the spreadsheet is probably actually intended
  // for threshold attacks, but we'll make it work.
  applyPatch(
    enlir.otherSkillsByName,
    'Awoken Runic Blade',
    runicAwakening =>
      runicAwakening.effects ===
      'Grants Magical Blink 2 to the user, five single attacks (0.52 each) if user has Magical Blink 1/2',
    runicAwakening => {
      runicAwakening.effects =
        'Five single attacks (0.52 each) if user has Magical Blink 1/2, grants Magical Blink 2 to the user';
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
      // Hack: The status name is actually "Radiant Shield:" - but leave it
      // without the colon so that our default 100% alias isn't invoked.
      desperateMadness.effects =
        'Four single attacks (0.56 each), grants Desperate Madness and Radiant Shield 100/125/150/175/200/225/250/275/300% to the user scaling with uses';
    },
  );
  applyCausesImperilPatch(enlir.soulBreaks, '20660006'); // Zack - Climhazzard Xeno
  applyCausesImperilPatch(enlir.soulBreaks, '22100007'); // Laguna - Ragnarok Buster.  TODO - also missing stat buff duration
  applyCausesImperilPatch(enlir.soulBreaks, '22810004'); // Nine - Whirling Lance

  // Status cleanups.  These too should be fixed up.
  applyPatch(
    enlir.statusByName,
    'True Greased Lightning Mode',
    mode => mode.effects === 'Grants True Greased Lightning 0/1/2/3 after using a Monk ability',
    mode => {
      // Adequately covered by True Greased Lightning 0/1/2/3
      mode.effects = '';
    },
  );
  for (let i = 0; i <= 3; i++) {
    applyPatch(
      enlir.statusByName,
      `True Greased Lightning ${i}`,
      mode => mode.effects.match(/[Gg]rants True Greased Lightning (\d+),/) != null,
      mode => {
        mode.effects = mode.effects.replace(
          /([Gg]rants) True Greased Lightning (\d+),/,
          (match, p1, p2) => `${p1} True Greased Lightning ${p2} after using a Monk ability,`,
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
      'Grants 50% Critical and Haste, ATK and DEF +30% for 25 seconds, grants Awoken Scholar and Unraveled History Follow-Up to the user',
    tyroAasb => {
      tyroAasb.effects =
        'Grants 50% Critical and Haste, ATK and DEF +30% for 25 seconds, grants Awoken Scholar, Awoken Scholar Critical Chance, and Unraveled History Follow-Up to the user';
    },
  );
  applyPatch(
    enlir.statusByName,
    'Awoken Scholar',
    scholar =>
      scholar.effects ===
      "Support abilities don't consume uses, cast speed x2.00/2.25/2.50/2.75/3.00 for Support abilities at ability rank 1/2/3/4/5, grants Awoken Scholar Critical Chance to all allies",
    scholar => {
      scholar.effects =
        "Support abilities don't consume uses, cast speed x2.00-x3.00 for Support abilities at ability rank 1/2/3/4/5";
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

  // Make synchro commands resemble Squall-type BSBs.
  applyPatch(
    enlir.synchroCommands,
    '30547053',
    command =>
      command.effects ===
      'Six single attacks (0.90 each), grants Wind +50% Boost 1 and Mako Enhance level 1 to the user',
    command => (command.effects = 'Six single attacks (0.90 each), grants Wind +50% Boost 1'),
  );
  applyPatch(
    enlir.synchroCommands,
    '30547054',
    command =>
      command.effects ===
      'One single attack (6.00/8.00) if user has Mako Enhance level 0/1, capped at 99999, set Mako Enhance level to 0',
    command =>
      (command.effects =
        'One single attack (6.00/8.00), capped at 99999, scaling with Sonic Rush+ uses, reset'),
  );
  // FIXME: Correctly handle conditional Instant ATB 1
  applyPatch(
    enlir.synchroCommands,
    '30546020',
    command =>
      command.effects ===
      '5/10 single attacks (0.80 each) if user has Lightning Aura level 0/1, grants Instant ATB 1 to the user if user has Lightning Aura level 1, set Lightning Aura level to 0',
    command =>
      (command.effects = '5/10 single attacks (0.80 each) scaling with Lightning Howl uses, reset'),
  );
  applyPatch(
    enlir.synchroCommands,
    '30546022',
    command =>
      command.effects === 'Three single attacks (0.80 each), grants Lightning Aura to the user',
    command => (command.effects = 'Three single attacks (0.80 each)'),
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
  'Cast Speed *999': enlir.statusByName['Instant Cast 1'],

  // Radiant shield aliases - see statusAlias.ts's 'Radiant Shield {X}%'
  'Radiant Shield 100%': enlir.statusByName['Radiant Shield: 100%'],
  'Radiant Shield 125%': enlir.statusByName['Radiant Shield: 125%'],
  'Radiant Shield 150%': enlir.statusByName['Radiant Shield: 150%'],
  'Radiant Shield 175%': enlir.statusByName['Radiant Shield: 175%'],
  'Radiant Shield 200%': enlir.statusByName['Radiant Shield: 200%'],
  'Radiant Shield 225%': enlir.statusByName['Radiant Shield: 225%'],
  'Radiant Shield 250%': enlir.statusByName['Radiant Shield: 250%'],
  'Radiant Shield 275%': enlir.statusByName['Radiant Shield: 275%'],
  'Radiant Shield 300%': enlir.statusByName['Radiant Shield: 300%'],
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

export function isBraveCommand(skill: EnlirSkill): skill is EnlirBraveCommand {
  return 'brave' in skill;
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

/**
 * Gets estimated experience needed to master a soul break.  This is usually
 * 10,000 experience for unique soul breaks and 30,000 experience for
 * everything higher, but not always.
 */
export function getEstimatedRequiredSoulBreakExp(id: number) {
  if (enlir.soulBreaks[id] && enlir.soulBreaks[id].tier === 'SB') {
    return 10000;
  } else {
    return 30000;
  }
}
export const getRequiredLegendMateriaExp = _.constant(30000);
