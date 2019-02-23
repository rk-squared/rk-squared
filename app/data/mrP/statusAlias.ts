import { allEnlirElements, allEnlirSchools } from '../enlir';
import { getElementShortName, getSchoolShortName } from './types';

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
    'High Quick Cast': 'hi fastcast',

    'Low Regen': 'Regen (lo)',
    'Medium Regen': 'Regen (med)',
    'High Regen': 'Regen (hi)',

    'Last Stand': 'Last stand',
    'Radiant Shield: 100%': 'Reflect Dmg',

    'High Retaliate': 'Retaliate @p1.2',

    'Instant KO': 'KO',

    Sentinel: 'taunt PHY/BLK',
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

    'Critical Chance {X}%': 'crit ={X}%',
    // The FFRK Community spreadsheet has both forms.  This is probably an error.
    '{X}% Critical': 'crit ={X}%',
    'Critical {X}%': 'crit ={X}%',

    'Reraise: {X}%': 'Reraise {X}%',

    '{X}% Damage Reduction Barrier 1': '{X}% Dmg barrier 1',
    '{X}% Damage Reduction Barrier 2': '{X}% Dmg barrier 2',
    '{X}% Damage Reduction Barrier 3': '{X}% Dmg barrier 3',

    // Manually expand non-standard stat buffs to give their effects instead -
    // this is easier than trying to programmatically identify a few statuses as
    // needing expansion.
    'Crash {X}%': '{X}% DEF/RES',
  },
};

for (const i of allEnlirElements) {
  statusAlias.simple[`Minor Resist ${i}`] = `-10% ${getElementShortName(i)} vuln.`;
  statusAlias.simple[`Minor Buff ${i}`] = `+10% ${getElementShortName(i)} dmg`;
}
for (const i of allEnlirSchools) {
  statusAlias.simple[`${i} +30% Boost`] = `1.3x ${getSchoolShortName(i)} dmg`;
  statusAlias.simple[`${i} High Quick Cast`] = `${getSchoolShortName(i)} hi fastcast`;
}

for (const i of allEnlirElements) {
  statusAlias.numbered[`Imperil ${i} {X}%`] = `+{X}% ${getElementShortName(i)} vuln.`;
  statusAlias.numbered[`${i} Stoneskin: {X}%`] =
    'Negate dmg {X}% (' + getElementShortName(i) + ' only)';
  statusAlias.numbered[`${i} Radiant Shield: {X}%`] =
    'Reflect Dmg {X}% as ' + getElementShortName(i);
}
for (const i of allEnlirSchools) {
  for (const j of ['Quick Cast {X}', 'High Quick Cast {X}', 'Instant Cast {x}']) {
    statusAlias.numbered[i + ' ' + j] = getSchoolShortName(i) + ' ' + statusAlias.numbered[j];
  }
}

/**
 * Aliases for Enlir status effects
 */
export const effectAlias: AliasMap = {
  simple: {
    'cast speed x2.00': 'fastcast',
  },
  numbered: {
    'Critical chance ={X}%': 'crit ={X}%',
  },
};

export function resolveAlias(s: string, { simple, numbered }: AliasMap): string | null {
  let m: RegExpMatchArray | null;

  if (simple[s]) {
    return simple[s];
  } else if ((m = s.match(/(-?\d+)/))) {
    const text = s.replace(/-?\d+/, '{X}');
    if (numbered[text]) {
      return numbered[text].replace('{X}', m[1]);
    }
  }

  return null;
}
