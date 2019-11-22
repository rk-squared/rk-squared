import * as _ from 'lodash';

import { logger } from '../../utils/logger';
import { arrayify, assertNever, isAllSame } from '../../utils/typeUtils';
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
} from './attack';
import { appendCondition, describeCondition } from './condition';
import * as skillParser from './skillParser';
import {
  describeStats,
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
import * as types from './types';
import { formatSignedIntegerSlashList, toMrPFixed, toMrPKilo } from './util';

function findFirstEffect<T extends types.EffectClause>(
  skillEffects: types.SkillEffect,
  type: T['type'],
): T | undefined {
  for (const i of skillEffects) {
    if (i.type === type) {
      return i as T;
    }
  }
  return undefined;
}

function sortSkillEffects(skillEffects: types.SkillEffect): types.SkillEffect {
  const result: types.SkillEffect = [];
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

function convertTargetToWho(target: EnlirTarget): types.Who {
  switch (target) {
    case 'All allies':
      return 'party';
    case 'All enemies':
      return 'enemies';
    case 'Ally with status':
      return 'allyWithNegativeStatus'; // Is this necessarily correct?
    case 'Another ally':
      return 'ally';
    case 'Lowest HP% ally':
      return 'lowestHpAlly';
    case 'Random ally':
      return 'ally';
    case 'Random enemies':
    case 'Random enemy':
      return 'target';
    case 'Self':
      return 'self';
    case 'Single ally':
    // 'Single ally' defaults to the same as other targets.  See OtherDetail.
    case 'Single enemy':
    case 'Single target':
    case 'Single':
      return 'target';
  }
}

/**
 * Stat modifications default to 25 seconds.
 */
const defaultStatModDuration: types.Duration = {
  value: 25,
  units: 'seconds',
};

function isHybridStatSet(statSet: types.StatSet): statSet is types.HybridStatSet {
  return statSet.length === 2 && Array.isArray(statSet[0]);
}

function describeDuration({ value, units }: types.Duration): string {
  if (units === 'seconds') {
    return value + 's';
  } else if (value === 1) {
    return '1 turn';
  } else {
    return value + ` turns`;
  }
}

function describeChain({ chainType, fieldBonus, max }: types.Chain): string {
  let chain = (isEnlirElement(chainType) ? getElementShortName(chainType) : chainType) + ' chain';
  chain += ' ' + toMrPFixed(1 + +fieldBonus / 100) + 'x';
  chain += ` (max ${max})`;
  return chain;
}

function describeDrainHp({ healPercent }: types.DrainHp): string {
  return `heal ${healPercent}% of dmg`;
}

function describeHeal(skill: EnlirSkill, { amount }: types.Heal): string {
  let heal: string;
  if ('healFactor' in amount) {
    heal = 'h' + arrayify(amount.healFactor).join('/');
  } else {
    heal =
      'heal ' +
      arrayify(amount.fixedHp)
        .map(i => toMrPKilo(i, true))
        .join('/');
  }
  if ('healFactor' in amount && skill.type === 'NAT') {
    heal += ' (NAT)';
  }
  return heal;
}

function describeMimic(skill: EnlirSkill, { chance, count }: types.Mimic): string {
  let description = 'Mimic';

  // For brave commands in particular, we'll want to compare with other
  // numbers, so always include the count.
  if (count && (count !== 1 || isBraveCommand(skill))) {
    description += ` ${count}x`;
  }

  if (chance) {
    description = `${chance}% chance of ` + description;
  }

  return description;
}

function describeRecoilHp({ damagePercent, maxOrCurrent, condition }: types.RecoilHp): string {
  return `lose ${damagePercent}% ${maxOrCurrent} HP` + appendCondition(condition);
}

function describeStatMod({ stats, percent, duration, condition }: types.StatMod): string {
  duration = duration || defaultStatModDuration;

  const combinedStats = isHybridStatSet(stats)
    ? describeStats(stats[0]) + ' or ' + describeStats(stats[1])
    : describeStats(stats);
  let statMod = formatSignedIntegerSlashList(percent) + '% ';
  statMod += combinedStats;
  statMod += ` ` + describeDuration(duration);
  statMod += appendCondition(condition, percent);

  return statMod;
}

function checkSb(skill: EnlirSkill, effects: types.SkillEffect, opt: DescribeOptions) {
  if ('sb' in skill && skill.sb != null) {
    if (opt.includeSbPoints && skill.sb === 0) {
      // If we weren't asked to suppress SB points (which we are for follow-ups
      // and finishers, since those don't generate gauge), then call out
      // anything that doesn't generate gauge.
      return 'no SB pts';
    } else if (skill.sb >= 150) {
      // If this skill grants an abnormally high number of SB points, show it.
      // We set a flat rate of 150 (to get Lifesiphon and Wrath) instead of
      // trying to track what's normal at each rarity level.
      return sbPointsAlias(skill.sb.toString());
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
  return ({ status, chance, who, ifUndead }: types.StatusWithPercent): boolean => {
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

function processStatus(
  skill: EnlirSkill,
  skillEffects: types.SkillEffect,
  effect: types.StatusEffect,
  other: OtherDetail,
) {
  // Confuse Shell doesn't remove Confuse - this is a special case, skip.
  if (effect.verb === "doesn't remove") {
    return;
  }

  const removes = effect.verb === 'removes';
  const statuses = effect.statuses
    .reduce(shareStatusWho, [])
    .filter(shouldIncludeStatus(skill))
    .reduce(shareStatusDurations, [])
    .reduce(slashMergeElementStatuses, [])
    .sort(sortStatus);
  statuses.forEach((thisStatus, thisStatusIndex) => {
    // tslint:disable: prefer-const
    let { status, duration, who, chance, condition } = thisStatus;
    // tslint:enable: prefer-const

    if (typeof status !== 'string') {
      if (status.type === 'smartEther') {
        other.push(skill, who, formatSmartEther(status.amount, status.school));
      } else {
        // FIXME: Implement status levels
      }
      return;
    }

    if ('source' in skill && skill.source === status && removes) {
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

    /*
    FIXME: Reimplement
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
    */

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
    /* FIXME: Reimplement
    if (stacking) {
      description = 'stacking ' + description;
    }
    */
    description += appendCondition(condition);

    if (!duration && defaultDuration) {
      duration = { value: defaultDuration, units: 'seconds' };
    }

    if ((duration || specialDuration) && !isVariableDuration) {
      const durationText = specialDuration || describeDuration(duration!);
      if (isExLike) {
        description = durationText + ': ' + description;
      } else {
        description = description + ' ' + durationText;
      }
    }

    if (chance) {
      const chanceDescription = formatAttackStatusChance(
        chance,
        findFirstEffect<types.Attack>(skillEffects, 'attack'),
      );
      other.statusInfliction.push({ description, chance, chanceDescription });
    } else if (description.match(/^\w+ infuse/)) {
      // Following MrP's original example, any en-element effects are listed
      // first.
      other.normal.push(description);
    } else if (isDetail) {
      // (Always?) has implied 'self'
      other.detail.push(description);
    } else {
      other.push(skill, who, description);
    }
  });
}

interface StatusInfliction {
  description: string;
  chance: number;
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
 * The components of MrPSoulBreak.other, as lists.  We break them up like
 * this so that we can sort general items (e.g., elemental infuse), then
 * self statuses, then party statuses, then "details" (e.g., EX modes).
 */
class OtherDetail {
  normal: string[] = [];
  statusInfliction: StatusInfliction[] = [];
  aoe: string[] = [];
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
    who: types.Who | undefined,
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
      result = [...this.self, ...this.misc];
    } else {
      result = [
        ...this.formatStatusInfliction(),
        ...this.normal,
        ...this.makeGroup(this.aoe, implicitlyTargetsEnemies ? undefined : 'AoE'),

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
    who: types.Who | undefined,
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

  private getWhoPart(who: types.Who): string[] {
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

  // The components of MrPSoulBreak.other, as lists.  We break them up like
  // this so that we can sort general items (e.g., elemental infuse), then
  // self statuses, then party statuses, then "details" (e.g., EX modes).
  //
  // We may start returning these as is so callers can deal with them.
  const other = new OtherDetail();

  let skillEffects: types.SkillEffect;
  try {
    skillEffects = skillParser.parse(skill.effects);
  } catch (e) {
    logger.error(`Failed to parse ${skill.name}:`);
    logger.error(e);
    if (e.name === 'SyntaxError') {
      return result;
    }
    throw e;
  }

  // Hack: Skills like Fusoya's Lunarian Might that consist only of party and
  // enemy status effects may be ambiguous for our shareStatusWho logic.  Copy
  // the skill's target to help with that.
  if (skillEffects.length && skillEffects[0].type === 'status' && skill.target) {
    skillEffects[0].statuses[0].who = convertTargetToWho(skill.target);
  }

  skillEffects = sortSkillEffects(skillEffects);

  for (const effect of skillEffects) {
    switch (effect.type) {
      case 'fixedAttack':
        damage.push(describeFixedAttack(effect));
        break;
      case 'attack':
        damage.push(describeAttack(skill, effect, opt));
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
        // FIXME: Implement
        break;
      case 'randomCastOther':
        // FIXME: Implement
        break;
      case 'chain':
        chain = describeChain(effect);
        break;
      case 'mimic':
        other.normal.push(describeMimic(skill, effect));
        break;
      case 'status':
        processStatus(skill, skillEffects, effect, other);
        break;
      case 'setStatusLevel':
        // FIXME: Implement
        break;
      case 'statMod':
        other.push(skill, effect.who, describeStatMod(effect));
        break;
      case 'entrust':
        other.normal.push('donate SB pts to target');
        break;
      case 'gainSB':
        other.push(skill, effect.who, sbPointsAlias(effect.points));
        break;
      case 'gainSBOnSuccess':
        other.push(skill, effect.who, sbPointsAlias(effect.points) + ' on success');
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
            effect.castTime +
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
    const sbEffect = checkSb(skill, skillEffects, opt);
    if (sbEffect) {
      other.misc.push(sbEffect);
    }
  }

  result.damage = damage.join(', then ');

  {
    const implicitlyTargetsEnemies = damage.length !== 0;
    const allowImplicitSelf = isSoulBreak(skill) && isGlint(skill) && !damage.length;
    result.other = other.combine(implicitlyTargetsEnemies, allowImplicitSelf);
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
