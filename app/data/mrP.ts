import { enlir, EnlirSoulBreak, EnlirStatus } from './enlir';

import * as _ from 'lodash';

const listRegex = /,? and |, /;

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

function lowerCaseFirst(s: string): string {
  return s.replace(/^([A-Z])/, c => c.toLowerCase());
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

/**
 * Describes the "followed by" portion of an attack.  This is used for 20+1
 * AOSBs.
 */
function describeFollowedByAttack(effects: string): string | null {
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

function describeStats(stats: string[]): string {
  const result = stats.join('/');
  if (result === 'ATK/DEF/MAG/RES/MND') {
    return 'A/D/M/R/MND';
  } else if (result === 'ATK/DEF/MAG/RES') {
    return 'A/D/M/R';
  } else {
    return result;
  }
}

/**
 * Maps from Enlir status names to MMP aliases.  Some Enlir statuses have
 * embedded numbers and so can't use a simple string lookup like this.
 */
const enlirStatusAlias: { [status: string]: string } = {
  Astra: 'Status blink 1',
  'Cast speed *2': 'Fastcast', // used within Soul Break sheet
  'cast speed x2.00': 'Fastcast', // used within Status sheet
};

function describeEnlirStatus(status: string) {
  let m: RegExpMatchArray | null;
  if (enlirStatusAlias[status]) {
    return enlirStatusAlias[status];
  } else if ((m = status.match(/Magical Blink (\d+)/i))) {
    return 'Magic blink ' + m[1];
  } else if ((m = status.match(/Instant Cast (\d+)/i))) {
    return 'instacast ' + m[1];
  } else if ((m = status.match(/HP Stock \((\d+)\)/))) {
    return 'Autoheal ' + +m[1] / 1000 + 'k';
  } else if ((m = status.match(/Stoneskin: (\d+)%/))) {
    return 'Negate dmg ' + m[1] + '%';
  } else if ((m = status.match(/((?:[A-Z]{3}(?:,? and |, ))*[A-Z]{3}) ([-+]\d+%)/))) {
    // Status effects: e.g., "MAG +30%" from EX: Attack Hand
    // Reorganize stats into, e.g., +30% MAG to match MMP
    const [, stat, amount] = m;
    return amount + ' ' + stat.split(listRegex).join('/');
  } else {
    return status;
  }
}

interface ParsedEnlirStatus {
  description: string;
  isEx: boolean;
  isFollowUp: boolean;
}

const isFollowUpStatus = ({ codedName }: EnlirStatus) =>
  codedName.startsWith('CHASE_') || codedName.endsWith('_CHASE');

function parseEnlirStatus(status: string): ParsedEnlirStatus {
  let description = describeEnlirStatus(status);
  const enlirStatus = enlir.statusByName[status];

  const isEx = status.startsWith('EX: ');
  const isFollowUp = !!enlirStatus && isFollowUpStatus(enlirStatus);

  if (isEx && enlirStatus) {
    description =
      'EX: ' +
      enlirStatus.effects
        .split(listRegex)
        .map(describeEnlirStatus)
        .map(lowerCaseFirst)
        .join(', ');
  }

  return {
    description,
    isEx,
    isFollowUp,
  };
}

/**
 * Status effect sort orders - we usually follow Enlir's order, but listing
 * effects here can cause them to be sorted before (more negative) or after
 * (more positive) other effects.
 */
const statusSortOrder: { [status: string]: number } = {
  Haste: -1,
};

function sortStatus(a: string, b: string): number {
  return (statusSortOrder[a] || 0) - (statusSortOrder[b] || 0);
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

    const followedBy = describeFollowedByAttack(sb.effects);
    if (followedBy) {
      damage += ', then ' + followedBy + ',';
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

  const statusEffectRe = /[Gg]rants ((?:.*?(?:,? and |, ))*?(?:.*?))( to the user| to all allies)?(?: for (\d+) seconds)?(?=, grants|, [A-Z]{3}|$)/g;
  while ((m = statusEffectRe.exec(sb.effects))) {
    const [, statusString, who, duration] = m;
    const status = statusString
      .split(listRegex)
      .filter(includeStatus)
      .sort(sortStatus)
      .map(parseEnlirStatus);
    for (let { description, isEx, isFollowUp } of status) {
      if (duration) {
        description = `${duration}s: ` + description;
      }
      if (isEx || isFollowUp) {
        // Implied 'self'
        other.push(description);
      } else if (who === ' to the user' || (!who && sb.target === 'Self')) {
        selfOther.push(description);
      } else if (who === ' to all allies' || (!who && sb.target === 'All allies')) {
        partyOther.push(description);
      } else {
        other.push(description);
      }
    }
  }

  const statModRe = /((?:[A-Z]{3}(?:,? and |, ))*[A-Z]{3}) ([+-]\d+)% (to the user |to all allies )?for (\d+) seconds/g;
  while ((m = statModRe.exec(sb.effects))) {
    const [, stats, percent, who, duration] = m;
    const combinedStats = describeStats(stats.match(/[A-Z]{3}/g)!);
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

  if (!damage && !other.length && !partyOther.length) {
    // If it's only self effects (e.g., some glints), then "self" is redundant.
    other.push(...checkBurstMode(selfOther));
  } else {
    addGroup(other, partyOther, 'party');
    addGroup(other, checkBurstMode(selfOther), 'self');
  }

  return {
    instant: sb.time <= 0.01 ? true : undefined,
    damage: damage || undefined,
    other: other.length ? other.join(', ') : undefined,
  };
}
