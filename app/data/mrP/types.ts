import { arrayify } from '../../utils/typeUtils';
import { EnlirElement, EnlirSchool } from '../enlir';

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

const schoolAbbreviation: { [school in EnlirSchool]?: string } = {
  'Black Magic': 'B.Mag',
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

export function getSchoolAbbreviation(school: EnlirSchool): string {
  return schoolAbbreviation[school] || school;
}

export function appendElement(
  element: EnlirElement[] | null,
  f: (element: EnlirElement[]) => string,
): string {
  return element && element.length ? ' ' + f(element) : '';
}
