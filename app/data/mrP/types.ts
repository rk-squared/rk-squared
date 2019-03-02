import { arrayify } from '../../utils/typeUtils';
import { EnlirElement, EnlirSchool, isEnlirElement, isEnlirSchool } from '../enlir';
import { andOrList } from './util';

export interface XRegExpNamedGroups {
  [groupName: string]: string | undefined;
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
  Jump: 'jump',
};

const middleAliases: { [element: string]: string } = {
  'non-elemental': 'non-elem',
  physical: 'phys',
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
    : shortAliases[s] || s;
}

/**
 * Gets a "middle-length" name - normally the same as the short name that we
 * use for attack elements, but not always.  In practice, we use this so that
 * we can have text like '1.1x non-elem dmg' instead of '1.1x non dmg', for
 * cases where Enlir shows text as "Non-Elemental" instead of its actual
 * element abbreviation of "NE," while still showing non-elemental attacks as
 * 'non'.
 */
export function getMiddleName(s: string): string {
  return middleAliases[s.toLowerCase()] || getShortName(s);
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

export function formatSchoolOrAbilityList(list: string): string {
  return list
    .split(andOrList)
    .map(getShortName)
    .join('/');
}

export function formatMediumList(list: string): string {
  return list
    .split(andOrList)
    .map(getMiddleName)
    .join('/');
}
