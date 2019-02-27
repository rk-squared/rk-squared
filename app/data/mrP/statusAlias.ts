import { allEnlirElements, allEnlirSchools } from '../enlir';
import { getElementShortName, getSchoolShortName } from './types';
import { lowerCaseFirst } from './util';

export const enlirRankBoost = 'deal 5/10/15/20/30% more damage at ability rank 1/2/3/4/5';
export const enlirRankBoostRe = /(.*) (abilities|attacks) deal 5\/10\/15\/20\/30% more damage at ability rank 1\/2\/3\/4\/5/;

const rankBoostAlias = (s: string) => `1.05-1.1-1.15-1.2-1.3x ${s} dmg @ ranks 1-5`;

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
  numbered: { [s: string]: string };
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

    Sentinel: 'taunt PHY/BLK',
    Runic: 'taunt & absorb BLK',
    'High Runic': 'taunt & absorb BLK/WHT',

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
    'Physical High Quick Cast {X}': 'phys hi fastcast {X}',

    'Magical Blink {X}': 'Magic blink {X}',
    'Physical Blink {X}': 'Phys blink {X}',

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

    // Manually expand non-standard stat buffs to give their effects instead -
    // this is easier than trying to programmatically identify a few statuses as
    // needing expansion.
    'Crash {X}%': '{X}% DEF/RES',

    // Nonstandard abbreviations, supported for convenience.
    'IC{X}': 'instacast {X}',

    // These are not real statuses.
    '{X} SB points': '+{X} SB pts',
  },
};

function addCastSpeedAliases(
  aliases: { [s: string]: string },
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
  statusAlias.simple[`Minor Resist ${i}`] = `-10% ${getElementShortName(i)} vuln.`;
  statusAlias.simple[`Medium Resist ${i}`] = `-20% ${getElementShortName(i)} vuln.`;
  statusAlias.simple[`Major Resist ${i}`] = `-30% ${getElementShortName(i)} vuln.`;

  statusAlias.simple[`Minor Buff ${i}`] = `+10% ${getElementShortName(i)} dmg`;
  statusAlias.simple[`Medium Buff ${i}`] = `+20% ${getElementShortName(i)} dmg`;
  statusAlias.simple[`Major Buff ${i}`] = `+30% ${getElementShortName(i)} dmg`;

  statusAlias.simple[`Minor Debuff ${i}`] = `-10% ${getElementShortName(i)} dmg`;
  statusAlias.simple[`Medium Debuff ${i}`] = `-20% ${getElementShortName(i)} dmg`;
  statusAlias.simple[`Major Debuff ${i}`] = `-30% ${getElementShortName(i)} dmg`;
}
for (const i of allEnlirSchools) {
  statusAlias.simple[`${i} +30% Boost`] = `1.3x ${getSchoolShortName(i)} dmg`;
  statusAlias.simple[`${i} Quick Cast`] = `${getSchoolShortName(i)} fastcast`;
  statusAlias.simple[`${i} Instant Cast`] = `${getSchoolShortName(i)} instacast`;
  statusAlias.simple[`${i} Rank Boost`] = rankBoostAlias(i);
  statusAlias.simple[`${i} Double`] = `double ${getSchoolShortName(i)} (uses extra hone)`;
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
    'cast speed x2.00 for magical damage': 'fastzap',
    'cast speed x3.00 for magical damage': 'hi fastzap',
  },
  numbered: {
    'critical chance ={X}%': 'crit ={X}%',

    'cast speed x{X}': '{X}x cast',
    'cast speed x{X} for magical damage': '{X}x zap',
  },
};
for (const i of allEnlirSchools) {
  effectAlias.simple[`${lowerCaseFirst(i)} cast speed x2.00`] = getSchoolShortName(i) + ' fastcast';
  effectAlias.simple[`cast speed x2.00 for ${i} abilities`] = getSchoolShortName(i) + ' fastcast';
  effectAlias.simple[`${lowerCaseFirst(i)} cast speed x3.00`] =
    getSchoolShortName(i) + ' hi fastcast';
  effectAlias.simple[`cast speed x3.00 for ${i} abilities`] =
    getSchoolShortName(i) + ' hi fastcast';
}

export function splitNumbered(s: string): [string, string] | [null, null] {
  const m = s.match(/(-?[0-9.]+)/);
  if (!m) {
    return [null, null];
  }
  const text = s.replace(/-?[0-9.]+/, '{X}');
  return [text, m[1]];
}

export function resolveNumbered(text: string, numberValue: string): string {
  return text.replace('{X}', numberValue);
}

export function resolveAlias(s: string, { simple, numbered }: AliasMap): string | null {
  if (simple[s]) {
    return simple[s];
  } else {
    const [text, numberValue] = splitNumbered(s);
    if (text && numberValue && numbered[text]) {
      return resolveNumbered(numbered[text], numberValue);
    }
  }

  return null;
}

export const resolveStatusAlias = (status: string) => resolveAlias(status, statusAlias);
export const resolveEffectAlias = (effect: string) =>
  resolveAlias(lowerCaseFirst(effect), effectAlias);
