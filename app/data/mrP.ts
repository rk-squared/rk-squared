import { EnlirSoulBreak } from './enlir';

import * as _ from 'lodash';

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
  lightning: 'lgt',
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
  if (result.endsWith('0')) {
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
  instant?: boolean;
  damage?: string;
  other?: string;
}

function describeDamage(damageString: string, numAttacks: number) {
  const multiplier = parseFloat(damageString) * numAttacks;
  return toMrPFixed(multiplier) + (numAttacks !== 1 ? '/' + numAttacks : '');
}

function describeFollowUp(effects: string): string | null {
  const m = effects.match(
    /followed by ([A-Za-z\-]+) ((?:group|random|single) )?(ranged )?(jump )?attacks? \(([0-9\.]+(?: each)?)\)( capped at 99999)?/,
  );
  if (!m) {
    return null;
  }
  const [, numAttacksString, attackType, ranged, jump, damageString, overstrike] = m;
  const numAttacks = parseNumberString(numAttacksString);
  if (numAttacks == null) {
    return null;
  }

  let damage = '';
  damage += overstrike ? 'overstrike ' : '';
  damage += describeDamage(damageString, numAttacks);
  return damage;
}

function addGroup(outGroup: string[], inGroup: string[], description: string) {
  if (inGroup.length) {
    outGroup.push(description + ' ' + inGroup.join(', '));
  }
}

/**
 * Status effects which should be omitted from the regular status list
 */
function includeStatus(status: string): boolean {
  // En-Element is listed separately
  return !status.startsWith('Attach ');
}

function checkBurstMode(selfOther: string[]): string[] {
  return selfOther.indexOf('Burst Mode') !== -1
    ? _.filter(selfOther, i => i !== 'Burst Mode' && i !== 'Haste')
    : selfOther;
}

function describeEnlirStatus(status: string) {
  let m: RegExpMatchArray | null;
  if ((m = status.match(/Magical Blink (\d+)/i))) {
    return 'Magic blink ' + m[1];
  } else {
    return status;
  }
}

export function describeEnlirSoulBreak(sb: EnlirSoulBreak): MrPSoulBreak | null {
  let m: RegExpMatchArray | null;
  let damage = '';
  const other: string[] = [];
  const selfOther: string[] = [];
  const partyOther: string[] = [];

  if (
    (m = sb.effects.match(
      /([A-Za-z\-]+) (?:(group|random|single) )?(ranged )?(jump )?attacks? \(([0-9\.]+(?: each)?)\)( capped at 99999)?/,
    ))
  ) {
    const [, numAttacksString, attackType, ranged, jump, damageString, overstrike] = m;
    const numAttacks = parseNumberString(numAttacksString);
    if (numAttacks == null || sb.formula == null || sb.multiplier == null) {
      return null;
    }
    damage += attackType === 'group' ? 'AoE ' : '';
    damage += sb.formula === 'Physical' ? 'phys' : sb.type === 'WHT' ? 'white' : 'magic';
    damage += ' ' + describeDamage(damageString, numAttacks);

    const followUp = describeFollowUp(sb.effects);
    if (followUp) {
      damage += ', then ' + followUp + ',';
    }

    damage += sb.element && sb.element !== '-' ? ' ' + elementToShortName(sb.element) : '';
    damage += ranged && !jump ? ' ranged' : '';
    damage += jump ? ' jump' : '';
    damage += overstrike ? ' overstrike' : '';
    damage += sb.type === 'SUM' ? ' (SUM)' : '';
  }

  if ((m = sb.effects.match(/Attach (\w+) Stacking/))) {
    const [, element] = m;
    other.push(`${element.toLowerCase()} infuse stacking 25s`);
  }

  if ((m = sb.effects.match(/Attach (\w+) (?!Stacking)/))) {
    const [, element] = m;
    other.push(`${element.toLowerCase()} infuse 25s`);
  }

  if ((m = sb.effects.match(/heals the user for (\d+)% of the damage dealt/))) {
    const [, healPercent] = m;
    selfOther.push(`heal ${healPercent}% of dmg`);
  }

  if ((m = sb.effects.match(/damages the user for ([0-9.]+)% max HP/))) {
    const [, damagePercent] = m;
    selfOther.push(`lose ${damagePercent}% max HP`);
  }

  if ((m = sb.effects.match(/Restores HP \((\d+)\)/))) {
    const [, healAmount] = m;
    const heal = 'h' + healAmount;
    if (sb.target === 'All allies') {
      partyOther.push(heal);
    } else if (sb.target === 'Self') {
      selfOther.push(heal);
    } else {
      other.push(heal);
    }
  }

  const statusEffectRe = /[Gg]rants ((?:.*?(?:,? and |, ))*?(?:.*?))( to the user| to all allies)?(?=, grants|, [A-Z]{3}|$)/g;
  while ((m = statusEffectRe.exec(sb.effects))) {
    const [, statusString, who] = m;
    const status = statusString
      .split(/,? and |, /)
      .filter(includeStatus)
      .map(describeEnlirStatus);
    if (who === ' to the user' || (!who && sb.target === 'Self')) {
      selfOther.push(...status);
    } else if (who === ' to all allies' || (!who && sb.target === 'All allies')) {
      partyOther.push(...status);
    } else {
      other.push(...status);
    }
  }

  const statModRe = /((?:[A-Z]{3}(?:,? and |, ))*[A-Z]{3}) ([+-]\d+)% (to the user |to all allies )?for (\d+) seconds/g;
  while ((m = statModRe.exec(sb.effects))) {
    const [, stats, percent, who, duration] = m;
    const combinedStats = stats.match(/[A-Z]{3}/g)!.join('/');
    let statMod = percent + '% ';
    statMod += combinedStats;
    statMod += ` ${duration}s`;

    if (who === 'to the user ' || (!who && sb.target === 'Self')) {
      selfOther.push(statMod);
    } else if (who === 'to all allies ' || (!who && sb.target === 'All allies')) {
      partyOther.push(statMod);
    } else if (sb.target === 'All enemies') {
      other.push('AoE ' + statMod);
    } else {
      // Fallback - may not always be correct
      other.push(statMod);
    }
  }

  addGroup(other, partyOther, 'party');
  addGroup(other, checkBurstMode(selfOther), 'self');

  return {
    instant: sb.time <= 0.01 ? true : undefined,
    damage: damage || undefined,
    other: other.length ? other.join(', ') : undefined,
  };
}
