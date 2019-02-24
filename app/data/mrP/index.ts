import * as _ from 'lodash';
import * as XRegExp from 'xregexp';

import { EnlirOtherSkill, EnlirSoulBreak, isEnlirElement } from '../enlir';
import { ParsedEnlirAttack, parseEnlirAttack } from './attack';
import { splitSkillStatuses } from './split';
import {
  describeStats,
  includeStatus,
  parseEnlirStatus,
  parseEnlirStatusWithSlashes,
  parseStatusItem,
  sortStatus,
} from './status';
import {
  appendElement,
  damageTypeAbbreviation,
  getElementAbbreviation,
  getElementShortName,
  getSchoolShortName,
  getShortName,
  MrPDamageType,
} from './types';
import { isAllSame, toMrPFixed } from './util';

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
  if (isAllSame(status, i => i.chance)) {
    return status[0].chanceDescription + ' ' + status.map(i => i.description).join('/');
  } else {
    return status.map(i => i.chanceDescription + ' ' + i.description).join(', ');
  }
}

function formatChance(chance: number, attack?: ParsedEnlirAttack | null): string {
  if (chance !== 100 && attack && attack.numAttacks && attack.numAttacks > 1) {
    const totalChanceFraction = 1 - (1 - chance / 100) ** attack.numAttacks;
    const totalChance = Math.round(totalChanceFraction * 100);
    return `${totalChance}% (${chance}% × ${attack.numAttacks})`;
  } else {
    return `${chance}%`;
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

function formatDamageType(damageType: MrPDamageType, abbreviate: boolean): string {
  return abbreviate ? damageTypeAbbreviation(damageType) : damageType + ' ';
}

const statusEffectRe = XRegExp(
  String.raw`
  (?:[Gg]rants|[Cc]auses)\ #

  (?<statusString>(?:.*?(?:,?\ and\ |,\ ))*?(?:.*?))

  # Anchor the regex to end at anything that looks like the beginning of a new effect.
  (?=,\ grants|,\ causes|,\ restores\ HP\ |,\ damages\ the\ user\ |,\ heals\ the\ user\ |$)
  `,
  'x',
);

const statModRe = XRegExp(
  String.raw`
  # Anchor the stat matching to the beginning of a clause.
  (?:,\ |^)

  (?<stats>(?:[A-Z]{3}(?:,?\ and\ |,\ ))*[A-Z]{3})\ #
  (?<percent>[+-]\d+)%\ (?<who>to\ the\ user\ |to\ all\ allies\ )?
  for\ (?<duration>\d+)\ seconds
`,
  'x',
);

interface DescribeOptions {
  abbreviate: boolean;
  showNoMiss: boolean;
}

// FIXME: Rename to indicate broader usage (not just soul breaks now) and move out of index?
export function describeEnlirSoulBreak(
  sb: EnlirSoulBreak | EnlirOtherSkill,
  options: Partial<DescribeOptions> = {},
): MrPSoulBreak {
  const opt: DescribeOptions = {
    abbreviate: false,
    showNoMiss: true,
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
    const abbreviate = opt.abbreviate || !!attack.hybridDamageType;
    damage += attack.isAoE ? 'AoE ' : '';
    damage += attack.randomChances ? attack.randomChances + ' ' : '';
    damage += formatDamageType(attack.damageType, abbreviate);
    damage += attack.damage;

    if (attack.hybridDamageType) {
      damage += ' or ';
      damage += formatDamageType(attack.hybridDamageType, abbreviate);
      damage += attack.hybridDamage;
    }

    damage += appendElement(
      attack.element,
      opt.abbreviate ? getElementAbbreviation : getElementShortName,
    );
    damage += attack.isRanged ? ' rngd' : '';
    damage += attack.isJump ? ' jump' : '';
    damage += attack.isOverstrike ? ' overstrike' : '';
    damage += attack.school ? ' ' + getSchoolShortName(attack.school) : '';
    damage += opt.showNoMiss && attack.isNoMiss ? ' no miss' : '';
    if (!attack.scaleToDamage && attack.scaleType) {
      // Rank chase / threshold / etc.
      damage += ' ' + attack.scaleType;
    }
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
    if (attack.minDamage) {
      damage += `, min dmg ${attack.minDamage}`;
    }
    // Omit ' (SUM)' for Summoning school; it seems redundant.
    damage += attack.isSummon && attack.school !== 'Summoning' ? ' (SUM)' : '';
    damage += attack.isNat ? ' (NAT)' : '';

    if (attack.status && attack.statusChance) {
      const { description, defaultDuration } = parseEnlirStatus(attack.status);
      const duration = attack.statusDuration || defaultDuration;
      // Semi-hack: Attack statuses are usually or always imperils, and text
      // like '35% +10% fire vuln.' looks weird.  Like MrP, we insert a 'for'
      // to make it a bit clearer.
      statusInfliction.push({
        description: 'for ' + description + (duration ? ` ${duration}s` : ''),
        chance: attack.statusChance,
        chanceDescription: attack.statusChance + '%',
      });
    }
  }

  if ((m = sb.effects.match(/Randomly deals ((?:\d+, )*\d+,? or \d+) damage/))) {
    damage = m[1] + ' fixed dmg';
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

  if ((m = sb.effects.match(/damages the user for ([0-9.]+)% max(?:imum)? HP/))) {
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

  XRegExp.forEach(sb.effects, statusEffectRe, match => {
    const { statusString } = match as any;
    const wholeClause = match[0];
    const status = splitSkillStatuses(statusString)
      .filter(includeStatus)
      .map(i => parseStatusItem(i, wholeClause))
      .sort(sortStatus);
    for (const thisStatus of status) {
      // tslint:disable-next-line: prefer-const
      let { statusName, duration, who, chance } = thisStatus;

      const parsed = parseEnlirStatusWithSlashes(statusName);
      // tslint:disable-next-line: prefer-const
      let { description, isExLike, defaultDuration, isVariableDuration, specialDuration } = parsed;

      if (!duration && defaultDuration) {
        duration = defaultDuration;
      }

      const chanceDescription = chance ? formatChance(chance, attack) : '';

      const isDetail = isExLike;
      if ((duration || specialDuration) && !isVariableDuration) {
        const durationText = specialDuration || `${duration}s`;
        if (isDetail) {
          description = durationText + ': ' + description;
        } else {
          description = description + ' ' + durationText;
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
  });

  // Process stat mods.  Stop at the first "Grants" or "Causes" text; any stat
  // mods there are handled along with status effects above.
  XRegExp.forEach(
    sb.effects.replace(/([Gg]rants|[Cc]auses) .*/, ''),
    statModRe,
    ({ stats, percent, who, duration }: any) => {
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
    },
  );

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
    instant: sb.time != null && sb.time <= 0.01 ? true : undefined,
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
// TODO: Hide "no miss" text in follow-ups?  Hide min damage?  Hide school for percent-based finishers?
