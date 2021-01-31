import * as _ from 'lodash';

import { arrayify, arrayifyLength, KeysOfType } from '../../utils/typeUtils';
import { enlir, EnlirStatus, getEffects, getEnlirStatusByName } from '../enlir';
import * as common from './commonTypes';
import * as skillTypes from './skillTypes';
import { describeEnlirStatus, describeEnlirStatusAndDuration, isModeStatus } from './status';
import {
  displayStatusLevel,
  statusLevelAlias,
  statusLevelText,
  vsWeak,
  vsWeakElement,
} from './statusAlias';
import { formatSchoolOrAbilityList, getElementShortName, getSchoolShortName } from './typeHelpers';
import { formatNumberSlashList, formatUseCount, formatUseNumber, stringSlashList } from './util';

export const withoutWithClause = (withoutWith: common.WithoutWith | undefined) =>
  withoutWith === 'withoutWith' ? 'w/o - w/' : withoutWith === 'without' ? 'w/o' : 'if';

export function formatThreshold(
  thresholdValues: number | number[],
  thresholdName: string,
  units = '',
  prefix = '',
): string {
  return '@ ' + prefix + formatNumberSlashList(thresholdValues) + units + ' ' + thresholdName;
}

export function describeMultiplierScaleType(scaleType: skillTypes.MultiplierScaleType): string {
  switch (scaleType.type) {
    case 'percentHp':
      return '@ 1% HP';
    case 'convergent':
      return 'scaling w/ targets';
    case 'stat':
      return `scaling w/ ${scaleType.stat.toUpperCase()}`;
    case 'hitsTaken':
      return 'w/ hits taken';
    case 'abilitiesUsed':
      return `w/ ${getSchoolShortName(scaleType.school)} used`;
    case 'attacksUsed':
      return `w/ ${getElementShortName(scaleType.element)} atks used`;
    case 'doomTimer':
      return 'at low Doom time';
    case 'limitBreak':
      return 'scaling w/ LB pts and honing';
  }
}

function formatCountCharacters(
  count: number | number[],
  characters: string,
  plus?: boolean,
): string {
  // Note: This code has stricter handling of at least / "plus" than other
  // condition code - mostly because Marcus's AASB is complex enough to benefit
  // from it.  Since not all conditions have implemented tracking "plus", we'll
  // assume reasonable defaults if it's absent.
  if (count === 1 && plus === false) {
    return 'if ' + count + ' ' + characters.replace('chars.', 'char.');
  }
  if (typeof count === 'number') {
    return 'if ' + (plus !== false ? '≥' : '') + count + ' ' + characters;
  } else {
    return 'if ' + formatNumberSlashList(count) + (plus === true ? '+' : '') + ' ' + characters;
  }
}

/**
 * Helper for Condition.type === 'status' to accommodate the fact that, as of
 * December 2020, it includes status levels, real statuses, and our own hacks /
 * special cases
 */
function describeStatusOrStatusAlias(status: string) {
  let enlirStatus: EnlirStatus | undefined;
  if (statusLevelAlias[status]) {
    return statusLevelAlias[status];
  } else if (status.endsWith(' stacks') || status.endsWith(' status')) {
    // Accommodate hacks added by attack.ts
    return status;
  } else if ((enlirStatus = getEnlirStatusByName(status)) != null) {
    // As a special case, to accommodate Ysayle's Shiva Possession Mode,
    // abbreviate "mode" statuses.
    //
    // As a special case to the special case, Thunder God's Might is short and
    // well-known, so don't abbreviate it.
    return isModeStatus(enlirStatus) && getEffects(enlirStatus).length > 20
      ? 'mode'
      : describeEnlirStatus(status);
  } else {
    // Assume status level
    return statusLevelText;
  }
}

/**
 * Returns a text string describing the given Condition.
 *
 * @param condition
 * @param count Number of values covered by this condition.  E.g.,
 *    "4/5/6 attacks, scaling with uses" could pass [4,5,6].
 */
export function describeCondition(condition: common.Condition, count?: number | number[]): string {
  switch (condition.type) {
    case 'equipped':
      return (
        'if using ' +
        (condition.equipped === 'ranged weapon'
          ? 'a rngd wpn'
          : (condition.article ? condition.article + ' ' : '') + condition.equipped)
      );
    case 'scaleWithStatusLevel': {
      const status = displayStatusLevel(condition.status);
      if (!count) {
        return 'w/ ' + status;
      } else {
        return (
          'w/ ' + formatNumberSlashList(_.times(arrayifyLength(count), i => i + 1)) + ' ' + status
        );
      }
    }
    case 'statusLevel':
      return formatThreshold(condition.value, statusLevelText, condition.plus ? '+' : '');
    case 'ifDoomed':
      return 'if Doomed';
    case 'conditionalEnElement':
      return 'based on party element infuse';
    case 'status': {
      const clause = withoutWithClause(condition.withoutWith);

      // Hack: Assume that, if it's checking a simple status on someone else,
      // then it's targeting a status ailment, so phrase as 'vs.'
      if (condition.who === 'self' || condition.any || condition.withoutWith) {
        // Special case: "Retaliate and High Retaliate" are common enough that
        // we simplify them by omitting "High Retaliate."
        if (_.isEqual(condition.status, ['Retaliate', 'High Retaliate'])) {
          return `${clause} Retaliate`;
        }
        const m =
          typeof condition.status === 'string' && condition.status.match(/^(.*) ((?:\d+\/)+\d+)/);
        if (m) {
          const status = m[1];
          return '@ ' + m[2] + ' ' + describeStatusOrStatusAlias(status);
        }
        return (
          clause +
          ' ' +
          arrayify(condition.status)
            .map(describeStatusOrStatusAlias)
            .join(' or ')
        );
      } else {
        // If we have one status, show it.  Otherwise, in practice, this is always
        // the same status ailments that the attack itself inflicts, so omit
        // details to save space.
        return typeof condition.status === 'string' ? 'vs. ' + condition.status : 'vs. status';
      }
    }
    case 'statusList': {
      // Assume that target means negative statuses.
      const clause = condition.who === 'self' ? 'if ' : 'vs. ';
      return (
        clause +
        condition.status
          .map(i => {
            const status = i.status as common.StandardStatus;
            return describeEnlirStatusAndDuration(
              status.name,
              status.id == null
                ? undefined
                : { status: enlir.status[status.id], placeholders: status.placeholders },
              status.effects,
            )[0];
          })
          .join('/')
      );
    }
    case 'scaleUseCount':
      return 'w/ ' + formatNumberSlashList(condition.useCount) + ' uses';
    case 'scaleWithUses':
      return formatUseNumber(count ? arrayifyLength(count) : undefined);
    case 'scaleWithSkillUses':
      return 'w/ ' + condition.skill + ' uses';
    case 'afterUseCount':
      return `@ ${formatUseCount(condition.useCount)} ${condition.skill || 'uses'}`;
    case 'alliesAlive':
      return 'if no allies KO';
    case 'characterAlive':
    case 'characterInParty': {
      const what = condition.type === 'characterAlive' ? ' alive' : ' in party';
      const clause = withoutWithClause(condition.withoutWith);
      if (condition.count) {
        return (
          clause +
          ' ' +
          formatNumberSlashList(condition.count) +
          (condition.character == null ? '' : ' of ' + stringSlashList(condition.character)) +
          what
        );
      } else {
        return (
          clause +
          (condition.character == null
            ? ''
            : ' ' + stringSlashList(condition.character, condition.all ? ' & ' : ' or ')) +
          what
        );
      }
    }
    case 'femalesInParty':
      return formatCountCharacters(condition.count, 'females in party');
    case 'femalesAlive':
      return formatCountCharacters(condition.count, 'females alive');
    case 'realmCharactersInParty':
      return formatCountCharacters(condition.count, condition.realm + ' chars. in party');
    case 'realmCharactersAlive':
      return formatCountCharacters(
        condition.count,
        condition.realm + ' chars. alive',
        condition.plus,
      );
    case 'charactersAlive':
      return formatCountCharacters(condition.count, 'chars. alive');
    case 'alliesJump':
      return 'if ' + formatNumberSlashList(condition.count) + ' allies in air';
    case 'doomTimer':
      return formatThreshold(condition.value, 'sec Doom');
    case 'hpBelowPercent':
      return formatThreshold(condition.value, 'HP', '%');
    case 'hpAtLeastPercent':
      return formatThreshold(condition.value, 'HP', '%', '≥ ');
    case 'soulBreakPoints':
      return formatThreshold(condition.value, 'SB pts', condition.plus ? '+' : '');
    case 'targetStatBreaks':
      return formatThreshold(condition.count, 'stats lowered');
    case 'targetStatusAilments':
      return formatThreshold(condition.count, 'statuses');
    case 'vsWeak':
      return condition.element ? vsWeakElement(condition.element) : vsWeak;
    case 'inFrontRow':
      return 'if in front row';
    case 'hitsTaken':
      return formatThreshold(
        condition.count,
        formatSchoolOrAbilityList(condition.skillType) + ' hits taken',
      );
    case 'attacksTaken':
      return formatThreshold(condition.count, 'atks taken');
    case 'damagingActions':
      return formatThreshold(condition.count, 'atks');
    case 'otherAbilityUsers':
      return formatThreshold(condition.count, getSchoolShortName(condition.school) + ' allies');
    case 'differentAbilityUses':
      return formatThreshold(
        condition.count,
        'diff. ' + getSchoolShortName(condition.school) + ' abils',
      );
    case 'abilitiesUsedDuringStatus':
      return (
        formatThreshold(condition.count, formatSchoolOrAbilityList(condition.school)) + ' used'
      );
    case 'abilitiesUsed':
      return (
        formatThreshold(condition.count, formatSchoolOrAbilityList(condition.school)) + ' used'
      );
    case 'attacksDuringStatus':
      return (
        formatThreshold(condition.count, formatSchoolOrAbilityList(condition.element)) + ' used'
      );
    case 'damageDuringStatus':
      return formatThreshold(
        condition.value,
        (condition.element ? formatSchoolOrAbilityList(condition.element) + ' ' : '') + 'dmg dealt',
      );
    case 'rankBased':
      return '@ rank 1-5';
    case 'statThreshold':
      return formatThreshold(condition.value, condition.stat.toUpperCase());
    case 'battleStart':
      return 'at battle start';
  }
}

export function appendCondition(
  condition: common.Condition | undefined | null,
  count?: number | number[],
): string {
  return condition ? ' ' + describeCondition(condition, count) : '';
}

/**
 * Given a condition, return a new Condition? value (or null to not touch
 * what's there), and return whether it should continue visitation.
 */
type ConditionVisitor = (
  condition: common.Condition,
) => [common.Condition | undefined | null, boolean];

function visitEffectCondition<T>(
  f: ConditionVisitor,
  effect: T,
  props: Array<KeysOfType<T, common.Condition | undefined>>,
): boolean {
  for (const i of props) {
    if (!effect[i]) {
      continue;
    }
    const [newCondition, shouldContinue] = f((effect[i] as unknown) as common.Condition);
    if (newCondition !== null) {
      effect[i] = newCondition as any;
    }
    if (!shouldContinue) {
      return false;
    }
  }
  return true;
}

export function visitCondition(f: ConditionVisitor, effects: skillTypes.SkillEffect): void {
  // TODO: Implement remaining visitors.  Only those types we need are implemented so far.
  for (const i of effects) {
    switch (i.type) {
      case 'attack':
        if (
          !visitEffectCondition(f, i, [
            'scaleType',
            'additionalCritDamageCondition',
            'additionalCritCondition',
            'airTimeCondition',
            'damageModifierCondition',
            'orMultiplierCondition',
            'orNumAttacksCondition',
          ])
        ) {
          return;
        }
        if (i.status && !visitEffectCondition(f, i.status, ['condition'])) {
          return;
        }
        break;
      case 'status':
        if (!visitEffectCondition(f, i, ['condition'])) {
          return;
        }
        break;
    }
  }
}

export function findCondition(
  effects: skillTypes.SkillEffect,
  filter: (condition: skillTypes.Condition) => boolean,
): boolean {
  let result = false;
  visitCondition((condition: skillTypes.Condition) => {
    if (filter(condition)) {
      result = true;
      return [null, false];
    }
    return [null, true];
  }, effects);
  return result;
}

export function excludeCondition(
  effects: skillTypes.SkillEffect,
  filter: (condition: common.Condition) => boolean,
) {
  visitCondition((condition: common.Condition) => {
    return [filter(condition) ? undefined : null, true];
  }, effects);
}
