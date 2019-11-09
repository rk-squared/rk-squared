import * as _ from 'lodash';

import { logger } from '../../utils/logger';
import { assertNever } from '../../utils/typeUtils';
import { EnlirElement, EnlirSchool, EnlirSkill } from '../enlir';
import { describeAttack } from './attack';
import * as skillParser from './skillParser';
import { DescribeOptions, getDescribeOptionsWithDefaults } from './typeHelpers';
import * as types from './types';

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

export function describeEnlirSkill(
  skill: EnlirSkill,
  options: Partial<DescribeOptions> = {},
): MrPSkill {
  const opt = getDescribeOptionsWithDefaults(options);

  const result: MrPSkill = {};
  const damage: string[] = [];

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
        break;
      case 'attack':
        damage.push(describeAttack(skill, effect, {}));
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
      case 'castTime':
      case 'castTimePerUse':
        break;
      case 'hitRate':
        break;
      default:
        return assertNever(effect);
    }
  }

  result.damage = damage.join(', then');

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
