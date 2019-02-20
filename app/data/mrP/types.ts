import { arrayify } from '../../utils/typeUtils';
import { EnlirElement, EnlirSchool, isEnlirElement, isEnlirSchool } from '../enlir';
import { andOrList } from './util';

export const SB_BAR_SIZE = 250;

export const damageTypeAbbreviation = (damageType: 'phys' | 'white' | 'magic') => damageType[0];

const elementShortName: { [element: string]: string } = {
  lightning: 'lgt',
  ne: 'non',
  poison: 'bio',
};

const elementAbbreviation: { [element: string]: string } = {
  water: 'wa',
  wind: 'wi',
};

const schoolShortName: { [school in EnlirSchool]?: string } = {
  'Black Magic': 'B.Mag',
  'White Magic': 'W.Mag',
  Summoning: 'Summon',
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
  return isEnlirElement(s) ? getElementShortName(s) : isEnlirSchool(s) ? getSchoolShortName(s) : s;
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
