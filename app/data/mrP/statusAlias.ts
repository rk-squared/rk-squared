import * as common from './commonTypes';
import { formatSchoolOrAbilityList, getShortName } from './typeHelpers';
import {
  formatNumberSlashList,
  percentToMultiplier,
  signedNumber,
  signedNumberSlashList,
} from './util';

const rawSbPointsBoosterAlias = (multiplierString: string, s: string) =>
  // HACK: Special-case some strings to avoid redundant prepositions.
  `${multiplierString}x SB gauge ` + (s === vsWeak ? s : `from ${formatSchoolOrAbilityList(s)}`);

export const rankBoostAlias = (s: string) => `1.05-1.1-1.15-1.2-1.3x ${s} dmg @ rank 1-5`;
export const rankCastSpeedAlias = (s: string) => `2-3x ${s} cast @ rank 1-5`;
export const doubleAlias = (s: string) => `double ${s} (uses extra hone)`;
export const sbPointsAlias = (s: string | number) =>
  (typeof s === 'number' ? signedNumber(s) : '+' + s) + ' SB pts';
export const sbPointsBoosterAlias = (percent: string | number, s: string) =>
  rawSbPointsBoosterAlias(percentToMultiplier(percent), s);
export const lowHpAlias = (value: number) => `<${value}% HP`;
export const vsWeak = 'vs. weak';
export const statusLevelText = 'status lvl';

export const formatRandomEther = (amount: string | number) =>
  'refill ' + amount + ' random abil. use';
export const formatSmartEther = (amount: string | number | number[], type?: string | undefined) => {
  if (typeof amount !== 'string') {
    amount = formatNumberSlashList(amount);
  }
  return 'refill ' + amount + ' ' + (type ? getShortName(type) + ' ' : '') + 'abil. use';
};

export function formatStatusLevel(
  status: string,
  value: number | number[],
  set: boolean | undefined,
) {
  status = statusLevelAlias[status] || statusLevelText;
  if (!set) {
    return status + ` ${signedNumberSlashList(value)}`;
  } else if (value === 0) {
    return 'reset ' + status;
  } else {
    return status + ` =${value}`;
  }
}

export function formatSpecialStatusItem(
  status: common.SmartEtherStatus | common.StatusLevel,
  overrideValue?: number,
) {
  if (status.type === 'smartEther') {
    return formatSmartEther(status.amount, status.school);
  } else {
    if (overrideValue != null) {
      return formatStatusLevel(status.name, overrideValue, true);
    } else {
      return formatStatusLevel(status.name, status.value, status.set);
    }
  }
}

/**
 * Aliases of numbered statuses, minus the numbers, for use by status
 * thresholds and status stacking logic.  These match the text within
 * describeStatusEffect.
 */
export const statusLevelAlias: _.Dictionary<string> = {
  'Magical Blink': 'Magic blink',
  'Physical Blink': 'Phys blink',
  'Dual Blink': 'PM blink',
  Stoneskin: 'Neg. Dmg.',
  'Heavy Charge': 'Hvy Charge',
  'Damage Reduction Barrier': 'Dmg barrier',
};

Object.assign(statusLevelAlias);
