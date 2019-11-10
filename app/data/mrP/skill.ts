import * as _ from 'lodash';

import { logger } from '../../utils/logger';
import { arrayify, assertNever } from '../../utils/typeUtils';
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
} from './attack';
import { appendCondition, describeCondition } from './condition';
import * as skillParser from './skillParser';
import { formatRandomEther, formatSmartEther, sbPointsAlias } from './statusAlias';
import {
  DescribeOptions,
  getDescribeOptionsWithDefaults,
  getElementShortName,
} from './typeHelpers';
import * as types from './types';
import { toMrPFixed, toMrPKilo } from './util';

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

/**
 * The components of MrPSoulBreak.other, as lists.  We break them up like
 * this so that we can sort general items (e.g., elemental infuse), then
 * self statuses, then party statuses, then "details" (e.g., EX modes).
 */
class OtherDetail {
  normal: string[] = [];
  aoe: string[] = [];
  self: string[] = [];
  sameRow: string[] = [];
  frontRow: string[] = [];
  backRow: string[] = [];
  party: string[] = [];
  ally: string[] = [];
  misc: string[] = [];
  detail: string[] = [];

  push(skill: EnlirSkill, who: types.Who | undefined, description: string) {
    this.getPart(skill, who).push(description);
  }

  combine(implicitlyTargetsEnemies: boolean, allowImplicitSelf: boolean): string | undefined {
    let result: string[];
    if (
      allowImplicitSelf &&
      !this.normal.length &&
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

  private getPart(skill: EnlirSkill, who: types.Who | undefined): string[] {
    return who ? this.getWhoPart(who) : this.getTargetPart(skill.target);
  }

  private getTargetPart(target: EnlirTarget | null): string[] {
    switch (target) {
      case 'All enemies':
      case 'Random enemies':
      case 'Random enemy':
      case null:
        return this.normal;
      case 'Self':
        return this.self;
      case 'All allies':
        return this.party;
      case 'Single ally':
      case 'Single enemy':
      case 'Single target':
      case 'Single':
        return this.normal;
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
        // FIXME: Reimplement this logic:
        // Because medica soul breaks are so common, we'll call out when a SB
        // only heals one person.
        other.push(skill, effect.who, describeHeal(skill, effect));
        break;
      case 'healPercent':
        other.push(skill, effect.who, `heal ${effect.healPercent}% HP`);
        break;
      case 'damagesUndead':
        // Omit - too detailed to include in this output
        break;
      case 'dispelOrEsuna':
        other.push(skill, effect.who, effect.dispelOrEsuna === 'positive' ? 'Dispel' : 'Esuna');
        break;
      case 'randomEther':
        // FIXME: Implement
        other.push(skill, effect.who, formatRandomEther(effect.amount));
        break;
      case 'smartEther':
        // FIXME: Turn smart ether statuses into top-level smartEther
        other.push(
          skill,
          effect.who,
          formatSmartEther(arrayify(effect.amount).join('/'), effect.school),
        );
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
        // FIXME: Implement
        break;
      case 'setStatusLevel':
        // FIXME: Implement
        break;
      case 'statMod':
        // FIXME: Implement
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
      case 'hitRate':
        // FIXME: Implement
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

  result.damage = damage.join(', then');

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
