import * as _ from 'lodash';

import { EnlirOtherSkill, EnlirSoulBreak, isEnlirElement } from '../enlir';
import { parseEnlirAttack } from './attack';
import { splitSkillStatuses } from './split';
import { describeStats, includeStatus, parseEnlirStatus, sortStatus } from './status';
import {
  appendElement,
  damageTypeAbbreviation,
  getElementAbbreviation,
  getElementShortName,
  getSchoolShortName,
  getShortName,
} from './types';
import { toMrPFixed } from './util';

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

interface DescribeOptions {
  abbreviate: boolean;
}

// FIXME: Rename to indicate broader usage (not just soul breaks now) and move out of index?
export function describeEnlirSoulBreak(
  sb: EnlirSoulBreak | EnlirOtherSkill,
  options: Partial<DescribeOptions> = {},
): MrPSoulBreak {
  const opt: DescribeOptions = {
    abbreviate: false,
    ...options,
  };

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
    // FIXME: Extract and reduce duplication with describing follow-up skills?
    damage += attack.isAoE ? 'AoE ' : '';
    damage += attack.randomChances ? attack.randomChances + ' ' : '';
    damage += opt.abbreviate ? damageTypeAbbreviation(attack.damageType) : attack.damageType + ' ';
    damage += attack.damage;

    damage += appendElement(
      attack.element,
      opt.abbreviate ? getElementAbbreviation : getElementShortName,
    );
    damage += attack.isRanged ? ' rngd' : '';
    damage += attack.isJump ? ' jump' : '';
    damage += attack.isOverstrike ? ' overstrike' : '';
    damage += attack.school ? ' ' + getSchoolShortName(attack.school) : '';
    damage += attack.isNoMiss ? ' no miss' : '';
    if (!attack.scaleToDamage && attack.scaleType) {
      // Rank chase / threshold / etc.
      damage += ' ' + attack.scaleType;
    }
    // Omit ' (SUM)' for Summoning school; it seems redundant.
    damage += attack.isSummon && attack.school !== 'Summoning' ? ' (SUM)' : '';
    if (attack.orDamage && attack.orCondition) {
      damage +=
        ', or ' +
        damageTypeAbbreviation(attack.damageType) +
        attack.orDamage +
        ' ' +
        attack.orCondition;
    }
    if (attack.scaleToDamage && attack.scaleType) {
      // Damage scaling
      damage +=
        ', up to ' +
        damageTypeAbbreviation(attack.damageType) +
        attack.scaleToDamage +
        ' ' +
        attack.scaleType;
    }
  }

  if ((m = sb.effects.match(/Activates (.*?) Chain \(max (\d+), field \+(\d+)%\)/))) {
    const [, type, max, fieldBonus] = m;

    // Realm names should remain uppercase, but elements should not.
    chain = (isEnlirElement(type) ? getElementShortName(type) : type) + ' chain';
    chain += ' ' + toMrPFixed(1 + +fieldBonus / 100) + 'x';
    chain += ` (max ${max})`;
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

  if ((m = sb.effects.match(/[Rr]estores HP \((\d+)\)( to the user| to all allies)?/))) {
    const [, healAmount, who] = m;
    const heal = 'h' + healAmount;
    if (who === ' to all allies' || (!who && sb.target === 'All allies')) {
      partyOther.push(heal);
    } else if (who === ' to the user' || (!who && sb.target === 'Self')) {
      selfOther.push(heal);
    } else if (sb.target.startsWith('Single')) {
      // Because medica soul breaks are so common, we'll call out when a SB
      // only heals one person.
      other.push('ally ' + heal);
    } else {
      // Fallback
      other.push(heal);
    }
  }

  const dispelEsunaRe = /[Rr]emoves (positive|negative) effects( to all allies)?/g;
  while ((m = dispelEsunaRe.exec(sb.effects))) {
    const [, dispelOrEsuna, who] = m;
    const effect = dispelOrEsuna === 'positive' ? 'Dispel' : 'Esuna';
    if (!who && attack) {
      // No need to list an explicit target - it's the same as the attack
      other.push(effect);
    } else if (!who && sb.target === 'All enemies') {
      other.push('AoE ' + effect);
    } else if (!who && sb.target.startsWith('Single')) {
      other.push(effect);
    } else if (who === ' to all allies' || (!who && sb.target === 'All allies')) {
      partyOther.push(effect);
    } else {
      // Fallback
      other.push(effect);
    }
  }

  const statusEffectRe = /(?:[Gg]rants|[Cc]auses) ((?:.*?(?:,? and |, ))*?(?:.*?))( to the user| to all allies)?(?: for (\d+) seconds)?(?=, grants|, causes|, restores HP |, damages the user |, heals the user |, [A-Z]{3}|$)/g;
  while ((m = statusEffectRe.exec(sb.effects))) {
    const [, statusString, who, overallDuration] = m;
    const status = splitSkillStatuses(statusString)
      .filter(includeStatus)
      .sort(sortStatus);
    for (let thisStatus of status) {
      let duration: number | undefined = overallDuration ? +overallDuration : undefined;
      // Check for soul breaks that have multiple statuses with multiple
      // durations embedded, like Jecht's Ultimate Jecht Rush.
      const durationMatch = thisStatus.match(/ for (\d+) seconds$/);
      if (durationMatch) {
        duration = +durationMatch[1];
        thisStatus = thisStatus.replace(/ for (\d+) seconds$/, '');
      }

      // tslint:disable-next-line: prefer-const
      let { description, isExLike, defaultDuration, isVariableDuration, chance } = parseEnlirStatus(
        thisStatus,
      );

      if (!duration && defaultDuration) {
        duration = defaultDuration;
      }

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
      if (duration && !isVariableDuration) {
        if (isDetail) {
          description = `${duration}s: ` + description;
        } else {
          description = description + ` ${duration}s`;
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

  // Process stat buffs/debuffs.  Exclude anything marked 'grants' - those are
  // handed along with statuses above.  Exclude "Different " stat bonuses.
  const statModRe = /(?<![Gg]rants | and |Different )((?:[A-Z]{3}(?:,? and |, ))*[A-Z]{3}) ([+-]\d+)% (to the user |to all allies )?for (\d+) seconds/g;
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
    } else if (!who && attack) {
      // No need to list an explicit target - it's the same as the attack
      other.push(statMod);
    } else if (sb.target === 'All enemies') {
      other.push('AoE ' + statMod);
    } else {
      // Fallback - may not always be correct
      other.push(statMod);
    }
  }

  if ((m = sb.effects.match(/[Rr]emoves KO \((\d+)% HP\)( to all allies)?/))) {
    const [, percent, who] = m;
    const revive = `revive @ ${percent}% HP`;
    if (!who && sb.target.startsWith('Single')) {
      other.push(revive);
    } else if (who === ' to all allies' || (!who && sb.target === 'All allies')) {
      partyOther.push(revive);
    } else {
      // Fallback
      other.push(revive);
    }
  }

  if ((m = sb.effects.match(/Attach (\w+) Stacking/))) {
    const [, element] = m;
    other.push(`${getShortName(element)} infuse stacking 25s`);
  }

  if ((m = sb.effects.match(/Attach (\w+)(?: |,|$)(?! Stacking)/))) {
    const [, element] = m;
    other.push(`${getShortName(element)} infuse 25s`);
  }

  if ((m = sb.effects.match(/(\w+ )?smart (\w+ )?ether (\S+)( to the user| to all allies)?/))) {
    const [, type1, type2, amount, who] = m;

    // Process type (e.g., "smart summoning ether").  FFRK Community is
    // inconsistent - sometimes "Summoning smart ether," sometimes
    // "smart summoning ether."
    // TODO: Fix that inconsistency
    let type = type1 && type1 !== 'and ' ? type1 : type2;
    if (type) {
      type = getShortName(_.upperFirst(type.trim()));
    }

    const ether = 'refill ' + amount + ' ' + (type ? type + ' ' : '') + 'abil. use';
    if (who === ' to the user' || (!who && sb.target === 'Self')) {
      selfOther.push(ether);
    } else if (who === ' to all allies' || (!who && sb.target === 'All allies')) {
      partyOther.push(ether);
    } else {
      // Fallback
      other.push(ether);
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

interface FormatOptions {
  showInstant: boolean;
}

export function formatMrP(mrP: MrPSoulBreak, options: Partial<FormatOptions> = {}): string {
  const opt: FormatOptions = {
    showInstant: true,
    ...options,
  };

  let text = _.filter([mrP.chain, mrP.damage, mrP.other]).join(', ');
  if (text && mrP.instant && opt.showInstant) {
    text = 'instant ' + text;
  }
  return text;
}

// TODO: Yuna's follow-up, Sephiroth Zanshin, def-piercing, Edgar OSB, Dk Cecil's Awaken and ultra
// TODO: Abilities with crit chance per use: Renzokuken Ice Fang, Windfang, Blasting Freeze
