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
  // TODO: Now that we have a proper parser, this code path may no longer be used.
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

  // Special case: "non" by itself looks bad.
  const nonElem: EnlirElement = 'NE';
  if (list.length === 1 && list[0] === nonElem) {
    return 'non-elem';
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
