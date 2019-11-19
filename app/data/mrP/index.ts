import * as _ from 'lodash';
import * as XRegExp from 'xregexp';

import { isAllSame } from '../../utils/typeUtils';
import {
  enlir,
  EnlirBurstCommand,
  EnlirElement,
  EnlirSchool,
  EnlirSkill,
  EnlirSynchroCommand,
  getNormalSBPoints,
  isAbility,
  isBraveCommand,
  isBraveSoulBreak,
  isBurstSoulBreak,
  isEnlirElement,
  isGlint,
  isSoulBreak,
  isSynchroSoulBreak,
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
  shareStatusDurations,
  slashMergeElementStatuses,
  sortStatus,
  StatusItem,
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
} from './typeHelpers';
import {
  countMatches,
  describeChances,
  formatUseCount,
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
  schoolDetails?: EnlirSchool[];

  /**
   * If set, this indicates whether this is a burst command that toggles the
   * burst status ON or OFF.
   */
  burstToggle?: boolean;

  burstCommands?: MrPSoulBreak[];
  braveCondition?: Array<EnlirElement | EnlirSchool>;
  braveCommands?: MrPSoulBreak[];
  synchroCommands?: MrPSoulBreak[];
  synchroCondition?: Array<EnlirElement | EnlirSchool>;
}

function appendGroup(outGroup: string[], inGroup: string[], description?: string) {
  if (inGroup.length) {
    outGroup.push((description ? description + ' ' : '') + inGroup.join(', '));
  }
}

interface StatusInfliction {
  description: string;
  chance: number | number[];
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

function shouldIncludeStatusItem(item: StatusItem): boolean {
  if (item.statusName === 'Instant KO' && item.condition === 'if undead' && item.chance === 100) {
    // Raise effects cause instant KO to undead, but that's fairly niche; omit.
    return false;
  }
  return true;
}

function formatDamageType(damageType: MrPDamageType, abbreviate: boolean): string {
  return abbreviate ? damageTypeAbbreviation(damageType) : damageType + ' ';
}

const statusEffectRe = XRegExp(
  String.raw`
  (?<verb>[Gg]rants|[Cc]auses|[Rr]emoves|[Dd]oesn't\ remove)\ #

  (?<statusString>(?:.*?(?:,?\ and\ |,\ ))*?(?:.*?))

  # Anchor the regex to end at anything that looks like the beginning of a new effect.
  (?=
    ,\ grants|,\ causes|,\ removes|,\ doesn't\ remove|,\ restores\ HP\ |
    ,\ damages\ the\ user\ |
    ,\ heals\ the\ user\ |
    ,\ casts\ the\ last\ ability\ used\ by\ an\ ally\b|
    ,\ reset|
  $)
  `,
  'x',
);

interface DescribeOptions {
  abbreviate: boolean;
  abbreviateDamageType: boolean;
  showNoMiss: boolean;
  includeSchool: boolean;
  includeSbPoints: boolean;

  prereqStatus: string | undefined;
  burstCommands: EnlirBurstCommand[] | undefined;
  synchroCommands: EnlirSynchroCommand[] | undefined;
}

function describeEnlirAttack(
  skill: EnlirSkill,
  attack: ParsedEnlirAttack,
  opt: DescribeOptions,
): [string, StatusInfliction[]] {
  let damage = '';
  const statusInfliction: StatusInfliction[] = [];

  const abbreviate = opt.abbreviate || opt.abbreviateDamageType || !!attack.hybridDamageType;
  damage += attack.isAoE ? 'AoE ' : '';
  damage += attack.randomChances ? attack.randomChances + ' ' : '';
  damage += !attack.isFixedDamage ? formatDamageType(attack.damageType, abbreviate) : '';
  damage += attack.isPiercing ? '^' : '';
  damage += attack.damage;

  if (attack.hybridDamageType) {
    damage += ' or ';
    damage += formatDamageType(attack.hybridDamageType, abbreviate);
    damage += attack.hybridIsPiercing ? '^' : '';
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
      (attack.scaleDown ? ', down to ' : ', up to ') +
      damageTypeAbbreviation(attack.damageType) +
      attack.scaleToDamage +
      ' ' +
      attack.scaleType;
  }
  if (attack.defaultDamage) {
    damage += ', default ' + damageTypeAbbreviation(attack.damageType) + attack.defaultDamage;
  }
  if (attack.minDamage) {
    // Is this best?  It's noisy, and MrP rarely included it, but it's commonly
    // discussed with, e.g., Ark 5* magicite.
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
  if (attack.airTime) {
    damage += ', air time ' + attack.airTime + 's';
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
      chanceDescription: attack.statusChance.join('/') + '%',
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
    abbreviateDamageType: false,
    showNoMiss: true,
    includeSchool: true,
    includeSbPoints: true,
    prereqStatus: undefined,
    burstCommands: undefined,
    synchroCommands: undefined,
    ...options,
  };

  let m: RegExpMatchArray | null;
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
  const sameRowOther: string[] = [];
  const partyOther: string[] = [];
  const detailOther: string[] = [];

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

  if (
    opt.burstCommands &&
    _.some(opt.burstCommands, i =>
      i.effects.match(new RegExp(' (scaling|scal\\.) with ' + _.escapeRegExp(sb.name) + ' uses')),
    )
  ) {
    // Hack: In practice, it's always command 1 that does the powering up.
    other.push('powers up cmd 2');
  }
  if (opt.synchroCommands) {
    const powerUp = _.findIndex(
      opt.synchroCommands,
      i =>
        !!i.effects.match(
          new RegExp(' (scaling|scal\\.) with ' + _.escapeRegExp(sb.name) + ' uses'),
        ),
    );
    if (powerUp !== -1) {
      other.push(`powers up cmd ${powerUp + 1}`);
    }
  }

  XRegExp.forEach(sb.effects, statusEffectRe, match => {
    const { verb, statusString } = (match as unknown) as XRegExpNamedGroups;

    // Confuse Shell doesn't remove Confuse - this is a special case, skip.
    if (verb.toLowerCase() === "doesn't remove") {
      return;
    }

    const removes = verb.toLowerCase() === 'removes';
    const wholeClause = match[0];
    const status = splitSkillStatuses(statusString)
      .map(i => parseStatusItem(i, wholeClause))
      .filter(shouldIncludeStatusItem)
      .reduce(checkForAndStatuses, [])
      .reduce(shareStatusDurations, [])
      .reduce(slashMergeElementStatuses, [])
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

      if ('source' in sb && sb.source === statusName && removes) {
        if (selfOther.length) {
          selfOther.push('once only');
        } else {
          other.push('once only');
        }
        return;
      }

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

      if (description === '') {
        return;
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
      if (stacking) {
        description = 'stacking ' + description;
      }
      if (scalesWithUses) {
        description += ' ' + formatUseCount(optionCount);
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
      } else if (who === " to all allies in the character's row") {
        sameRowOther.push(description);
      } else if (who && who.match(/random ally/)) {
        other.push('ally ' + description);
      } else {
        other.push(description);
      }
    });
  });

  if (statusInfliction.length) {
    other.splice(0, 0, formatStatusInfliction(statusInfliction));
  }

  const result: MrPSoulBreak = {
    damage: damage || undefined,
    other: other.length ? other.join(', ') : undefined,
  };

  return result;
}
