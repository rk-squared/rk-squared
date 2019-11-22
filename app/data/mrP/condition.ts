import { arrayify, arrayifyLength } from '../../utils/typeUtils';
import { describeEnlirStatus } from './status';
import { formatSchoolOrAbilityList, getElementShortName, getSchoolShortName } from './typeHelpers';
import * as types from './types';
import { formatUseCount, orList } from './util';

export function formatThreshold(
  thresholdValues: number | number[],
  thresholdName: string,
  units: string = '',
): string {
  return '@ ' + arrayify(thresholdValues).join('-') + units + ' ' + thresholdName;
}

export function describeMultiplierScaleType(scaleType: types.MultiplierScaleType): string {
  switch (scaleType.type) {
    case 'percentHp':
      return '@ 1% HP';
    case 'convergent':
      return 'scaling w/ targets';
    case 'stat':
      return `scaling w/ ${scaleType.stat}`;
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

/**
 * Returns a text string describing the given Condition.
 *
 * @param condition
 * @param count Number of values covered by this condition.  E.g.,
 *    "4/5/6 attacks, scaling with uses" could pass [4,5,6].
 */
export function describeCondition(condition: types.Condition, count?: number | number[]): string {
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
      return formatThreshold(condition.value, 'lvl');
    case 'ifDoomed':
      return 'if Doomed';
    case 'status':
      if (condition.who === 'self') {
        // Special case: We don't show "High Retaliate" to the user.
        if (condition.status === 'Retaliate or High Retaliate') {
          return 'if Retaliate';
        }
        // FIXME: Reimplement this logic:
        // if (commandRelatingToStatus !== -1) {
        //   statusDescription = 'cmd' + (commandRelatingToStatus + 1) + ' status';
        // }
        return 'if ' + describeEnlirStatus(condition.status);
      } else {
        // If we have one status, show it.  Otherwise, in practice, this is always
        // the same status ailments that the attack itself inflicts, so omit
        // details to save space.
        const status = condition.status.split(orList);
        return status.length === 1 ? 'vs. ' + status[0] : 'vs. status';
      }
    case 'scaleUseCount':
      return 'w/ ' + arrayify(condition.useCount).join('-') + ' uses';
    case 'scaleWithUses':
      return formatUseCount(count ? arrayifyLength(count) : undefined);
    case 'scaleWithSkillUses':
      return 'w/ ' + condition.skill + ' uses';
    case 'afterUseCount':
      return `@ ${formatUseCount(condition.useCount)} ${condition.skill}`;
    case 'alliesAlive':
      return 'if no allies KO';
    case 'characterAlive':
    case 'characterInParty':
      const what = condition.type === 'characterAlive' ? ' alive' : ' in party';
      if (condition.count) {
        return 'if ' + arrayify(condition.count).join('/') + ' of ' + condition.character + what;
      } else {
        return 'if ' + condition.character + what;
      }
    case 'females':
      return 'if ' + arrayify(condition.count).join('/') + ' females in party';
    case 'alliesJump':
      return 'if ' + arrayify(condition.count).join('/') + ' allies in air';
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
      return 'vs. weak';
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
        'diff. ' + getSchoolShortName(condition.school) + ' abils.',
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
      return formatThreshold(condition.value, 'dmg dealt');
    case 'rankBased':
      return '@ rank 1-5';
    case 'statThreshold':
      return formatThreshold(condition.value, condition.stat.toUpperCase());
  }
}

export function appendCondition(
  condition: types.Condition | undefined | null,
  count?: number | number[],
): string {
  return condition ? ' ' + describeCondition(condition, count) : '';
}
