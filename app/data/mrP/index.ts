import * as _ from 'lodash';

import { allEnlirElements, EnlirElement, EnlirSoulBreak } from '../enlir';
import { parseEnlirAttack } from './attack';
import { describeStats, includeStatus, parseEnlirStatus, sortStatus } from './status';
import { appendElement, damageTypeAbbreviation, getElementShortName } from './types';
import { andList, toMrPFixed } from './util';

interface MrPSoulBreak {
  instant?: boolean;
  chain?: string;
  damage?: string;
  other?: string;
}

function appendGroup(outGroup: string[], inGroup: string[], description?: string) {
  if (inGroup.length) {
    outGroup.push((description ? description + ' ' : '') + inGroup.join(', '));
  }
}

interface StatusInfliction {
  description: string;
  chance: number;
  chanceDescription: string;
}

function formatStatusInfliction(status: StatusInfliction[]): string {
  const allSame = _.every(status, i => i.chance === status[0].chance);
  if (allSame) {
    return status[0].chanceDescription + ' ' + status.map(i => i.description).join('/');
  } else {
    return status.map(i => i.chanceDescription + ' ' + i.description).join(', ');
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
  let chain: string | undefined;
  let damage = '';

  const statusInfliction: StatusInfliction[] = [];

  // The components of MrPSoulBreak.other, as lists.  We break them up like
  // this so that we can sort general items (e.g., elemental infuse), then
  // self statuses, then party statuses, then "details" (e.g., EX modes).
  //
  // We may start returning these as is so callers can deal with them.
  const other: string[] = [];
  const selfOther: string[] = [];
  const partyOther: string[] = [];
  const detailOther: string[] = [];

  const attack = parseEnlirAttack(sb.effects, sb);
  if (attack) {
    damage += attack.isAoE ? 'AoE ' : '';
    damage += attack.randomChances ? attack.randomChances + ' ' : '';
    damage += attack.damageType + ' ' + attack.damage;

    damage += appendElement(attack.element, getElementShortName);
    damage += attack.isRanged ? ' ranged' : '';
    damage += attack.isJump ? ' jump' : '';
    damage += attack.isOverstrike ? ' overstrike' : '';
    damage += attack.isNoMiss ? ' no miss' : '';
    damage += attack.isSummon ? ' (SUM)' : '';
    if (attack.orDamage && attack.orCondition) {
      damage +=
        ', or ' +
        damageTypeAbbreviation(attack.damageType) +
        attack.orDamage +
        ' ' +
        attack.orCondition;
    }
  }

  if ((m = sb.effects.match(/Activates (.*?) Chain \(max (\d+), field \+(\d+)%\)/))) {
    const [, type, , fieldBonus] = m;

    // Realm names should remain uppercase, but elements should not.
    const isElement = allEnlirElements.indexOf(type as EnlirElement) !== -1;
    chain = (isElement ? getElementShortName(type as EnlirElement) : type) + ' chain';
    chain += ' ' + toMrPFixed(1 + +fieldBonus / 100) + 'x';
  }

  if ((m = sb.effects.match(/Attach (\w+) Stacking/))) {
    const [, element] = m;
    other.push(`${element.toLowerCase()} infuse stacking 25s`);
  }

  if ((m = sb.effects.match(/Attach (\w+) (?!Stacking)/))) {
    const [, element] = m;
    other.push(`${element.toLowerCase()} infuse 25s`);
  }

  if (
    (m = sb.effects.match(
      /Restores HP( to all allies| to the user)? for (\d+)% of (?:their|the target's|the user's) maximum HP/i,
    ))
  ) {
    const [, who, healPercent] = m;
    const heal = `heal ${healPercent}% HP`;
    if (who === ' to all allies' || (!who && sb.target === 'All allies')) {
      partyOther.push(heal);
    } else if (who === ' to the user' || (!who && sb.target === 'Self')) {
      selfOther.push(heal);
    } else {
      // Fallback
      other.push(heal);
    }
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

  const statusEffectRe = /(?:[Gg]rants|[Cc]auses) ((?:.*?(?:,? and |, ))*?(?:.*?))( to the user| to all allies)?(?: for (\d+) seconds)?(?=, grants|, causes|, [A-Z]{3}|$)/g;
  while ((m = statusEffectRe.exec(sb.effects))) {
    const [, statusString, who, duration] = m;
    const status = statusString
      .split(andList)
      .filter(includeStatus)
      .sort(sortStatus)
      .map(parseEnlirStatus);
    for (let { description, isExLike, defaultDuration, chance } of status) {
      let chanceDescription = '';
      if (chance) {
        if (chance !== 100 && attack && attack.numAttacks && attack.numAttacks > 1) {
          const totalChanceFraction = 1 - (1 - chance / 100) ** attack.numAttacks;
          const totalChance = Math.round(totalChanceFraction * 100);
          chanceDescription = `${totalChance}% (${chance}% × ${attack.numAttacks})`;
        } else {
          chanceDescription = `${chance}%`;
        }
      }

      const isDetail = isExLike;
      if (duration || (defaultDuration && isExLike)) {
        if (isDetail) {
          description = `${duration || defaultDuration}s: ` + description;
        } else {
          description = description + ` ${duration || defaultDuration}s`;
        }
      }

      if (chance) {
        statusInfliction.push({ description, chanceDescription, chance });
      } else if (isDetail) {
        // (Always?) has implied 'self'
        detailOther.push(description);
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

  if (statusInfliction.length) {
    other.splice(0, 0, formatStatusInfliction(statusInfliction));
  }

  if (!damage && !other.length && !partyOther.length && !detailOther.length) {
    // If it's only self effects (e.g., some glints), then "self" is redundant.
    other.push(...checkBurstMode(selfOther));
  } else {
    appendGroup(other, partyOther, 'party');
    appendGroup(other, checkBurstMode(selfOther), 'self');
    appendGroup(other, detailOther);
  }

  return {
    chain: chain || undefined,
    instant: sb.time <= 0.01 ? true : undefined,
    damage: damage || undefined,
    other: other.length ? other.join(', ') : undefined,
  };
}

// TODO: finishers, Yuna's follow-up
