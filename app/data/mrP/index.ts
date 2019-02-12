import { enlir, EnlirElement, EnlirSoulBreak, EnlirStatus } from '../enlir';

import { andList, lowerCaseFirst } from './util';

import * as _ from 'lodash';
import { parseEnlirAttack } from './attack';

const elementShortName: { [element: string]: string } = {
  lightning: 'lgt',
  ne: 'non',
};

const elementAbbreviation: { [element: string]: string } = {
  water: 'wa',
};

function elementToShortName(element: EnlirElement[]): string {
  return element.map(i => elementShortName[i.toLowerCase()] || i.toLowerCase()).join('+');
}

interface MrPSoulBreak {
  instant?: boolean;
  damage?: string;
  other?: string;
}

function prependGroup(outGroup: string[], inGroup: string[], description: string) {
  if (inGroup.length) {
    outGroup.splice(0, 0, description + ' ' + inGroup.join(', '));
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

const enlirStatusAliasWithNumbers: { [status: string]: string } = {
  'High Quick Cast': 'hi fastcast',
  'Instant Cast': 'instacast',
  'Magical Blink': 'Magic blink',
};

function describeEnlirStatus(status: string) {
  let m: RegExpMatchArray | null;
  if (enlirStatusAlias[status]) {
    return enlirStatusAlias[status];
  } else if ((m = status.match(/^(.*) (\d+)$/)) && enlirStatusAliasWithNumbers[m[1]]) {
    return enlirStatusAliasWithNumbers[m[1]] + ' ' + m[2];
  } else if ((m = status.match(/HP Stock \((\d+)\)/))) {
    return 'Autoheal ' + +m[1] / 1000 + 'k';
  } else if ((m = status.match(/Stoneskin: (\d+)%/))) {
    return 'Negate dmg ' + m[1] + '%';
  } else if ((m = status.match(/((?:[A-Z]{3}(?:,? and |, ))*[A-Z]{3}) ([-+]\d+%)/))) {
    // Status effects: e.g., "MAG +30%" from EX: Attack Hand
    // Reorganize stats into, e.g., +30% MAG to match MMP
    const [, stat, amount] = m;
    return amount + ' ' + stat.split(andList).join('/');
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
        .split(andList)
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

  const attack = parseEnlirAttack(sb.effects, sb);
  if (attack) {
    damage += attack.isAoE ? 'AoE ' : '';
    damage += attack.damageType + ' ' + attack.damage;

    damage +=
      attack.element && attack.element.length ? ' ' + elementToShortName(attack.element) : '';
    damage += attack.isRanged ? ' ranged' : '';
    damage += attack.isJump ? ' jump' : '';
    damage += attack.isOverstrike ? ' overstrike' : '';
    damage += attack.isSummon ? ' (SUM)' : '';
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
      .split(andList)
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
    prependGroup(other, checkBurstMode(selfOther), 'self');
    prependGroup(other, partyOther, 'party');
  }

  return {
    instant: sb.time <= 0.01 ? true : undefined,
    damage: damage || undefined,
    other: other.length ? other.join(', ') : undefined,
  };
}
