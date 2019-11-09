import * as _ from 'lodash';

import { logger } from '../../utils/logger';
import { assertNever } from '../../utils/typeUtils';
import {
  enlir,
  EnlirElement,
  EnlirSchool,
  EnlirSkill,
  getNormalSBPoints,
  isAbility,
  isBraveCommand,
  isBraveSoulBreak,
  isBurstSoulBreak,
  isEnlirElement,
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
import { sbPointsAlias } from './statusAlias';
import {
  DescribeOptions,
  getDescribeOptionsWithDefaults,
  getElementShortName,
} from './typeHelpers';
import * as types from './types';
import { toMrPFixed } from './util';

function describeChain({ chainType, fieldBonus, max }: types.Chain): string {
  let chain = (isEnlirElement(chainType) ? getElementShortName(chainType) : chainType) + ' chain';
  chain += ' ' + toMrPFixed(1 + +fieldBonus / 100) + 'x';
  chain += ` (max ${max})`;
  return chain;
}

function describeDrainHp({ healPercent }: types.DrainHp): string {
  return `heal ${healPercent}% of dmg`;
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
  const other: string[] = [];
  const aoeOther: string[] = [];
  const selfOther: string[] = [];
  const sameRowOther: string[] = [];
  const partyOther: string[] = [];
  const miscOther: string[] = [];
  const detailOther: string[] = [];

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
        selfOther.push(describeDrainHp(effect));
        break;
      case 'recoilHp':
        selfOther.push(describeRecoilHp(effect));
        break;
      case 'gravityAttack':
        damage.push(describeGravityAttack(effect));
        break;
      case 'hpAttack':
        damage.push(describeHpAttack(effect));
        break;
      case 'revive':
        // FIXME: Implement
        break;
      case 'heal':
        // FIXME: Implement
        break;
      case 'healPercent':
        // FIXME: Implement
        break;
      case 'damagesUndead':
        // Omit - too detailed to include in this output
        break;
      case 'dispelOrEsuna':
        // FIXME: Implement
        break;
      case 'randomEther':
        // FIXME: Implement
        break;
      case 'smartEther':
        // FIXME: Implement
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
        other.push(describeMimic(skill, effect));
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
        other.push('donate SB pts to target');
        break;
      case 'gainSB':
        // FIXME: Implement
        break;
      case 'gainSBOnSuccess':
        // FIXME: Implement
        break;
      case 'resetIfKO':
      case 'resistViaKO':
        // Omit - too detailed to include in this output
        break;
      case 'reset':
        miscOther.push('reset count');
        break;
      case 'castTime':
        miscOther.push(
          'cast time ' +
            effect.castTime +
            's ' +
            describeCondition(effect.condition, effect.castTime),
        );
        break;
      case 'castTimePerUse':
        miscOther.push('cast time ' + effect.castTimePerUse + 's per use');
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
      miscOther.push(sbEffect);
    }
  }

  result.damage = damage.join(', then');
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
