import * as _ from 'lodash';

import { logException, logger } from '../../utils/logger';
import { assertNever, isAllSame } from '../../utils/typeUtils';
import {
  enlir,
  EnlirElement,
  EnlirSchool,
  EnlirSkill,
  EnlirTarget,
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
import {
  describeAttack,
  describeFixedAttack,
  describeGravityAttack,
  describeHpAttack,
  describeRandomFixedAttack,
  formatAttackStatusChance,
  formatRandomCastAbility,
  formatRandomCastOther,
} from './attack';
import {
  appendCondition,
  describeCondition,
  excludeCondition,
  findCondition,
  visitCondition,
} from './condition';
import { checkPureRage } from './rage';
import * as skillParser from './skillParser';
import * as skillTypes from './skillTypes';
import {
  checkForAndStatuses,
  describeStats,
  formatDuration,
  parseEnlirStatus,
  parseEnlirStatusWithSlashes,
  shareStatusDurations,
  shareStatusWho,
  slashMergeElementStatuses,
  sortStatus,
} from './status';
import { formatRandomEther, formatSmartEther, sbPointsAlias } from './statusAlias';
import {
  DescribeOptions,
  getDescribeOptionsWithDefaults,
  getElementShortName,
} from './typeHelpers';
import {
  fixedNumberOrUnknown,
  formatNumberSlashList,
  formatSignedIntegerSlashList,
  toMrPFixed,
  toMrPKilo,
} from './util';

export function safeParseSkill(skill: EnlirSkill): skillTypes.SkillEffect | null {
  try {
    return skillParser.parse(skill.effects);
  } catch (e) {
    logger.error(`Failed to parse ${skill.name}:`);
    logException(e);
    if (e.name === 'SyntaxError') {
      return null;
    }
    throw e;
  }
}

function findFirstEffect<T extends skillTypes.EffectClause>(
  skillEffects: skillTypes.SkillEffect,
  type: T['type'],
): T | undefined {
  for (const i of skillEffects) {
    if (i.type === type) {
      return i as T;
    }
  }
  return undefined;
}

function sortSkillEffects(skillEffects: skillTypes.SkillEffect): skillTypes.SkillEffect {
  const result: skillTypes.SkillEffect = [];
  for (let i = 0; i < skillEffects.length; i++) {
    if (skillEffects[i].type === 'statMod') {
      const firstStatMod = i;
      const lastStatMod = _.findIndex(skillEffects, e => e.type !== 'statMod', firstStatMod) - 1;
      const firstStatus =
        lastStatMod < 0 ? -1 : _.findIndex(skillEffects, e => e.type === 'status', lastStatMod + 1);
      const lastStatus =
        firstStatus < 0 ? -1 : _.findIndex(skillEffects, e => e.type !== 'status', firstStatus) - 1;
      if (lastStatMod >= 0 && firstStatus >= 0 && lastStatMod + 1 === firstStatus) {
        result.push(
          ...skillEffects.slice(firstStatus, lastStatus < 0 ? undefined : lastStatus + 1),
        );
        result.push(...skillEffects.slice(firstStatMod, lastStatMod + 1));
        i = lastStatus < 0 ? result.length : lastStatus;
        continue;
      }
    }
    result.push(skillEffects[i]);
  }
  return result;
}

/**
 * Stat modifications default to 25 seconds.
 */
const defaultStatModDuration: skillTypes.Duration = {
  value: 25,
  units: 'seconds',
};

function isHybridStatSet(statSet: skillTypes.StatSet): statSet is skillTypes.HybridStatSet {
  return statSet.length === 2 && Array.isArray(statSet[0]);
}

function describeChain({ chainType, fieldBonus, max }: skillTypes.Chain): string {
  let chain = (isEnlirElement(chainType) ? getElementShortName(chainType) : chainType) + ' chain';
  chain += ' ' + toMrPFixed(1 + +fieldBonus / 100) + 'x';
  chain += ` (max ${max})`;
  return chain;
}

function describeDrainHp({ healPercent, condition }: skillTypes.DrainHp): string {
  return `heal ${healPercent}% of dmg` + appendCondition(condition);
}

function describeHeal(skill: EnlirSkill, { amount, condition }: skillTypes.Heal): string {
  let heal: string;
  let count: number | number[] | undefined;
  if ('healFactor' in amount) {
    heal = 'h' + formatNumberSlashList(amount.healFactor);
    count = amount.healFactor;
  } else {
    heal = 'heal ' + formatNumberSlashList(amount.fixedHp, i => toMrPKilo(i, true));
    count = amount.fixedHp;
  }
  if ('healFactor' in amount && skill.type === 'NAT') {
    heal += ' (NAT)';
  }
  heal += appendCondition(condition, count);
  return heal;
}

function describeMimic(skill: EnlirSkill, { chance, count }: skillTypes.Mimic): string {
  let description = 'Mimic';

  // For brave commands in particular, we'll want to compare with other
  // numbers, so always include the count.
  count = count || 1;
  if (count > 1 || isBraveCommand(skill)) {
    description += ` ${count || 1}x`;
  }

  if (chance) {
    description = `${chance}% chance of ` + description;
  }

  return description;
}

export function describeRecoilHp({
  damagePercent,
  maxOrCurrent,
  condition,
}: skillTypes.RecoilHp): string {
  return (
    `lose ${formatNumberSlashList(damagePercent)}% ${maxOrCurrent} HP` + appendCondition(condition)
  );
}

function describeStatMod({ stats, percent, duration, condition }: skillTypes.StatMod): string {
  duration = duration || defaultStatModDuration;

  const combinedStats = isHybridStatSet(stats)
    ? describeStats(stats[0]) + ' or ' + describeStats(stats[1])
    : describeStats(stats);
  let statMod = formatSignedIntegerSlashList(percent) + '% ';
  statMod += combinedStats;
  statMod += ` ` + formatDuration(duration);
  statMod += appendCondition(condition, percent);

  return statMod;
}

function formatStatusLevel(value: number) {
  if (value === 0) {
    return 'reset status lvl';
  } else {
    return `status lvl =${value}`;
  }
}

function findOtherSkill(skill: EnlirSkill, otherSkills: EnlirSkill[] | undefined) {
  if (!otherSkills) {
    return null;
  }
  const index = _.findIndex(otherSkills, i => i !== skill);
  if (index !== -1) {
    return {
      skill: otherSkills[index],
      index,
    };
  }
  return null;
}

function scalesWithSkill(skill: EnlirSkill): (condition: skillTypes.Condition) => boolean {
  return (condition: skillTypes.Condition) =>
    condition.type === 'scaleWithSkillUses' && condition.skill === skill.name;
}

/**
 * Checks if this skill powers up its paired skill (cmd 1/2 if this is cmd 2/1
 * of a burst soul break or synchro soul break).  We represent that a bit
 * differently - instead of saying that cmd 2 scales with cmd 1, we say that
 * cmd 1 powers up cmd 2.  (We do this partly because that's what MrP did and
 * partly because cmd 1 tends to be shorter.)
 */
function checkPowersUp(skill: EnlirSkill, opt: DescribeOptions): string | null {
  const paired =
    findOtherSkill(skill, opt.burstCommands) || findOtherSkill(skill, opt.synchroCommands);
  if (!paired) {
    return null;
  }

  const pairedEffects = safeParseSkill(paired.skill);
  if (!pairedEffects) {
    return null;
  }

  if (findCondition(pairedEffects, scalesWithSkill(skill))) {
    return `powers up cmd ${paired.index + 1}`;
  } else {
    return null;
  }
}

/**
 * See checkPowersUp.  This also handles the case where one command is affected
 * by a non-standard status from the other command. (The "Unbound Fury" status
 * used by some monk characters' bursts is the main or only example.)
 */
function checkPoweredUpBy(
  skill: EnlirSkill,
  effects: skillTypes.SkillEffect,
  opt: DescribeOptions,
) {
  // Find the paired command
  const paired =
    findOtherSkill(skill, opt.burstCommands) || findOtherSkill(skill, opt.synchroCommands);
  if (!paired) {
    return;
  }

  // Remove all references to this skill scaling with the paired command; let
  // checkPowersUp handle that instead.
  excludeCondition(effects, scalesWithSkill(paired.skill));

  const pairedEffects = safeParseSkill(paired.skill);
  if (!pairedEffects) {
    return;
  }

  // Check if this skill scales with itself and if we can reasonably omit the
  // skill name.
  visitCondition((condition: skillTypes.Condition) => {
    if (condition.type === 'afterUseCount' && condition.skill === skill.name) {
      return [
        {
          ...condition,
          skill: undefined,
        },
        true,
      ];
    } else {
      return [null, true];
    }
  }, effects);

  // Check if this skill scales with a nonstandard status granted by the paired
  // command.
  let pairedStatus: string | undefined;
  for (const i of pairedEffects) {
    if (i.type === 'status') {
      for (const j of i.statuses) {
        if (j.who === 'self' && typeof j.status === 'string') {
          pairedStatus = j.status;
          break;
        }
      }
      if (pairedStatus) {
        break;
      }
    }
  }
  if (!pairedStatus) {
    return;
  }
  visitCondition((condition: skillTypes.Condition) => {
    if (
      condition.type === 'status' &&
      condition.status === pairedStatus &&
      condition.who === 'self'
    ) {
      return [{ ...condition, status: `cmd ${paired.index + 1} status` }, false];
    } else {
      return [null, true];
    }
  }, effects);
}

function checkSbPoints(skill: EnlirSkill, effects: skillTypes.SkillEffect, opt: DescribeOptions) {
  if ('sb' in skill && skill.sb != null) {
    if (opt.includeSbPoints && skill.sb === 0) {
      // If we weren't asked to suppress SB points (which we do for follow-ups
      // and finishers, since those don't generate gauge), then call out
      // anything that doesn't generate gauge.
      return 'no SB pts';
    } else if (skill.sb >= 150) {
      // If this skill grants an abnormally high number of SB points, show it.
      // We set a flat rate of 150 (to get Lifesiphon and Wrath) instead of
      // trying to track what's normal at each rarity level.
      return sbPointsAlias(skill.sb);
    } else if (isAbility(skill) && skill.sb < getNormalSBPoints(skill)) {
      // Special case: Exclude abilities like Lightning Jab that have a normal
      // default cast time but "fast" tier SB generation because they
      // manipulate cast time.
      if (!effects.find(i => i.type === 'castTime' || i.type === 'castTimePerUse')) {
        return 'low SB pts';
      }
    }
  }

  return null;
}

function checkAttackStatus(skill: EnlirSkill, { status }: skillTypes.Attack, other: OtherDetail) {
  if (!status) {
    return;
  }
  const { description, defaultDuration } = parseEnlirStatus(status.status, skill);
  const duration =
    status.duration || (defaultDuration ? { value: defaultDuration, units: 'seconds' } : undefined);
  // Semi-hack: Attack statuses are usually or always imperils, and text
  // like '35% +10% fire vuln.' looks weird.  Like MrP, we insert a 'for'
  // to make it a bit clearer.
  other.statusInfliction.push({
    description: 'for ' + description + (duration ? ' ' + formatDuration(duration) : ''),
    chance: status.chance,
    chanceDescription: formatNumberSlashList(status.chance) + '%',
  });
}

function checkTime(skill: EnlirSkill, result: MrPSkill) {
  if (skill.time != null) {
    const time = skill.time;
    if (time <= 0.01) {
      result.instant = true;
    } else if (time < 1.2 || (isSoulBreak(skill) && time <= 1.25)) {
      result.fast = true;
    } else if (time >= 3.75 || (!isSoulBreak(skill) && time > 2)) {
      result.slow = true;
    }
  }
}

function checkBurstCommands(skill: EnlirSkill, result: MrPSkill) {
  if (
    isSoulBreak(skill) &&
    isBurstSoulBreak(skill) &&
    skill.character &&
    enlir.burstCommandsByCharacter[skill.character] &&
    enlir.burstCommandsByCharacter[skill.character][skill.name]
  ) {
    const burstCommands = enlir.burstCommandsByCharacter[skill.character][skill.name];
    result.burstCommands = burstCommands.map(i =>
      convertEnlirSkillToMrP(i, { abbreviate: true, includeSchool: false, burstCommands }),
    );
  }
}

function checkBraveCommands(skill: EnlirSkill, result: MrPSkill) {
  if (
    isSoulBreak(skill) &&
    isBraveSoulBreak(skill) &&
    skill.character &&
    enlir.braveCommandsByCharacter[skill.character] &&
    enlir.braveCommandsByCharacter[skill.character][skill.name]
  ) {
    const braveCommands = enlir.braveCommandsByCharacter[skill.character][skill.name];
    result.braveCondition = braveCommands[0].braveCondition;
    result.braveCommands = braveCommands.map(i =>
      convertEnlirSkillToMrP(i, { abbreviate: true, includeSchool: false }),
    );
  }
}

function checkSynchroCommands(skill: EnlirSkill, result: MrPSkill) {
  if (
    isSoulBreak(skill) &&
    isSynchroSoulBreak(skill) &&
    skill.character &&
    enlir.synchroCommandsByCharacter[skill.character] &&
    enlir.synchroCommandsByCharacter[skill.character][skill.name]
  ) {
    const synchroCommands = enlir.synchroCommandsByCharacter[skill.character][skill.name];
    result.synchroCondition = synchroCommands.map(i => i.synchroCondition);
    result.synchroCommands = synchroCommands.map(i =>
      convertEnlirSkillToMrP(i, { abbreviate: true, includeSchool: false, synchroCommands }),
    );
  }
}

function shouldIncludeStatus(skill: EnlirSkill) {
  const isBurst = isSoulBreak(skill) && isBurstSoulBreak(skill);
  return ({ status, chance, who, ifUndead }: skillTypes.StatusWithPercent): boolean => {
    // Enlir lists Burst Mode and Haste for all BSBs and lists Brave Mode for all
    // all Brave Ultra Soul Breaks, but MrP's format doesn't.
    if (status === 'Brave Mode' || status === 'Burst Mode' || status === 'Synchro Mode') {
      return false;
    }
    if (isBurst && status === 'Haste' && (who === 'self' || (!who && skill.target === 'Self'))) {
      // All burst soul breaks provide Haste, so listing it is redundant.
      return false;
    }

    if (status === 'Instant KO' && ifUndead && chance === 100) {
      // Raise effects cause instant KO to undead, but that's fairly niche; omit.
      return false;
    }
    return true;
  };
}

/**
 * Checks for stacking statuses, like "Warlord Mode 1/2/3/3 if the user has
 * Warlord Mode 0/1/2/3"
 */
function checkStacking(
  status: skillTypes.StatusWithPercent,
): [skillTypes.StatusWithPercent['status'], boolean] {
  if (
    typeof status.status !== 'string' ||
    !status.condition ||
    status.condition.type !== 'status'
  ) {
    return [status.status, false];
  }

  let statusName = status.status;
  const prereq = status.condition.status;
  if (statusName.replace(/[0-9\/]+/, 'X') === prereq.replace(/[0-9\/]+/, 'X')) {
    // Enlir lists, e.g., 'Warlord Mode 1/2/3/3' to show that it doesn't stack
    // further.  Remove the redundancy.
    statusName = statusName.replace(/(\d)\/\1/, '$1');
    return [statusName, true];
  }

  return [statusName, false];
}

/**
 * Process a status, and return whether this is a burst toggle.
 */
function processStatus(
  skill: EnlirSkill,
  skillEffects: skillTypes.SkillEffect,
  effect: skillTypes.StatusEffect,
  other: OtherDetail,
): boolean | undefined {
  // Confuse Shell doesn't remove Confuse - this is a special case, skip.
  if (effect.verb === "doesn't remove") {
    return;
  }

  let burstToggle: boolean | undefined;

  const removes = effect.verb === 'removes';
  const statuses = effect.statuses
    .reduce(shareStatusWho, [])
    .filter(shouldIncludeStatus(skill))
    .reduce(checkForAndStatuses, [])
    .reduce(shareStatusDurations, [])
    .reduce(slashMergeElementStatuses, [])
    .sort(sortStatus);
  statuses.forEach((thisStatus, thisStatusIndex) => {
    // tslint:disable: prefer-const
    let { duration, who, chance, condition, perUses, ifSuccessful } = thisStatus;
    // tslint:enable: prefer-const
    const [status, stacking] = checkStacking(thisStatus);

    if (typeof status !== 'string') {
      if (status.type === 'smartEther') {
        other.push(skill, who, formatSmartEther(status.amount, status.school));
      } else {
        other.push(skill, who, formatStatusLevel(status.value));
      }
      return;
    }

    if ('source' in skill && skill.source === status && removes) {
      // TODO: Some inconsistency here between "(once only)", "removes status", and "once only"
      // See, e.g., Enna Kros vs. Cloud vs. Cyan AASBs.
      if (other.self.length) {
        other.self.push('once only');
      } else {
        other.normal.push('once only');
      }
      return;
    }

    const parsed = parseEnlirStatusWithSlashes(status, skill);
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
      burstToggle = effect.verb !== 'removes';
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
    const options = optionCount ? _.times(optionCount, i => i + 1) : undefined;
    if (condition && !stacking) {
      description += appendCondition(condition, options);
    }

    if (!duration && defaultDuration) {
      duration = { value: defaultDuration, units: 'seconds' };
    }

    if ((duration || specialDuration) && !isVariableDuration) {
      const durationText = specialDuration || formatDuration(duration!);
      if (isExLike) {
        description = durationText + ': ' + description;
      } else {
        description = description + ' ' + durationText;
      }
    }

    if (perUses) {
      description += ` per ${perUses} uses`;
    }
    if (ifSuccessful) {
      description += ' on success';
    }

    if (chance) {
      const chanceDescription = formatAttackStatusChance(
        chance,
        findFirstEffect<skillTypes.Attack>(skillEffects, 'attack'),
      );
      other.statusInfliction.push({ description, chance, chanceDescription });
    } else if (description.match(/^\w+ infuse/)) {
      other.infuse.push(description);
    } else if (isDetail) {
      // (Always?) has implied 'self'
      other.detail.push(description);
    } else {
      other.push(skill, who, description);
    }
  });

  return burstToggle;
}

interface StatusInfliction {
  description: string;
  chance: number | number[];
  chanceDescription: string;
}

interface OtherDetailOptions {
  /**
   * If true, then normal/default single targets are shown as "ally".  This is
   * useful for, e.g., healing effects: they're rarely targeted at enemies, and
   * party healing soul breaks are so common that it's worth spelling out when
   * they only target one ally.
   */
  defaultToAlly?: boolean;
}

/**
 * The components of MrPSkill.other, as lists.  We break them up like
 * this so that we can sort general items (e.g., elemental infuse), then
 * self statuses, then party statuses, then "details" (e.g., EX modes).
 */
class OtherDetail {
  normal: string[] = [];
  statusInfliction: StatusInfliction[] = [];
  aoe: string[] = [];
  infuse: string[] = []; // Following MrP, self en-element is listed separately.
  // TODO: Turn most of these into an object indexed by Who
  self: string[] = [];
  sameRow: string[] = [];
  frontRow: string[] = [];
  backRow: string[] = [];
  party: string[] = [];
  ally: string[] = [];
  misc: string[] = [];
  detail: string[] = [];

  push(
    skill: EnlirSkill,
    who: skillTypes.Who | undefined,
    description: string,
    options: OtherDetailOptions = {},
  ) {
    this.getPart(skill, who, options).push(description);
  }

  combine(implicitlyTargetsEnemies: boolean, allowImplicitSelf: boolean): string | undefined {
    let result: string[];
    if (
      allowImplicitSelf &&
      !this.normal.length &&
      !this.statusInfliction.length &&
      !this.aoe.length &&
      !this.sameRow.length &&
      !this.frontRow.length &&
      !this.backRow.length &&
      !this.party.length &&
      !this.ally.length &&
      !this.detail.length
    ) {
      // If, for example, it's a glint with only self effects, then "self" is
      // redundant.
      //
      // But - as an additional hack / special case, infuses still get "self".
      // TODO: Clean this up? I'm not sure it makes sense to have these special cases just because MrP did.
      if (this.infuse.length) {
        result = [...this.infuse, ...this.makeGroup(this.self, 'self'), ...this.misc];
      } else {
        result = [...this.infuse, ...this.self, ...this.misc];
      }
    } else {
      result = [
        ...this.formatStatusInfliction(),
        ...this.normal,
        ...this.makeGroup(this.aoe, implicitlyTargetsEnemies ? undefined : 'AoE'),

        ...this.infuse,

        // Hack: Same row is currently only used for Desch AASB, where it fits
        // naturally before partyOther.
        ...this.makeGroup(this.sameRow, 'same row'),

        // Front and back row are currently unused.
        ...this.makeGroup(this.frontRow, 'front row'),
        ...this.makeGroup(this.backRow, 'back row'),

        ...this.makeGroup(this.ally, 'ally'),
        ...this.makeGroup(this.party, 'party'),
        ...this.makeGroup(this.self, 'self'),
        ...this.misc,
        ...this.makeGroup(this.detail),
      ];
    }
    return result.length ? result.join(', ') : undefined;
  }

  private getPart(
    skill: EnlirSkill,
    who: skillTypes.Who | undefined,
    options: OtherDetailOptions,
  ): string[] {
    return who ? this.getWhoPart(who) : this.getTargetPart(skill.target, options);
  }

  private getTargetPart(target: EnlirTarget | null, options: OtherDetailOptions): string[] {
    switch (target) {
      case 'All enemies':
        return this.aoe;
      case 'Random enemies':
      case 'Random enemy':
      case null:
        return this.normal;
      case 'Self':
        return this.self;
      case 'All allies':
        return this.party;
      case 'Single enemy':
        return this.normal;
      case 'Single ally':
        // As 'Single' and 'Single target', but for the particular case where
        // we already have ally entries, combine them.
        return options.defaultToAlly || this.ally.length ? this.ally : this.normal;
      case 'Single target':
      case 'Single':
        return options.defaultToAlly ? this.ally : this.normal;
      case 'Ally with status':
      case 'Another ally':
      case 'Lowest HP% ally':
      case 'Random ally':
        return this.ally;
    }
  }

  private getWhoPart(who: skillTypes.Who): string[] {
    switch (who) {
      case 'self':
        return this.self;
      case 'target':
        return this.normal;
      case 'enemies':
        return this.aoe;
      case 'sameRow':
        return this.sameRow;
      case 'frontRow':
        return this.frontRow;
      case 'backRow':
        return this.backRow;
      case 'party':
        return this.party;
      case 'ally':
      case 'lowestHpAlly':
      case 'allyWithoutStatus':
      case 'allyWithNegativeStatus':
      case 'allyWithKO':
        return this.ally;
    }
  }

  private makeGroup(inGroup: string[], description?: string) {
    if (inGroup.length) {
      return [(description ? description + ' ' : '') + inGroup.join(', ')];
    } else {
      return [];
    }
  }

  private formatStatusInfliction(): string[] {
    if (!this.statusInfliction.length) {
      return [];
    } else if (isAllSame(this.statusInfliction, i => i.chance)) {
      return [
        this.statusInfliction[0].chanceDescription +
          ' ' +
          this.statusInfliction.map(i => i.description).join('/'),
      ];
    } else {
      return this.statusInfliction.map(i => i.chanceDescription + ' ' + i.description);
    }
  }
}

export interface MrPSkill {
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

  burstCommands?: MrPSkill[];
  braveCondition?: Array<EnlirElement | EnlirSchool>;
  braveCommands?: MrPSkill[];
  synchroCommands?: MrPSkill[];
  synchroCondition?: Array<EnlirElement | EnlirSchool>;
}

export function convertEnlirSkillToMrP(
  skill: EnlirSkill,
  options: Partial<DescribeOptions> = {},
): MrPSkill {
  const opt = getDescribeOptionsWithDefaults(options);

  const result: MrPSkill = {};
  const damage: string[] = [];
  let chain: string | undefined;

  let burstToggle: boolean | undefined;

  // The components of MrPSkill.other, as lists.  We break them up like
  // this so that we can sort general items (e.g., elemental infuse), then
  // self statuses, then party statuses, then "details" (e.g., EX modes).
  //
  // We may start returning these as is so callers can deal with them.
  const other = new OtherDetail();

  let skillEffects = safeParseSkill(skill);
  if (!skillEffects) {
    return result;
  }

  const rageDurationAndEffects = checkPureRage(skill, skillEffects);
  if (rageDurationAndEffects) {
    skillEffects = rageDurationAndEffects[1];
  }
  checkPoweredUpBy(skill, skillEffects, opt);

  skillEffects = sortSkillEffects(skillEffects);

  for (const effect of skillEffects) {
    switch (effect.type) {
      case 'fixedAttack':
        damage.push(describeFixedAttack(skill, effect, opt));
        break;
      case 'attack':
        damage.push(describeAttack(skill, effect, opt));
        checkAttackStatus(skill, effect, other);
        break;
      case 'randomFixedAttack':
        damage.push(describeRandomFixedAttack(effect));
        break;
      case 'drainHp':
        other.self.push(describeDrainHp(effect));
        break;
      case 'recoilHp':
        other.self.push(describeRecoilHp(effect));
        break;
      case 'gravityAttack':
        damage.push(describeGravityAttack(effect));
        break;
      case 'hpAttack':
        damage.push(describeHpAttack(effect));
        break;
      case 'revive':
        other.push(skill, effect.who, `revive @ ${effect.percentHp}% HP`);
        break;
      case 'heal':
        other.push(skill, effect.who, describeHeal(skill, effect), {
          // Because medica soul breaks are so common, we'll call out when a SB
          // only heals one person.
          defaultToAlly: isSoulBreak(skill),
        });
        break;
      case 'healPercent':
        other.push(skill, effect.who, `heal ${effect.healPercent}% HP`, {
          // See comments under 'heal'
          defaultToAlly: isSoulBreak(skill),
        });
        break;
      case 'damagesUndead':
        // Omit - too detailed to include in this output
        break;
      case 'dispelOrEsuna':
        other.push(skill, effect.who, effect.dispelOrEsuna === 'positive' ? 'Dispel' : 'Esuna');
        break;
      case 'randomEther':
        other.push(skill, effect.who, formatRandomEther(effect.amount));
        break;
      case 'smartEther':
        other.push(skill, effect.who, formatSmartEther(effect.amount, effect.school));
        break;
      case 'randomCastAbility':
        damage.push(formatRandomCastAbility(effect));
        break;
      case 'randomCastOther': {
        const formattedEffect = formatRandomCastOther(effect.other);
        // Hack: We're taking advantage of our knowledge of which rage skills exist
        // here - only Gau's BSB's cmd2 is non-damaging.
        const isNonDamage = 'school' in skill && skill.school === 'Special';
        if (isNonDamage) {
          other.normal.push(formattedEffect);
        } else {
          damage.push(formattedEffect);
        }
        break;
      }
      case 'chain':
        chain = describeChain(effect);
        break;
      case 'mimic':
        other.normal.push(describeMimic(skill, effect));
        break;
      case 'status': {
        const thisBurstToggle = processStatus(skill, skillEffects, effect, other);
        if (thisBurstToggle != null) {
          burstToggle = thisBurstToggle;
        }
        break;
      }
      case 'setStatusLevel':
        other.self.push(formatStatusLevel(effect.value));
        break;
      case 'statMod':
        other.push(skill, effect.who, describeStatMod(effect));
        break;
      case 'entrust':
        other.normal.push('donate SB pts to target');
        break;
      case 'gainSB':
        other.push(skill, effect.who, sbPointsAlias(effect.points), { defaultToAlly: true });
        break;
      case 'gainSBOnSuccess':
        other.push(skill, effect.who, sbPointsAlias(effect.points) + ' on success', {
          defaultToAlly: true,
        });
        break;
      case 'resetIfKO':
      case 'resistViaKO':
        // Omit - too detailed to include in this output
        break;
      case 'reset':
        other.misc.push('reset count');
        break;
      case 'castTime':
        other.misc.push(
          'cast time ' +
            formatNumberSlashList(effect.castTime, i => fixedNumberOrUnknown(i, 3)) +
            's ' +
            describeCondition(effect.condition, effect.castTime),
        );
        break;
      case 'castTimePerUse':
        other.misc.push('cast time ' + effect.castTimePerUse + 's per use');
        break;
      default:
        return assertNever(effect);
    }
  }

  {
    const powersUpEffect = checkPowersUp(skill, opt);
    if (powersUpEffect) {
      other.misc.push(powersUpEffect);
    }
  }
  {
    const sbPointsEffect = checkSbPoints(skill, skillEffects, opt);
    if (sbPointsEffect) {
      other.misc.splice(0, 0, sbPointsEffect);
    }
  }

  result.damage = damage.join(', then ') || undefined;

  {
    const implicitlyTargetsEnemies = damage.length !== 0;
    const allowImplicitSelf = isSoulBreak(skill) && isGlint(skill) && !damage.length;
    result.other = other.combine(implicitlyTargetsEnemies, allowImplicitSelf);
  }

  if (rageDurationAndEffects) {
    const turns = `${rageDurationAndEffects[0]} turns: `;
    if (result.damage) {
      result.damage = turns + result.damage;
    } else {
      result.other = turns + result.other;
    }
  }

  if (chain) {
    result.chain = chain;
  }
  if ('school' in skill) {
    result.school = skill.school;
  }
  if ('schoolDetails' in skill) {
    result.schoolDetails = skill.schoolDetails;
  }
  if (burstToggle != null) {
    result.burstToggle = burstToggle;
  }

  checkTime(skill, result);
  checkBurstCommands(skill, result);
  checkBraveCommands(skill, result);
  checkSynchroCommands(skill, result);
  return result;
}

interface FormatOptions {
  showTime: boolean;
}

function describeMrPTime({ instant, fast, slow }: MrPSkill): string | null {
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

export function formatMrPSkill(mrP: MrPSkill, options: Partial<FormatOptions> = {}): string {
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

// TODO: Handle element '?' - it's not a valid EnlirElement and so is rejected by our schemas, even thought it can appear in the data
// TODO: Use × for times; make Unicode selectable?
// TODO: Fix remaining inconsistencies between slash and hyphen - most current code favors hyphen, but slashMerge and some status code still uses slashes
// Maybe the ideal would be to pick hyphen vs. slash based on what it's describing?
