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

export interface EnlirCharacter {
  realm: string;
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
  realm: string;
  character: string;
  name: string;
  effect: string;
  master: string | null;
  relic: string | null;
  nameJp: string;
  id: number;
  gl: boolean;
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

export interface EnlirRelic {
  name: string;
  realm: string;
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
  effects: string; // TODO: null is actually permitted, but it complicates code a lot
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
  characters: require('./enlir/characters.json') as EnlirCharacter[],
  legendMateria: require('./enlir/legendMateria.json') as EnlirLegendMateria[],
  magicite: require('./enlir/magicite.json'),
  otherSkills: require('./enlir/otherSkills.json') as EnlirOtherSkill[],
  recordMateria: require('./enlir/recordMateria.json') as EnlirRecordMateria[],
  relics: require('./enlir/relics.json') as EnlirRelic[],
  soulBreaks: require('./enlir/soulBreaks.json') as EnlirSoulBreak[],
  status: require('./enlir/status.json') as EnlirStatus[],
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

function makeCharacterMap<T extends { character: string }>(items: T[]): CharacterMap<T> {
  const result: CharacterMap<T> = {};
  for (const i of items) {
    result[i.character] = result[i.character] || [];
    result[i.character].push(i);
  }
  return result;
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
function makeRelicMap<T extends { character: string; name: string }>(
  relics: EnlirRelic[],
  prop: keyof EnlirRelic,
  items: T[],
): { [relicId: number]: T } {
  const result: { [relicId: number]: T } = {};
  const indexedItems = _.keyBy(items, i => i.character + ':' + i.name);
  for (const i of relics) {
    if (i[prop] && i.character) {
      const found = indexedItems[i.character + ':' + i[prop]];
      if (found) {
        result[i.id] = found;
      }
    }
  }
  return result;
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
  magicites: _.keyBy(rawData.magicite, 'id'),

  // NOTE: Other Skills' names are not unique, and they often lack IDs, so
  // expose the raw array.
  otherSkills: rawData.otherSkills,
  otherSkillsByName: _.keyBy(rawData.otherSkills, 'name'),
  otherSkillsBySource: _.keyBy(rawData.otherSkills, i => otherSkillSourceKey(i.source, i.name)),

  relics: _.keyBy(rawData.relics, 'id'),
  recordMateria: _.keyBy(rawData.recordMateria, 'id'),
  soulBreaks: _.keyBy(rawData.soulBreaks, 'id'),
  soulBreaksByCharacter: makeCharacterMap(rawData.soulBreaks),
  statusByName: _.keyBy(rawData.status, 'name'),
  relicSoulBreaks: makeRelicMap(rawData.relics, 'soulBreak', rawData.soulBreaks),
  relicLegendMateria: makeRelicMap(rawData.relics, 'legendMateria', rawData.legendMateria),
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

  // Sarah's USB3 is pure madness.  I have no shame in whatever hacks it takes
  // to process it.
  applyPatch(
    enlir.soulBreaks,
    '22300009',
    aria =>
      aria.effects ===
      'Restores HP (85), grants Regenga, grants Quick Cast to the user. Grants Minor Buff Holy/Dark if Warrior of Light/Garland is in the party, grants Medium Buff Holy and Medium Buff Dark if both are in the party',
    aria => {
      aria.effects =
        'Restores HP (85), grants Regenga, grants Quick Cast to the user, ' +
        'grants Minor Buff Holy if Warrior of Light is in the party, ' +
        'grants Minor Buff Dark if Garland is in the party, ' +
        'grants Medium Buff Holy/Dark if Warrior of Light & Garland are in the party';
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

  // Abbreviations - I don't know if it's best to update Enlir to remove these
  // or not.  Where possible, we update our code to handle abbreviations, but
  // some are too hard.
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
  applyPatch(
    enlir.soulBreaks,
    '20660006',
    windUltra =>
      windUltra.effects ===
      'Ten random attacks (0.68 each), Imperil Wind 20% for 25 seconds, grants ATK and DEF +30% for 25 seconds, Quick Cast 1 and Wind Quick Cycle to the user',
    windUltra => {
      // Insert 'causes' - same as above
      windUltra.effects =
        'Ten random attacks (0.68 each), causes Imperil Wind 20% for 25 seconds, grants ATK and DEF +30% for 25 seconds, Quick Cast 1 and Wind Quick Cycle to the user';
    },
  );

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

export function isBraveCommand(skill: EnlirSkill): skill is EnlirBraveCommand {
  return 'brave' in skill;
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
  _.sortBy(soulBreaks, 'id').forEach(sb => {
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
