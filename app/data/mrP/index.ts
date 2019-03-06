import * as _ from 'lodash';
import * as XRegExp from 'xregexp';

import {
  enlir,
  EnlirBurstCommand,
  EnlirSchool,
  EnlirSkill,
  isBrave,
  isBraveCommand,
  isBurst,
  isEnlirElement,
  isGlint,
  isSoulBreak,
} from '../enlir';
import { ParsedEnlirAttack, parseEnlirAttack } from './attack';
import { splitSkillStatuses } from './split';
import {
  checkForAndStatuses,
  describeStats,
  formatDuration,
  getRageSkills,
  includeStatus,
  parseEnlirStatus,
  parseEnlirStatusWithSlashes,
  parseStatusItem,
  sortStatus,
} from './status';
import {
  formatRandomEther,
  formatSmartEther,
  resolveStatusAlias,
  sbPointsAlias,
} from './statusAlias';
import {
  appendElement,
  damageTypeAbbreviation,
  getElementAbbreviation,
  getElementShortName,
  getSchoolShortName,
  getShortName,
  MrPDamageType,
  XRegExpNamedGroups,
} from './types';
import {
  countMatches,
  describeChances,
  formatUseCount,
  isAllSame,
  orList,
  parseNumberOccurrence,
  toMrPFixed,
  toMrPKilo,
} from './util';

export interface MrPSoulBreak {
  // Time markers.  We could simply pass the time value itself, but this lets
  // us pull out how it's displayed.
  instant?: boolean;
  fast?: boolean;
  slow?: boolean;

  chain?: string;
  damage?: string;
  other?: string;
  school?: EnlirSchool;

  /**
   * If set, this indicates whether this is a burst command that toggles the
   * burst status ON or OFF.
   */
  burstToggle?: boolean;

  burstCommands?: MrPSoulBreak[];
  braveCommands?: MrPSoulBreak[];
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
  const fallback = `${chance}%`;
  if (chance === 100 || !attack) {
    return fallback;
  }

  if (attack.numAttacks) {
    if (attack.numAttacks === 1) {
      return fallback;
    } else {
      const totalChanceFraction = 1 - (1 - chance / 100) ** attack.numAttacks;
      const totalChance = Math.round(totalChanceFraction * 100);
      return `${totalChance}% (${chance}% × ${attack.numAttacks})`;
    }
  }

  if (countMatches(attack.damage, /\//g)) {
    // Looks like variable number of hits
    return `${chance}%/hit`;
  }

  return fallback;
}

/**
 * Enlir lists Burst Mode and Haste for all BSBs and lists Brave Mode for all
 * Brave Ultra Soul Breaks, but MrP's format doesn't.
 */
function checkBurstAndBraveMode(selfOther: string[]): string[] {
  selfOther = _.filter(selfOther, i => i !== 'Brave Mode');
  return selfOther.indexOf('Burst Mode') !== -1
    ? _.filter(selfOther, i => i !== 'Burst Mode' && i !== 'Haste')
    : selfOther;
}

function formatDamageType(damageType: MrPDamageType, abbreviate: boolean): string {
  return abbreviate ? damageTypeAbbreviation(damageType) : damageType + ' ';
}

const healRe = XRegExp(
  String.raw`
  [Rr]estores\ #
  (?:HP\ \((?<healFactor>(?:\d+\/)*\d+)\)
  |(?<fixedHp>\d+)\ HP)
  (?<who>\ to\ the\ user|\ to\ all\ allies|\ to\ the\ lowest\ HP%\ ally)?
  (?<rank>\ at\ rank\ 1\/2\/3\/4\/5\ of\ the\ triggering\ ability)?
  (?:\ if\ (?<ifAllyAlive>.*?)\ is\ alive)?
  `,
  'x',
);

const statusEffectRe = XRegExp(
  String.raw`
  (?<verb>[Gg]rants|[Cc]auses|[Rr]emoves)\ #

  (?<statusString>(?:.*?(?:,?\ and\ |,\ ))*?(?:.*?))

  # Anchor the regex to end at anything that looks like the beginning of a new effect.
  (?=
    ,\ grants|,\ causes|,\ removes|,\ restores\ HP\ |
    ,\ damages\ the\ user\ |
    ,\ heals\ the\ user\ |
    ,\ casts\ the\ last\ ability\ used\ by\ an\ ally\b|
  $)
  `,
  'x',
);

const statModRe = XRegExp(
  String.raw`
  # Anchor the stat matching to the beginning of a clause.
  (?:,\ |^)

  (?<stats>(?:[A-Z]{3}(?:,?\ and\ |,\ ))*[A-Z]{3})
  \ (?<percent>[+-]\ ?(?:\d+/)*\d+)%
  (?<scalesWithUses>\ scaling\ with\ uses)?
  (?<who>\ to\ the\ user|\ to\ all\ allies)?
  \ for\ (?<duration>\d+)\ seconds
  (?:\ at\ (?<atStatus>.*?)\ (?<atStatusCount>(\d+/)*\d))?
`,
  'x',
);

interface DescribeOptions {
  abbreviate: boolean;
  showNoMiss: boolean;
  includeSchool: boolean;
  includeSbPoints: boolean;

  prereqStatus: string | undefined;
  burstCommands: EnlirBurstCommand[] | undefined;
}

function describeEnlirAttack(
  skill: EnlirSkill,
  attack: ParsedEnlirAttack,
  opt: DescribeOptions,
): [string, StatusInfliction[]] {
  let damage = '';
  const statusInfliction: StatusInfliction[] = [];

  const abbreviate = opt.abbreviate || !!attack.hybridDamageType;
  damage += attack.isAoE ? 'AoE ' : '';
  damage += attack.randomChances ? attack.randomChances + ' ' : '';
  damage += !attack.isFixedDamage ? formatDamageType(attack.damageType, abbreviate) : '';
  damage += attack.isPiercing ? '^' : '';
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
  damage +=
    opt.includeSchool && attack.school && attack.school !== '?' && attack.school !== 'Special'
      ? ' ' + getSchoolShortName(attack.school)
      : '';
  damage += opt.showNoMiss && attack.isNoMiss ? ' no miss' : '';
  if (attack.additionalCrit && !attack.additionalCritType) {
    // If critical hits might depend on the entire attack's scaling, process
    // them now.
    damage += ' @ +' + attack.additionalCrit.join(' - ') + '% crit';
  }
  if (attack.additionalCritDamage) {
    damage += ` @ +${attack.additionalCritDamage}% crit dmg`;
  }
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
  if (attack.defaultDamage) {
    damage += ', default ' + damageTypeAbbreviation(attack.damageType) + attack.defaultDamage;
  }
  if (attack.minDamage) {
    damage += `, min dmg ${attack.minDamage}`;
  }
  if (attack.additionalDamage) {
    damage +=
      ' @ ' +
      (attack.additionalDamage[0] > 0 ? '+' : '') +
      attack.additionalDamage.join(' - ') +
      '% dmg';
    damage += ' ' + attack.additionalDamageType;
  }
  if (attack.additionalCrit && attack.additionalCritType) {
    damage += ' @ +' + attack.additionalCrit.join(' - ') + '% crit';
    damage += ' ' + attack.additionalCritType;
  }
  // Omit ' (SUM)' for Summoning school; it seems redundant.
  damage += attack.isSummon && attack.school !== 'Summoning' ? ' (SUM)' : '';
  damage += attack.isNat && !attack.isFixedDamage ? ' (NAT)' : '';

  if (attack.status && attack.statusChance) {
    const { description, defaultDuration } = parseEnlirStatus(attack.status, skill);
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

  // Hack: In case a "followed by" attack left a trailing comma that we ended
  // up not needing.
  damage = damage.replace(/,$/, '');
  return [damage, statusInfliction];
}

// FIXME: Rename to indicate broader usage (not just soul breaks now) and move out of index?
export function describeEnlirSoulBreak(
  sb: EnlirSkill,
  options: Partial<DescribeOptions> = {},
): MrPSoulBreak {
  const opt: DescribeOptions = {
    abbreviate: false,
    showNoMiss: true,
    includeSchool: true,
    includeSbPoints: true,
    prereqStatus: undefined,
    burstCommands: undefined,
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
  let burstToggle: boolean | undefined;
  const other: string[] = [];
  const aoeOther: string[] = [];
  const selfOther: string[] = [];
  const partyOther: string[] = [];
  const detailOther: string[] = [];

  const attackOpts = {
    prereqStatus: opt.prereqStatus,
    burstCommands: opt.burstCommands,
  };
  const attack = parseEnlirAttack(sb.effects, sb, attackOpts);
  if (attack) {
    const [thisDamage, thisStatusInfliction] = describeEnlirAttack(sb, attack, opt);
    damage = thisDamage;
    statusInfliction.push(...thisStatusInfliction);
  }

  // Check for additional / separate attacks.
  if ((m = sb.effects.match(/\. +Additional (.*)/))) {
    const attack2 = parseEnlirAttack(m[1], sb, attackOpts);
    if (attack2) {
      const [thisDamage, thisStatusInfliction] = describeEnlirAttack(sb, attack2, opt);
      if (damage) {
        damage += ', then ';
      }
      damage += thisDamage;
      statusInfliction.push(...thisStatusInfliction);
    }
  }

  // A single attack with random fixed damage - this is too hard and weird to
  // fit into parseEnlirAttack.
  if ((m = sb.effects.match(/Randomly deals ((?:\d+, )*\d+,? or \d+) damage/))) {
    damage = m[1] + ' fixed dmg';
  }

  // Random effects.  In practice, these are always pure damage, so list as
  // damage.
  if ((m = sb.effects.match(/Randomly casts (.*)/))) {
    const skillsAndChances = _.unzip(
      m[1]
        .split(orList)
        .map(i => i.match(/^(.*?)(?: \((\d+)%\))?$/))
        .map((i: RegExpMatchArray) => [i[1], i[2] ? +i[2] : 1]),
    ) as [string[], number[]];

    let skills = skillsAndChances[0];

    // Resolve skill effects, if it looks like it won't be too verbose.
    if (skills.length <= 3) {
      const skillOpt = { abbreviate: true, includeSchool: false };
      skills = skillsAndChances[0].map(i => {
        const thisSkill = enlir.abilitiesByName[i];
        if (thisSkill) {
          return i + ' (' + formatMrP(describeEnlirSoulBreak(thisSkill, skillOpt)) + ')';
        } else {
          return i;
        }
      });
    }
    damage = _.filter(describeChances(skills, skillsAndChances[1], ' / ')).join(' ');
  }

  if (damage && sb.effects.match(/ATK increases as HP decreases/)) {
    // MrP and random comments on Reddit suggest that Cecil gets up to +1500
    // and Locke gets +11-40%.  Without confirmation in Enlir, I'll omit for
    // now.
    damage += ', uses +ATK as HP falls';
  }

  // Hack / special case: Rage skills whose rage effects match the main effect.
  let isPureRage = false;
  let rageTurns: number | undefined;
  if (
    (m = sb.effects.match(/^Casts a random (.*) attack, grants Rage to the user for (\d+) turns?/))
  ) {
    const [, rageSkill, turns] = m;
    if (rageSkill === sb.name) {
      isPureRage = true;
      rageTurns = +turns;
    }
  } else if ((m = sb.effects.match(/^(.*), grants Rage to the user for (\d+) turns?/))) {
    const [, effects, turns] = m;
    const rageSkills = getRageSkills(sb);
    if (rageSkills.length === 1 && rageSkills[0].effects === effects) {
      isPureRage = true;
      rageTurns = +turns;
    }
  }
  if (isPureRage && rageTurns) {
    const rageStatus = parseEnlirStatus('Rage', sb);
    const description = formatDuration(rageTurns + 1, 'turn') + ': ' + rageStatus.description;

    // Hack: We're taking advantage of our knowledge of which rage skills exist
    // here - only Gau's BSB's cmd2 is non-damaging.
    const isNonDamage = 'school' in sb && sb.school === 'Special';
    if (isNonDamage) {
      other.push(description);
    } else {
      damage = description;
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
    opt.burstCommands &&
    _.some(opt.burstCommands, i =>
      i.effects.match(new RegExp(' (scaling|scal\\.) with ' + sb.name + ' uses')),
    )
  ) {
    // Hack: In practice, it's always command 1 that does the powering up.
    other.push('powers up cmd 2');
  }

  if (
    (m = sb.effects.match(
      /[Rr]estores HP( to all allies| to the user| to the lowest HP% ally)? for (\d+)% of (?:their|the target's|the user's) max\.?(:?imum)? HP/i,
    ))
  ) {
    const [, who, healPercent] = m;
    const heal = `heal ${healPercent}% HP`;
    if (who === ' to all allies' || (!who && sb.target === 'All allies')) {
      partyOther.push(heal);
    } else if (who === ' to the user' || (!who && sb.target === 'Self')) {
      selfOther.push(heal);
    } else if (who === ' to the lowest HP% ally') {
      other.push('ally ' + heal);
    } else {
      // Fallback
      other.push(heal);
    }
  }

  if ((m = sb.effects.match(/(?:heals|restores HP to) the user for (\d+)% of the damage dealt/))) {
    const [, healPercent] = m;
    selfOther.push(`heal ${healPercent}% of dmg`);
  }

  if ((m = sb.effects.match(/damages the user for ([0-9.]+)% max\.?(?:imum)? HP/))) {
    const [, damagePercent] = m;
    selfOther.push(`lose ${damagePercent}% max HP`);
  }

  XRegExp.forEach(sb.effects, healRe, match => {
    const {
      healFactor,
      fixedHp,
      who,
      rank,
      ifAllyAlive,
    } = (match as unknown) as XRegExpNamedGroups;
    let heal = healFactor ? 'h' + healFactor : `heal ${toMrPKilo(+fixedHp)}`;
    if (healFactor && sb.type === 'NAT') {
      heal += ' (NAT)';
    }
    if (rank) {
      heal += ' @ rank 1-5'; // rank-based healing chase - used by Lenna's AASB
    }
    if (ifAllyAlive) {
      heal += ' if ' + ifAllyAlive + ' alive';
    }
    if (who === ' to all allies' || (!who && sb.target === 'All allies')) {
      partyOther.push(heal);
    } else if (who === ' to the user' || (!who && sb.target === 'Self')) {
      selfOther.push(heal);
    } else if (who === ' to the lowest HP% ally') {
      other.push('ally ' + heal);
    } else if (isSoulBreak(sb) && sb.target.startsWith('Single')) {
      // Because medica soul breaks are so common, we'll call out when a SB
      // only heals one person.
      other.push('ally ' + heal);
    } else {
      // Fallback
      other.push(heal);
    }
  });

  const dispelEsunaRe = /[Rr]emoves (positive|negative) (?:status )?effects( to all allies| to a random ally with negative(?: status)? effects)?/g;
  while ((m = dispelEsunaRe.exec(sb.effects))) {
    const [, dispelOrEsuna, who] = m;
    const effect = dispelOrEsuna === 'positive' ? 'Dispel' : 'Esuna';
    if (!who && attack) {
      // No need to list an explicit target - it's the same as the attack
      other.push(effect);
    } else if (!who && sb.target === 'All enemies') {
      aoeOther.push(effect);
    } else if (!who && sb.target.startsWith('Single')) {
      other.push(effect);
    } else if (who && who.startsWith(' to a random ally')) {
      other.push('ally ' + effect);
    } else if (who === ' to all allies' || (!who && sb.target === 'All allies')) {
      partyOther.push(effect);
    } else {
      // Fallback
      other.push(effect);
    }
  }

  XRegExp.forEach(sb.effects, statusEffectRe, match => {
    const { verb, statusString } = (match as unknown) as XRegExpNamedGroups;
    const removes = verb.toLowerCase() === 'removes';
    const wholeClause = match[0];
    const status = splitSkillStatuses(statusString)
      .map(i => parseStatusItem(i, wholeClause))
      .reduce(checkForAndStatuses, [])
      .sort(sortStatus);
    status.forEach((thisStatus, thisStatusIndex) => {
      // tslint:disable: prefer-const
      let {
        statusName,
        duration,
        durationUnits,
        who,
        chance,
        scalesWithUses,
        rank,
        stacking,
        condition,
      } = thisStatus;
      // tslint:enable: prefer-const

      if (!includeStatus(statusName, { removes })) {
        return;
      }

      if (statusName === 'Rage' && isPureRage) {
        return;
      }

      const parsed = parseEnlirStatusWithSlashes(statusName, sb);
      // tslint:disable: prefer-const
      let {
        description,
        isExLike,
        isDetail,
        isBurstToggle,
        isTrance,
        defaultDuration,
        isVariableDuration,
        specialDuration,
        optionCount,
      } = parsed;
      // tslint:enable: prefer-const

      if (isBurstToggle) {
        burstToggle = verb.toLowerCase() !== 'removes';
        if (description === '') {
          return;
        }
        // Special case: A burst toggle with an effect of its own.  If we're
        // switching it ON, show it with a custom duration.  If switching OFF,
        // show nothing.
        if (burstToggle) {
          specialDuration = 'until OFF';
        } else {
          return;
        }
      }

      // Status removal.  In practice, only a few White Magic abilities hit
      // this; the rest are special cased (Esuna, burst toggles, etc.).
      //
      // Hack: Text like "removes negative effects, +100% DEF" is actually
      // a removes then grants.  There are no occurrences of "removes A, B" in
      // the spreadsheet, so we can key off of the status index to handle that.
      if (removes && thisStatusIndex === 0) {
        description = 'remove ' + description;
      }

      if (isTrance) {
        description = 'Trance: ' + description;
      }
      if (scalesWithUses) {
        description += ' ' + formatUseCount(optionCount);
      }
      if (stacking) {
        description = 'stacking ' + description;
      }
      if (rank) {
        description += ' @ rank 1-5';
      }
      if (condition) {
        description += ' ' + condition;
      }

      if (!duration && defaultDuration) {
        duration = defaultDuration;
        durationUnits = 'second';
      }

      const chanceDescription = chance ? formatChance(chance, attack) : '';

      if ((duration || specialDuration) && !isVariableDuration) {
        const durationText = specialDuration || formatDuration(duration!, durationUnits!);
        if (isExLike) {
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
      } else if (!who && attack) {
        // No need to list an explicit target - it's the same as the attack
        other.push(description);
      } else if (!who && sb.target === 'All enemies') {
        aoeOther.push(description);
      } else if (who === ' to the user' || (!who && sb.target === 'Self')) {
        selfOther.push(description);
      } else if (who === ' to all allies' || (!who && sb.target === 'All allies')) {
        partyOther.push(description);
      } else if (who && who.match(/random ally/)) {
        other.push('ally ' + description);
      } else {
        other.push(description);
      }
    });
  });

  // Process stat mods.  Stop at the first "Grants" or "Causes" text; any stat
  // mods there are handled along with status effects above.
  XRegExp.forEach(
    sb.effects.replace(/([Gg]rants|[Cc]auses|[Rr]emoves) .*/, ''),
    statModRe,
    ({ stats, percent, who, duration, scalesWithUses, atStatus, atStatusCount }: any) => {
      const combinedStats = describeStats(stats.match(/[A-Z]{3}/g)!);
      let statMod = percent.replace(' ', '') + '% ';
      statMod += combinedStats;
      if (scalesWithUses) {
        statMod += ' ' + formatUseCount(countMatches(percent, /\//g) + 1);
      }
      statMod += ` ${duration}s`;
      if (atStatus) {
        statMod += ' at ' + atStatus + ' ' + atStatusCount;
      }

      if (who === ' to the user' || (!who && sb.target === 'Self')) {
        selfOther.push(statMod);
      } else if (who === ' to all allies' || (!who && sb.target === 'All allies')) {
        partyOther.push(statMod);
      } else if (!who && attack) {
        // No need to list an explicit target - it's the same as the attack
        other.push(statMod);
      } else if (sb.target === 'All enemies') {
        aoeOther.push(statMod);
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
    other.push(resolveStatusAlias(`Attach ${element} Stacking`) + ' 25s');
  }

  if ((m = sb.effects.match(/Attach (\w+)(?: |,|$)(?! Stacking)/))) {
    const [, element] = m;
    other.push(resolveStatusAlias(`Attach ${element}`) + ' 25s');
  }

  if (
    (m = sb.effects.match(/[Rr]estores (\d+) consumed ability use( to the user| to all allies)?/))
  ) {
    const [, amount, who] = m;
    const ether = formatRandomEther(amount);
    if (who === ' to the user' || (!who && sb.target === 'Self')) {
      selfOther.push(ether);
    } else if (who === ' to all allies' || (!who && sb.target === 'All allies')) {
      partyOther.push(ether);
    } else {
      // Fallback
      other.push(ether);
    }
  }
  if ((m = sb.effects.match(/(\w+ )?[Ss]mart (\w+ )?ether (\S+)( to the user| to all allies)?/))) {
    const [, type1, type2, amount, who] = m;

    // Process type (e.g., "smart summoning ether").  FFRK Community is
    // inconsistent - sometimes "Summoning smart ether," sometimes
    // "smart summoning ether."
    // TODO: Fix that inconsistency
    let type = type1 && type1 !== 'and ' ? type1 : type2;
    if (type) {
      type = getShortName(_.upperFirst(type.trim()));
    }

    const ether = formatSmartEther(amount, type);
    if (who === ' to the user' || (!who && sb.target === 'Self')) {
      selfOther.push(ether);
    } else if (who === ' to all allies' || (!who && sb.target === 'All allies')) {
      partyOther.push(ether);
    } else {
      // Fallback
      other.push(ether);
    }
  }

  if (
    (m = sb.effects.match(
      /(?:(\d+)% chance to )?[Cc]asts? the last ability used by an ally(.*)?, default ability \(PHY: single, 1.50 physical\)/,
    ))
  ) {
    const [, percentChance, times] = m;
    let description = 'Mimic';
    const timesNumber = (times && parseNumberOccurrence(times.trim())) || 1;

    // For brave commands in particular, we'll want to compare with other
    // numbers, so always include the count.
    if (timesNumber !== 1 || isBraveCommand(sb)) {
      description += ` ${timesNumber}x`;
    }

    if (percentChance) {
      description = `${percentChance}% chance of ` + description;
    }

    other.push(description);
  }

  if (
    (m = sb.effects.match(
      /(\d+) (?:SB|Soul Break) points( to the user| to all allies)?( if successful)?/,
    ))
  ) {
    const [, points, who, ifSuccessful] = m;
    let description = sbPointsAlias(points);
    if (ifSuccessful) {
      description += ' on success';
    }
    if (who === ' to all allies' || (!who && sb.target === 'All allies')) {
      partyOther.push(description);
    } else if (who === ' to the user' || (!who && sb.target === 'Self')) {
      // Unlike most effects, use other, not selfOther, here - SB points may
      // be assumed to be self, so listing self seems redundant.
      other.push(description);
    } else if (sb.target.startsWith('Single')) {
      other.push('ally ' + description);
    } else {
      // Fallback
      other.push(description);
    }
  }
  if ('sb' in sb) {
    if (opt.includeSbPoints && sb.sb === 0) {
      // If we weren't asked to suppress SB points (which we are for follow-ups
      // and finishers, since those don't generate gauge), then call out
      // anything that doesn't generate gauge.
      other.push('no SB pts');
    } else if (sb.sb >= 150) {
      // If this skill grants an abnormally high number of SB points, show it.
      // We set a flat rate of 150 (to get Lifesiphon and Wrath) instead of
      // trying to track what's normal at each rarity level.
      other.push(sbPointsAlias(sb.sb.toString()));
    }
  }

  if ((m = sb.effects.match(/cast time ([-+]?[0-9.]+) for each previous use/))) {
    const [, castTime] = m;
    other.push('cast time ' + castTime + 's per use');
  }
  if ((m = sb.effects.match(/cast time ((:?[0-9.]+\/)+[0-9.]+) scaling with uses/))) {
    const [, castTime] = m;
    other.push('cast time ' + castTime + ' ' + formatUseCount(castTime.split(/\//).length));
  }

  if (statusInfliction.length) {
    other.splice(0, 0, formatStatusInfliction(statusInfliction));
  }

  if (
    isGlint(sb) &&
    !damage &&
    !other.length &&
    !aoeOther.length &&
    !partyOther.length &&
    !detailOther.length
  ) {
    // If it's a glint with only self effects, then "self" is redundant.
    other.push(...checkBurstAndBraveMode(selfOther));
  } else {
    appendGroup(other, aoeOther, 'AoE');
    appendGroup(other, partyOther, 'party');
    appendGroup(other, checkBurstAndBraveMode(selfOther), 'self');
    appendGroup(other, detailOther);
  }

  if (sb.effects.endsWith(', reset')) {
    other.push('reset count');
  }

  const result: MrPSoulBreak = {
    damage: damage || undefined,
    other: other.length ? other.join(', ') : undefined,
  };

  if (sb.time != null) {
    if (sb.time <= 0.01) {
      result.instant = true;
    } else if (sb.time < 1.2 || (isSoulBreak(sb) && sb.time && sb.time <= 1.25)) {
      result.fast = true;
    } else if (!isSoulBreak(sb) && sb.time && sb.time > 2) {
      result.slow = true;
    }
  }

  if (chain) {
    result.chain = chain;
  }
  if ('school' in sb) {
    result.school = sb.school;
  }
  if (burstToggle != null) {
    result.burstToggle = burstToggle;
  }

  if (
    isBurst(sb) &&
    enlir.burstCommands[sb.character] &&
    enlir.burstCommands[sb.character][sb.name]
  ) {
    const burstCommands = enlir.burstCommands[sb.character][sb.name];
    result.burstCommands = burstCommands.map(i =>
      describeEnlirSoulBreak(i, { abbreviate: true, includeSchool: false, burstCommands }),
    );
  }
  if (
    isBrave(sb) &&
    enlir.braveCommands[sb.character] &&
    enlir.braveCommands[sb.character][sb.name]
  ) {
    result.braveCommands = enlir.braveCommands[sb.character][sb.name].map(i =>
      describeEnlirSoulBreak(i, { abbreviate: true, includeSchool: false }),
    );
  }
  return result;
}

interface FormatOptions {
  showTime: boolean;
}

function describeMrPTime({ instant, fast, slow }: MrPSoulBreak): string | null {
  if (instant) {
    return 'instant';
  } else if (fast) {
    return 'fast';
  } else if (slow) {
    return 'slow';
  } else {
    return null;
  }
}

export function formatMrP(mrP: MrPSoulBreak, options: Partial<FormatOptions> = {}): string {
  const opt: FormatOptions = {
    showTime: true,
    ...options,
  };

  const burstToggleText = mrP.burstToggle == null ? '' : mrP.burstToggle ? 'ON' : 'OFF';
  let text = _.filter([burstToggleText, mrP.chain, mrP.damage, mrP.other]).join(', ');
  if (text && opt.showTime) {
    const time = describeMrPTime(mrP);
    text = (time ? time + ' ' : '') + text;
  }
  return text;
}

// TODO: Hide min damage?  Hide school for percent-based finishers?
// TODO: Handle element '?' - it's not a valid EnlirElement and so is rejected by our schemas, even thought it can appear in the data
// TODO: Slash-combine items like Amarant lightning+fire vuln. or Celes' element boosts - and ideally remove patchEnlir
// TODO: Use × for times; make Unicode selectable?
// TODO: Redo percent random attacks to match MrP's Fujin?
