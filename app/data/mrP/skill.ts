import * as _ from 'lodash';

import { logger } from '../../utils/logger';
import {
  EnlirBurstCommand,
  EnlirElement,
  EnlirSchool,
  EnlirSkill,
  EnlirSynchroCommand,
} from '../enlir';
import * as skillParser from './skillParser';
import { SkillEffect } from './types';

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

export function describeEnlirSkill(
  skill: EnlirSkill,
  options: Partial<DescribeOptions> = {},
): MrPSkill {
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

  const result: MrPSkill = {};

  let skillEffects: SkillEffect;
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
        break;
      case 'attack':
        break;
      case 'randomFixedAttack':
        break;
      case 'drainHp':
        break;
      case 'recoilHp':
        break;
      case 'gravityAttack':
        break;
      case 'hpAttack':
        break;
      case 'revive':
        break;
      case 'heal':
        break;
      case 'healPercent':
        break;
      case 'damagesUndead':
        break;
      case 'dispelOrEsuna':
        break;
      case 'randomEther':
        break;
      case 'smartEther':
        break;
      case 'randomCastAbility':
        break;
      case 'randomCastOther':
        break;
      case 'chain':
        break;
      case 'mimic':
        break;
      case 'status':
        break;
      case 'setStatusLevel':
        break;
      case 'statMod':
        break;
      case 'entrust':
        break;
      case 'gainSB':
        break;
      case 'gainSBOnSuccess':
        break;
      case 'resetIfKO':
        break;
      case 'resistViaKO':
        break;
      case 'reset':
        break;
      case 'castTimePerUse':
        break;
      case 'hitRate':
        break;
      default:
        const check: never = effect;
        return check;
    }
  }

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

export function formatMrP(mrP: MrPSkill, options: Partial<FormatOptions> = {}): string {
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
