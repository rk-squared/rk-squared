import { allEnlirElements, allEnlirSchools } from '../enlir';
import { getElementShortName, getSchoolShortName } from './types';
import {
  lowerCaseFirst,
  numberWithCommas,
  percentToMultiplier,
  toMrPFixed,
  toMrPGeneral,
  toMrPKilo,
} from './util';

export const enlirRankBoost = 'deal 5/10/15/20/30% more damage at ability rank 1/2/3/4/5';
export const enlirRankBoostRe = /(.*) (abilities|attacks) deal 5\/10\/15\/20\/30% more damage at ability rank 1\/2\/3\/4\/5/;

export const rankBoostAlias = (s: string) => `1.05-1.1-1.15-1.2-1.3x ${s} dmg @ rank 1-5`;
export const doubleAlias = (s: string) => `double ${s} (uses extra hone)`;
export const sbPointsAlias = (s: string) => `+${s} SB pts`;

export const formatRandomEther = (amount: string) => 'refill ' + amount + ' random abil. use';
export const formatSmartEther = (amount: string, type: string | undefined) =>
  'refill ' + amount + ' ' + (type ? type + ' ' : '') + 'abil. use';

/**
 * Mappings from Enlir status names or status effect names to MrP names.
 */
export interface AliasMap {
  /**
   * Simple names (no embedded numbers)
   */
  simple: { [s: string]: string };

  /**
   * Names with embedded numbers
   */
  numbered: { [s: string]: string | [string, (value: string) => string] };
}

/**
 * Enlir status aliases
 */
export const statusAlias: AliasMap = {
  simple: {
    Astra: 'Status blink 1',

    'Cast speed *2': 'fastcast',
    'Quick Cast': 'fastcast',
    'High Quick Cast': 'hi fastcast',
    'Magical Quick Cast': 'fastzap',
    'Magical High Quick Cast': 'hi fastzap',

    'Low Regen': 'Regen (lo)',
    'Medium Regen': 'Regen (med)',
    'High Regen': 'Regen (hi)',

    'Last Stand': 'Last stand',
    'Radiant Shield: 100%': 'Reflect Dmg',

    'High Retaliate': 'Retaliate @p1.2',

    'Instant KO': 'KO',

    'No Air Time': 'no air time',
    'Heavy Charge Booster': '+1 to all Heavy Charge gains',

    Sentinel: 'taunt PHY/BLK, +200% DEF',
    Runic: 'taunt & absorb BLK',
    'High Runic': 'taunt & absorb BLK/WHT',
    'Unyielding Fist': 'immune atks/status/heal',
    'Haurchefant Cover': 'if in front, 100% cover PHY,BLK,WHT,SUM,BLU vs back row, taking 0.5x dmg',

    // Nonstandard alternatives.  See enlirStatusAltName.
    'Cast Speed *999': 'instacast',
    'B. M.': 'Burst Mode',

    // Aliases of numbered statuses, minus the numbers, for use by status
    // threshold code.  We could instead try to slash-process the status
    // thresholds, but that seems needlessly complicated.
    'Magical Blink': 'Magic blink',
    'Physical Blink': 'Phys blink',
  },

  numbered: {
    'Quick Cast {X}': 'fastcast {X}',
    'High Quick Cast {X}': 'hi fastcast {X}',
    'Instant Cast {X}': 'instacast {X}',
    'Magical Quick Cast {X}': 'fastzap {X}',
    'Magical High Quick Cast {X}': 'hi fastzap {X}',
    'Magical Instant Cast {X}': 'instazap {X}',
    'Physical Quick Cast {X}': 'phys fastcast {X}',
    'Physical High Quick Cast {X}': 'phys hi fastcast {X}',
    'Physical Instant Cast {X}': 'phys instacast {X}',

    'Magical Blink {X}': 'Magic blink {X}',
    'Physical Blink {X}': 'Phys blink {X}',
    'Dual Blink {X}': 'PM blink {X}',

    'Stoneskin: {X}%': 'Negate dmg {X}%',
    'Reraise: {X}%': 'Reraise {X}%',

    'Critical Chance {X}%': 'crit ={X}%',
    'Critical Damage +{X}%': '+{X}% crit dmg',
    // The FFRK Community spreadsheet has both forms.  This is probably an error.
    '{X}% Critical': 'crit ={X}%',
    'Critical {X}%': 'crit ={X}%',

    '{X}% Damage Reduction Barrier 1': '{X}% Dmg barrier 1',
    '{X}% Damage Reduction Barrier 2': '{X}% Dmg barrier 2',
    '{X}% Damage Reduction Barrier 3': '{X}% Dmg barrier 3',

    'Doom: {X}': 'Doom {X}s',

    'Ingredients +{X}': '+{X} ingredients',
    'Ingredients {X}': '{X} ingredients',

    // Aliases with more complex formatting.
    // TODO: We could improve our handling of '?' values by not blindly converting to numbers here
    'HP Stock ({X})': ['Autoheal {X}', i => toMrPKilo(+i)],
    'Damage Cap {X}': ['dmg cap={X}', i => numberWithCommas(+i)],
    'Status Chance {X}%': ['{X}x status chance', i => toMrPFixed(percentToMultiplier(+i))],

    // Manually expand non-standard stat buffs to give their effects instead -
    // this is easier than trying to programmatically identify a few statuses as
    // needing expansion.
    'Crash {X}%': '{X}% DEF/RES',

    // Nonstandard alternatives.  See enlirStatusAltName.
    'IC{X}': 'instacast {X}',

    // Soul Break Gauge +X is a real status.  X SB points is not.
    'Soul Break Gauge +{X}': sbPointsAlias('{X}'),
    '{X} SB points': sbPointsAlias('{X}'),
  },
};

function addCastSpeedAliases<T>(
  aliases: { [s: string]: string | T },
  fromType: string,
  toType: string,
  suffix: string = '',
) {
  const castSpeedAliases = [
    ['Quick Cast', 'fastcast'],
    ['High Quick Cast', 'hi fastcast'],
    ['Instant Cast', 'instacast'],
  ];
  for (const [from, to] of castSpeedAliases) {
    aliases[fromType + ' ' + from + suffix] = toType + ' ' + to + suffix;
  }
}

for (const i of allEnlirElements) {
  statusAlias.simple[`Attach ${i}`] = `${getElementShortName(i)} infuse`;
  statusAlias.simple[`Attach ${i} Stacking`] = `${getElementShortName(i)} infuse stacking`;

  statusAlias.simple[`Minor Resist ${i}`] = `-10% ${getElementShortName(i)} vuln.`;
  statusAlias.simple[`Medium Resist ${i}`] = `-20% ${getElementShortName(i)} vuln.`;
  statusAlias.simple[`Major Resist ${i}`] = `-30% ${getElementShortName(i)} vuln.`;

  statusAlias.simple[`Minor Buff ${i}`] = `+10% ${getElementShortName(i)} dmg`;
  statusAlias.simple[`Medium Buff ${i}`] = `+20% ${getElementShortName(i)} dmg`;
  statusAlias.simple[`Major Buff ${i}`] = `+30% ${getElementShortName(i)} dmg`;

  statusAlias.simple[`Minor Debuff ${i}`] = `-10% ${getElementShortName(i)} dmg`;
  statusAlias.simple[`Medium Debuff ${i}`] = `-20% ${getElementShortName(i)} dmg`;
  statusAlias.simple[`Major Debuff ${i}`] = `-30% ${getElementShortName(i)} dmg`;

  statusAlias.simple[`Minor Imperil ${i}`] = `+10% ${getElementShortName(i)} vuln.`;
  statusAlias.simple[`Medium Imperil ${i}`] = `+20% ${getElementShortName(i)} vuln.`;
  statusAlias.simple[`Major Imperil ${i}`] = `+30% ${getElementShortName(i)} vuln.`;
}
for (const i of allEnlirSchools) {
  statusAlias.simple[`${i} +30% Boost`] = `1.3x ${getSchoolShortName(i)} dmg`;
  statusAlias.simple[`${i} Quick Cast`] = `${getSchoolShortName(i)} fastcast`;
  statusAlias.simple[`${i} Quick Cast: Alternative`] = `${getSchoolShortName(i)} fastcast`;
  statusAlias.simple[`${i} Instant Cast`] = `${getSchoolShortName(i)} instacast`;
  statusAlias.simple[`${i} Rank Boost`] = rankBoostAlias(i);
  statusAlias.simple[`${i} Double`] = doubleAlias(getSchoolShortName(i));
  addCastSpeedAliases(statusAlias.simple, i, getSchoolShortName(i));
}
addCastSpeedAliases(statusAlias.simple, 'Jump', 'jump');

for (const i of allEnlirElements) {
  statusAlias.numbered[`Imperil ${i} {X}%`] = `+{X}% ${getElementShortName(i)} vuln.`;
  statusAlias.numbered[`${i} Stoneskin: {X}%`] =
    'Negate dmg {X}% (' + getElementShortName(i) + ' only)';
  statusAlias.numbered[`${i} Radiant Shield: {X}%`] =
    'Reflect Dmg {X}% as ' + getElementShortName(i);
}
for (const i of allEnlirSchools) {
  addCastSpeedAliases(statusAlias.numbered, i, getSchoolShortName(i), ' {X}');
}
addCastSpeedAliases(statusAlias.numbered, 'Jump', 'jump', ' {X}');

/**
 * Aliases for Enlir status effects
 */
export const effectAlias: AliasMap = {
  simple: {
    'cast speed x2.00': 'fastcast',
    'cast speed x3.00': 'hi fastcast',
    'cast speed x9999999': 'instacast',
    'cast speed x2.00 for magical damage': 'fastzap',
    'cast speed x3.00 for magical damage': 'hi fastzap',
  },
  numbered: {
    'critical chance ={X}%': 'crit ={X}%',

    'cast speed x{X}': '{X}x cast',
    'cast speed x{X} for magical damage': '{X}x zap',
  },
};

function addCastSpeedEffectAliases(fromType: string, toType: string) {
  effectAlias.simple[`${lowerCaseFirst(fromType)} cast speed x2.00`] = toType + ' fastcast';
  effectAlias.simple[`cast speed x2.00 for ${fromType} abilities`] = toType + ' fastcast';
  effectAlias.simple[`${lowerCaseFirst(fromType)} cast speed x3.00`] = toType + ' hi fastcast';
  effectAlias.simple[`cast speed x3.00 for ${fromType} abilities`] = toType + ' hi fastcast';
  effectAlias.simple[`cast speed x9999999 for ${fromType} abilities`] = toType + ' instacast';
}
for (const i of allEnlirSchools) {
  addCastSpeedEffectAliases(i, getSchoolShortName(i));
}
addCastSpeedEffectAliases('Jump', 'jump');

export function splitNumbered(s: string): [string, string] | [null, null] {
  const m = s.match(/(-?[0-9.]+\??|\?)/);
  if (!m) {
    return [null, null];
  }
  const text = s.replace(/-?[0-9.]+\??|\?/, '{X}');
  return [text, m[1]];
}

export function resolveNumbered(
  text: string | [string, (value: string) => string],
  numberValue: string,
): string {
  let formatter = toMrPGeneral;
  if (Array.isArray(text)) {
    [text, formatter] = text;
  }
  return text.replace('{X}', formatter(numberValue));
}

interface ResolveOptions {
  /**
   * We normally prefer simple aliases over numbered aliases, so that we can
   * override generic numbers for common cases like fastcast.  However, there
   * are times such as dealing with stacking statuses where it's nice to keep
   * everything generic, so that it can be slash-merged.
   */
  preferNumbered: boolean;
}
const defaultResolveOptions: ResolveOptions = {
  preferNumbered: false,
};

export function resolveAlias(
  s: string,
  { simple, numbered }: AliasMap,
  options: Partial<ResolveOptions> = {},
): string | null {
  const opt = {
    ...defaultResolveOptions,
    ...options,
  };

  if (!opt.preferNumbered && simple[s]) {
    return simple[s];
  }

  const [text, numberValue] = splitNumbered(s);
  if (text && numberValue && numbered[text]) {
    return resolveNumbered(numbered[text], numberValue);
  }

  if (opt.preferNumbered && simple[s]) {
    return simple[s];
  }

  return null;
}

export const resolveStatusAlias = (status: string, options: Partial<ResolveOptions> = {}) =>
  resolveAlias(status, statusAlias, options);
export const resolveEffectAlias = (effect: string, options: Partial<ResolveOptions> = {}) =>
  resolveAlias(lowerCaseFirst(effect), effectAlias, options);
