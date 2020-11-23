import * as _ from 'lodash';

import { logger } from '../../utils/logger';
import { arrayify, scalarify } from '../../utils/typeUtils';
import * as common from './commonTypes';
import * as skillTypes from './skillTypes';
import * as statusTypes from './statusTypes';
import { parseNumberString } from './util';

const isEqual = _.isEqual;
export { arrayify, parseNumberString, isEqual, scalarify };

export function lastValue(value: number | number[]): number {
  value = arrayify(value);
  return value[value.length - 1];
}

export function pegList(head: any, tail: any, index: number, forceSingle: boolean = false): any[] {
  if (forceSingle && !tail.length) {
    return head;
  }
  return tail.reduce(
    (result: any, element: any) => {
      result.push(element[index]);
      return result;
    },
    [head],
  );
}

export function pegMultiList(head: any, tails: [any, number], forceSingle: boolean = false): any {
  const result: any[] = [head];
  for (const [tail, index] of tails) {
    for (const element of tail) {
      result.push(element[index]);
    }
  }
  if (forceSingle && result.length === 1) {
    return result[0];
  } else {
    return result;
  }
}

export function pegSlashList(head: any, tail: any): any[] {
  return pegList(head, tail, 1, true);
}

export function addCondition<T>(
  value: T,
  maybeCondition: any[] | common.Condition | null | undefined,
  conditionProp: string = 'condition',
) {
  if (Array.isArray(maybeCondition)) {
    // maybeCondition is assumed to be whitespace plus Condition
    return {
      ...value,
      [conditionProp]: maybeCondition[1] as common.Condition,
    };
  } else if (maybeCondition) {
    return {
      ...value,
      [conditionProp]: maybeCondition as common.Condition,
    };
  } else {
    return value;
  }
}

export function mergeAttackExtras(
  effects: Array<skillTypes.EffectClause | skillTypes.StandaloneAttackExtra>,
) {
  const result: skillTypes.EffectClause[] = [];
  let lastAttack: skillTypes.Attack | undefined;
  let lastAttackIndex: number | undefined;
  for (const i of effects) {
    if (i.type !== 'attackExtra') {
      if (i.type === 'attack') {
        lastAttack = i;
        lastAttackIndex = result.length;
      }
      result.push(i);
    } else {
      if (lastAttack == null || lastAttackIndex == null) {
        logger.error(`Error checking effects for attack extras: Attack extras but no attack`);
      } else {
        lastAttack = _.cloneDeep(lastAttack);
        result[lastAttackIndex] = lastAttack;

        // When displayed to the end user, the "followed by" attack's clauses
        // can look like they apply to the whole attack, so we'll put the
        // hit rate there.
        let attack = lastAttack;
        while (attack.followedBy) {
          attack = attack.followedBy;
        }

        Object.assign(attack, i.extra);
      }
    }
  }
  return result;
}

/**
 * At the parser level, we allow mixed status items and SB gains.  That
 * complicates higher-level code, so separate them out.
 */
export function separateStatusAndSb(effects: statusTypes.EffectClause[]): void {
  type RawStatusItem = statusTypes.StatusWithPercent | statusTypes.GainSb;
  const isGainSb = (item: RawStatusItem): item is statusTypes.GainSb =>
    typeof item === 'object' && 'type' in item && item.type === 'gainSb';
  const isStatusItem = (item: RawStatusItem): item is statusTypes.StatusWithPercent =>
    !isGainSb(item);

  for (const i of effects) {
    if (i.type === 'triggeredEffect') {
      const newGainSb: statusTypes.GainSb[] = [];
      for (const j of arrayify(i.effects)) {
        if (j.type === 'grantStatus') {
          const unfilteredStatus = arrayify(j.status) as RawStatusItem[];
          const gainSb = unfilteredStatus.filter(isGainSb);
          if (gainSb.length) {
            const filteredStatus = unfilteredStatus.filter(isStatusItem);
            j.status = filteredStatus.length === 1 ? filteredStatus[0] : filteredStatus;
            newGainSb.push(...gainSb);
          }
        }
      }
      if (newGainSb.length) {
        i.effects = arrayify(i.effects);
        i.effects.push(...newGainSb);
      }
    }
  }
}

export function checkSelfSkillTrigger(effects: statusTypes.EffectClause[]): void {
  for (const effect of effects) {
    if (effect.type === 'removedAfterTrigger' && effect.trigger.type === 'skillTriggered') {
      const skill = effect.trigger.skill;
      for (const effect2 of effects) {
        if (
          effect2.type === 'triggeredEffect' &&
          _.find(arrayify(effect2.effects), i => i.type === 'castSkill' && i.skill === skill)
        ) {
          effect.trigger.isSelfSkill = true;
          break;
        }
      }
    }
  }
}
