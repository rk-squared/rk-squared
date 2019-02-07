import { enlir, EnlirSoulBreak } from './enlir';

const numbers: { [s: string]: number } = {
  one: 1,
  two: 2,
  three: 3,
  four: 4,
  five: 5,
  six: 6,
  seven: 7,
  eight: 8,
  nine: 9,
  ten: 10,
  eleven: 11,
  twelve: 12,
  thirteen: 13,
  fourteen: 14,
  fifteen: 15,
  sixteen: 16,
  seventeen: 17,
  eighteen: 18,
  nineteen: 19,
  twenty: 20,
  thirty: 30,
  forty: 40,
  fifty: 50,
  sixty: 60,
  seventy: 70,
  eighty: 80,
  ninety: 90,
};

const elementShortName: { [element: string]: string } = {
  Lightning: 'light',
  NE: 'non',
};

const elementAbbreviation: { [element: string]: string } = {
  Water: 'wa',
};

export function parseNumberString(s: string): number | null {
  let result = 0;
  for (const i of s.toLowerCase().split('-')) {
    if (numbers[i] == null) {
      return null;
    }
    result += numbers[i];
  }
  return result;
}

function toMrPFixed(n: number): string {
  let result = n.toFixed(2);
  if (result.endsWith('.00')) {
    result = result.substr(0, result.length - 1);
  }
  return result;
}

function elementToShortName(element: string): string {
  return element
    .split(', ')
    .map(i => elementShortName[i.toLowerCase()] || i.toLowerCase())
    .join(' + ');
}

interface MrPSoulBreak {
  damage?: string;
  other?: string;
}

export function describeEnlirSoulBreak(sb: EnlirSoulBreak): MrPSoulBreak | null {
  let m: RegExpMatchArray | null;
  if (
    (m = sb.effects.match(
      /^([A-Za-z\-]+) (group )?(random )?(ranged )?attacks? \(([0-9\.]+(?: each)?)\)$/,
    ))
  ) {
    const [, numAttacksString, group, random, ranged, damageString] = m;
    const numAttacks = parseNumberString(numAttacksString);
    if (numAttacks == null || sb.formula == null || sb.multiplier == null) {
      return null;
    }
    let damage = '';
    damage += group ? 'AoE ' : '';
    damage += sb.formula === 'Physical' ? 'phys' : 'magic';
    damage += ' ' + sb.multiplier.toFixed(2);
    damage += numAttacks !== 1 ? ' / ' + numAttacks : '';
    damage += sb.element && sb.element !== '-' ? ' ' + elementToShortName(sb.element) : '';
    damage += ranged ? ' ranged' : '';
    return {
      damage,
    };
  }
  return null;
}
