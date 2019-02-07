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
  lightning: 'light',
  ne: 'non',
};

const elementAbbreviation: { [element: string]: string } = {
  water: 'wa',
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
    .join('+');
}

interface MrPSoulBreak {
  damage?: string;
  other?: string;
}

export function describeEnlirSoulBreak(sb: EnlirSoulBreak): MrPSoulBreak | null {
  let m: RegExpMatchArray | null;
  let damage = '';
  const other = [];

  if (
    (m = sb.effects.match(
      /([A-Za-z\-]+) ((?:group|random|single) )?(ranged )?attacks? \(([0-9\.]+(?: each)?)\)/,
    ))
  ) {
    const [, numAttacksString, attackType, ranged, damageString] = m;
    const numAttacks = parseNumberString(numAttacksString);
    if (numAttacks == null || sb.formula == null || sb.multiplier == null) {
      return null;
    }
    damage += attackType === 'group' ? 'AoE ' : '';
    damage += sb.formula === 'Physical' ? 'phys' : 'magic';
    damage += ' ' + toMrPFixed(sb.multiplier);
    damage += numAttacks !== 1 ? '/' + numAttacks : '';
    damage += sb.element && sb.element !== '-' ? ' ' + elementToShortName(sb.element) : '';
    damage += ranged ? ' ranged' : '';
  }

  if ((m = sb.effects.match(/heals the user for (\d+)% of the damage dealt/))) {
    const [, healPercent] = m;
    other.push(`self heal ${healPercent}% of dmg`);
  }

  if ((m = sb.effects.match(/damages the user for ([0-9.]+)% max HP/))) {
    const [, damagePercent] = m;
    other.push(`self lose ${damagePercent}% max HP`);
  }

  return {
    damage: damage || undefined,
    other: other.length ? other.join(', ') : undefined,
  };
}
