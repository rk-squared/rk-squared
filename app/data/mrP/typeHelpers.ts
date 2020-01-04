import { arrayify } from '../../utils/typeUtils';
import {
  EnlirBurstCommand,
  EnlirElement,
  EnlirSchool,
  EnlirSynchroCommand,
  isEnlirElement,
  isEnlirSchool,
} from '../enlir';
import * as common from './commonTypes';
import { andOrList } from './util';

export interface DescribeOptions {
  abbreviate: boolean;
  abbreviateDamageType: boolean;
  showNoMiss: boolean;
  includeSchool: boolean;
  includeSbPoints: boolean;

  prereqStatus: string | undefined;
  burstCommands: EnlirBurstCommand[] | undefined;
  synchroCommands: EnlirSynchroCommand[] | undefined;
}

export function getDescribeOptionsWithDefaults(options: Partial<DescribeOptions>): DescribeOptions {
  return {
    abbreviate: false,
    abbreviateDamageType: false,
    showNoMiss: true,
    includeSchool: true,
    includeSbPoints: true,
    prereqStatus: undefined,
    burstCommands: undefined,
    synchroCommands: undefined,
    ...options,
  };
}

export interface XRegExpNamedGroups {
  [groupName: string]: string;
}

export const SB_BAR_SIZE = 250;

export type MrPDamageType = 'phys' | 'white' | 'magic' | '?';

export const damageTypeAbbreviation = (damageType: MrPDamageType) => damageType[0];

const elementShortName: { [element: string]: string } = {
  lightning: 'lgt',
  ne: 'non',
  poison: 'bio',
};

const elementAbbreviation: { [element: string]: string } = {
  water: 'wa',
  wind: 'wi',
  poison: 'b',
};

const schoolShortName: { [school in EnlirSchool]?: string } = {
  'Black Magic': 'B.Mag',
  'White Magic': 'W.Mag',
  Summoning: 'Summon',
};

const shortAliases: { [s: string]: string } = {
  jump: 'jump',
  physical: 'phys',

  // Note the oddity: 'NE' as shown as an EnlirElement gets changed to 'non',
  // while 'Non-Elemental' in effect text gets changed to 'non-elem.'  (E.g.,
  // '1.1x non-elem dmg').
  'non-elemental': 'non-elem',
};

export function getElementShortName(element: EnlirElement | EnlirElement[]): string {
  element = arrayify(element);
  return element.map(i => elementShortName[i.toLowerCase()] || i.toLowerCase()).join('+');
}

export function getElementAbbreviation(element: EnlirElement | EnlirElement[]): string {
  element = arrayify(element);
  return element.map(i => elementAbbreviation[i.toLowerCase()] || i[0].toLowerCase()).join('+');
}

export function getSchoolShortName(school: EnlirSchool): string {
  return schoolShortName[school] || school;
}

export function getShortName(s: string): string {
  return isEnlirElement(s)
    ? getElementShortName(s)
    : isEnlirSchool(s)
    ? getSchoolShortName(s)
    : shortAliases[s.toLowerCase()] || s;
}

export function getAbbreviation(s: string): string {
  return isEnlirElement(s)
    ? getElementAbbreviation(s)
    : isEnlirSchool(s)
    ? getSchoolShortName(s)
    : s;
}

export function appendElement(
  element: EnlirElement[] | null,
  f: (element: EnlirElement[]) => string,
): string {
  return element && element.length ? ' ' + f(element) : '';
}

export function formatSchoolOrAbilityList(list: string | string[]): string {
  if (!Array.isArray(list)) {
    list = list.split(andOrList);
  }
  return (
    list
      .map(getShortName)
      .join('/')
      // Hack: Special-case the list of all elements, as observed in Ovelia's
      // and Relm's LM2 and the Elemental Boost status effect.
      .replace('fire/ice/lgt/earth/wind/water/holy/dark/bio', 'elem')
  );
}

/**
 * Handles a short name request that possibly is two parts together - e.g.,
 * "White Magic" is one part, but "Ice Spellblade" is two.
 */
export function getShortNameWithSpaces(s: string): string {
  // Hack: Effects like 'Fire or Ice Spellblade' are ambiguous: is it
  // '(Fire) || (Ice Spellblade)', or '(Fire || Ice) Spellblade'?  Check
  // for both cases - shorter means we found an abbreviation.
  const result = getShortName(s);
  if (s.indexOf(' ') !== -1) {
    const splitCandidate = s
      .split(' ')
      .map(getShortName)
      .join(' ');
    if (splitCandidate.length <= result.length) {
      return splitCandidate;
    }
  }
  return result;
}

export const whoText: { [w in common.Who]: string } = {
  self: 'self',
  target: 'target',
  enemies: 'AoE',
  sameRow: 'same row',
  frontRow: 'front row',
  backRow: 'back row',
  party: 'party',
  lowestHpAlly: 'ally',
  allyWithoutStatus: 'ally',
  allyWithNegativeStatus: 'ally',
  allyWithKO: 'ally',
  ally: 'ally',
};
