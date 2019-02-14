import { EnlirElement, EnlirSchool } from '../enlir';

export const damageTypeAbbreviation = (damageType: 'phys' | 'white' | 'magic') => damageType[0];

const elementShortName: { [element: string]: string } = {
  lightning: 'lgt',
  ne: 'non',
};

const elementAbbreviation: { [element: string]: string } = {
  water: 'wa',
  wind: 'wi',
};

const schoolAbbreviation: { [school in EnlirSchool]?: string } = {
  'Black Magic': 'B.Mag',
};

export function getElementShortName(element: EnlirElement[]): string {
  return element.map(i => elementShortName[i.toLowerCase()] || i.toLowerCase()).join('+');
}

export function getElementAbbreviation(element: EnlirElement[]): string {
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
