import { arrayifyLength, KeysOfType } from '../../utils/typeUtils';
import * as common from './commonTypes';
import * as skillTypes from './skillTypes';
import { describeEnlirStatus } from './status';
import { statusLevelAlias, vsWeak } from './statusAlias';
import { formatSchoolOrAbilityList, getElementShortName, getSchoolShortName } from './typeHelpers';
import { formatNumberSlashList, formatUseCount, formatUseNumber, orList } from './util';

export function formatThreshold(
  thresholdValues: number | number[],
  thresholdName: string,
  units: string = '',
): string {
  return '@ ' + formatNumberSlashList(thresholdValues) + units + ' ' + thresholdName;
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
  }
}

function formatCountCharacters(count: number | number[], characters: string): string {
  if (typeof count === 'number') {
    return 'if ≥' + count + ' ' + characters;
  } else {
    return 'if ' + formatNumberSlashList(count) + ' ' + characters;
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
          : condition.article + ' ' + condition.equipped)
      );
    case 'scaleWithStatusLevel':
      // FIXME: Reimplement isOwnStatusThreshold, statusThresholdCount, commandRelatingToStatus
      return 'if ' + condition.status;
    case 'statusLevel':
      return formatThreshold(condition.value, 'status lvl');
    case 'ifDoomed':
      return 'if Doomed';
    case 'conditionalEnElement':
      return 'based on party element infuse';
    case 'status':
      if (condition.who === 'self') {
        // Special case: We don't show "High Retaliate" to the user.
        if (condition.status === 'Retaliate or High Retaliate') {
          return 'if Retaliate';
        }
        const m = condition.status.match(/^(.*) ((?:\d+\/)+\d+)/);
        if (m) {
          const status = m[1];
          return '@ ' + m[2] + ' ' + (statusLevelAlias[status] || describeEnlirStatus(status));
        }
        return (
          'if ' + (statusLevelAlias[condition.status] || describeEnlirStatus(condition.status))
        );
      } else {
        // If we have one status, show it.  Otherwise, in practice, this is always
        // the same status ailments that the attack itself inflicts, so omit
        // details to save space.
        const status = condition.status.split(orList);
        return status.length === 1 ? 'vs. ' + status[0] : 'vs. status';
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
    case 'characterInParty':
      const what = condition.type === 'characterAlive' ? ' alive' : ' in party';
      if (condition.count) {
        return 'if ' + formatNumberSlashList(condition.count) + ' of ' + condition.character + what;
      } else {
        return 'if ' + condition.character + what;
      }
    case 'females':
      return formatCountCharacters(condition.count, 'females in party');
    case 'realmCharactersInParty':
      return formatCountCharacters(condition.count, condition.realm + ' chars. in party');
    case 'realmCharactersAlive':
      return formatCountCharacters(condition.count, condition.realm + ' chars. alive');
    case 'charactersAlive':
      return formatCountCharacters(condition.count, 'chars. alive');
    case 'alliesJump':
      return 'if ' + formatNumberSlashList(condition.count) + ' allies in air';
    case 'doomTimer':
      return formatThreshold(condition.value, 'sec Doom');
    case 'hpBelowPercent':
      return formatThreshold(condition.value, 'HP', '%');
    case 'soulBreakPoints':
      return formatThreshold(condition.value, 'SB pts');
    case 'targetStatBreaks':
      return formatThreshold(condition.count, 'stats lowered');
    case 'targetStatusAilments':
      return formatThreshold(condition.count, 'statuses');
    case 'vsWeak':
      return vsWeak;
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
        for (const status of i.statuses) {
          if (!visitEffectCondition(f, status, ['condition'])) {
            return;
          }
        }
        break;
      case 'statMod':
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
  let result: boolean = false;
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
