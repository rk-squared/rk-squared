import * as _ from 'lodash';

import { EnlirSoulBreak } from '../enlir';
import { parseEnlirAttack } from './attack';
import { describeStats, includeStatus, parseEnlirStatus, sortStatus } from './status';
import { appendElement, getElementShortName } from './types';
import { andList } from './util';

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
 * Enlir lists Burst Mode and Haste for all BSBs, but MMP's format doesn't.
 */
function checkBurstMode(selfOther: string[]): string[] {
  return selfOther.indexOf('Burst Mode') !== -1
    ? _.filter(selfOther, i => i !== 'Burst Mode' && i !== 'Haste')
    : selfOther;
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

    damage += appendElement(attack.element, getElementShortName);
    damage += attack.isRanged ? ' ranged' : '';
    damage += attack.isJump ? ' jump' : '';
    damage += attack.isOverstrike ? ' overstrike' : '';
    damage += attack.isNoMiss ? ' no miss' : '';
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
    for (let { description, isExLike } of status) {
      if (duration) {
        description = `${duration}s: ` + description;
      }
      if (isExLike) {
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

// TODO: school abbreviations for follow-ups (BMag or B.Magic?), finishers, Yuna's follow-up
