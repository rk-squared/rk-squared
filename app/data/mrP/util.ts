/**
 * @file
 *
 * Utility functions for MrP code.  Most of this is text-processing logic that
 * could perhaps be part of a general text utility module, but it's written for
 * and optimized for parsing Enlir and outputting MrP.
 */

import * as _ from 'lodash';

import { andJoin } from '../../utils/textUtils';
import { isAllSame } from '../../utils/typeUtils';

export { andJoin };

export const andList = /,? and |, /;
export const orList = /,? or |, /;
export const andOrList = /,? and |,? or |, /;

const numbers: { [s: string]: number } = {
  one: 1,
  two: 2,
  three: 3,
  four: 4,
  five: 5,
  six: 6,
  seven: 7,
  eight: 8,
  nine: 9,
  ten: 10,
  eleven: 11,
  twelve: 12,
  thirteen: 13,
  fourteen: 14,
  fifteen: 15,
  sixteen: 16,
  seventeen: 17,
  eighteen: 18,
  nineteen: 19,
  twenty: 20,
  thirty: 30,
  forty: 40,
  fifty: 50,
  sixty: 60,
  seventy: 70,
  eighty: 80,
  ninety: 90,
};

export function isNumeric(s: string): boolean {
  return !isNaN(Number(s));
}

export function lowerCaseFirst(s: string): string {
  return s.replace(/^([A-Z])/, c => c.toLowerCase());
}

/**
 * Parses a numeric string like "one" or "twenty-two"
 */
export function parseNumberString(s: string): number | null {
  if (isNumeric(s)) {
    return +s;
  }
  let result = 0;
  for (const i of s.toLowerCase().split('-')) {
    if (numbers[i] == null) {
      return null;
    }
    result += numbers[i];
  }
  return result;
}

export function parseNumberOccurrence(s: string): number | null {
  if (s === 'once') {
    return 1;
  } else if (s === 'twice') {
    return 2;
  }
  const m = s.match(/(.*) times/);
  if (m) {
    return parseNumberString(m[1]);
  }
  return null;
}

export function parseThresholdValues(s: string): number[] {
  return s.split('/').map(parseFloat);
}

export function parsePercentageCounts(s: string): Array<[number, number]> | null {
  const result: Array<[number, number]> = [];
  for (const i of s.split(orList)) {
    const m = i.match(/([A-Za-z\-]+) \((\d+)%\)/);
    if (!m) {
      return null;
    }
    const count = parseNumberString(m[1]);
    if (count == null) {
      return null;
    }
    result.push([count, +m[2]]);
  }
  return result;
}

export function toMrPFixed(n: number): string {
  if (isNaN(n)) {
    return '?';
  }
  let result = n.toFixed(2);
  if (result.endsWith('0')) {
    result = result.substr(0, result.length - 1);
  }
  return result;
}

/**
 * Formats as kilo (k), following MrP's example
 *
 * @param n          Numeric value
 * @param favorSmall Allow small values to show as ones instead of fractional
 *                   values.  Very subjective - it happens to work the way we
 *                   use it.
 */
export function toMrPKilo(n: number | string, favorSmall: boolean = false): string {
  if (n === '?') {
    return '?';
  }
  let suffix = '';
  if (typeof n === 'string') {
    if (n.length > 1 && n.endsWith('?')) {
      suffix = '?';
    }
    n = parseFloat(n);
  }

  if (favorSmall && n < 1000) {
    return n + suffix;
  } else {
    return +n / 1000 + 'k' + suffix;
  }
}

/**
 * General-purpose formatting for a term that might be number-like
 */
export function toMrPGeneral(s: string): string {
  if (!isNumeric(s)) {
    return s;
  } else {
    let result: string;
    if (s.indexOf('.') !== -1) {
      result = toMrPFixed(+s);
    } else {
      result = s;
    }
    return (s.startsWith('+') ? '+' : '') + result;
  }
}

// https://stackoverflow.com/a/2901298/25507
export function numberWithCommas(x: number): string {
  return x.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ',');
}

export const enDashJoin = ' – ';

interface SlashMergeOptions {
  join?: string;
}

interface InternalSlashMergeOptions extends SlashMergeOptions {
  splitAtPlus: boolean;
}

function rawSlashMerge(options: string[], opt: InternalSlashMergeOptions) {
  // We normally break at plus signs, so, e.g., f+n / wa+n / wi+n / e+n can
  // become f/wa/wi/e+n.  But there are times when it works out better to
  // instead treat plus-separated terms as units.
  const splitAt = opt.splitAtPlus ? /([,? +=])/ : /([,? ])/;

  const optionParts = options.map(i => i.split(splitAt));
  const maxLength = _.max(optionParts.map(i => i.length))!;
  const minLength = _.min(optionParts.map(i => i.length))!;

  const join = (parts: string[]) => {
    let joinString: string;
    if (opt.join) {
      joinString = opt.join;
    } else {
      // Merge with slashes if the parts don't have slashes themselves.  Merge
      // with en dashes otherwise.
      joinString = _.some(parts, s => s.match('/')) ? enDashJoin : '/';
    }
    if (parts.length >= 8) {
      // Hack: Abbreviate particularly long lists.
      return (
        parts[0] + joinString + parts[1] + joinString + '…' + joinString + parts[parts.length - 1]
      );
    } else {
      return parts.join(joinString);
    }
  };

  let result = '';
  let same = 0;
  let different = 0;
  for (let i = 0; i < minLength; i++) {
    if (isAllSame(optionParts, parts => parts[i])) {
      result += optionParts[0][i];
      same++;
    } else {
      const mergeParts = optionParts.filter(parts => parts[i] !== undefined).map(parts => parts[i]);
      result += join(mergeParts);
      different++;
    }
  }

  // Try taking left-over parts and appending them to the end.
  if (maxLength !== minLength) {
    let extraParts = optionParts.map(i => i.slice(minLength));

    // Special case: Extra parts start with ", ".
    if (_.every(extraParts, i => i.length === 0 || (i[0] === ',' && i[1] === '' && i[2] === ' '))) {
      result += ', ';
      extraParts = extraParts.map(i => i.slice(3));
    } else {
      result += ' ';
    }

    result += join(extraParts.map(i => (i.length ? i.join('') : '0̸')));
    different += maxLength - minLength;
  }

  return { result, same, different };
}

export function slashMerge(options: string[], opt: SlashMergeOptions = {}): string {
  const standardPlus = rawSlashMerge(options, { ...opt, splitAtPlus: true });
  const standardNoPlus = rawSlashMerge(options, { ...opt, splitAtPlus: false });
  const useNoPlus = standardNoPlus.different < standardPlus.different;
  const standard = useNoPlus ? standardNoPlus : standardPlus;

  // Try it again, without splitting up stat mods.
  const optionsWithCombinedStats = options.map(i => i.replace(/(\d+%) ([A-Z]{3})/g, '$1\u00A0$2'));
  const combinedStats = rawSlashMerge(optionsWithCombinedStats, { ...opt, splitAtPlus: true });

  // If combining pieces of stat mods lets us combine more parts, then we'll
  // allow that.
  const useCombinedStats = combinedStats.different < standard.different;
  const picked = useCombinedStats ? combinedStats : standard;
  let result = picked.result;

  if (useCombinedStats) {
    result = result.replace(/\u00A0/gu, ' ');
  }

  // Check if values are too different to practically combine.  If they are,
  // fall back to separating the whole list with en dashes.  (Should we instead
  // use slashes here?  Unfortunately, MrP isn't completely consistent - a lot
  // depends on whether the clauses we're separating use slashes or hyphens
  // internally.)
  if (picked.same < picked.different) {
    result = options.join(enDashJoin);
  }

  return result;
}

/**
 * Cleans up a slashed numbers list by summarizing longer ranges.
 */
export function cleanUpSlashedNumbers(s: string): string {
  const values = s.split('/').map(i => +i);

  let isSequential = true;
  for (let i = 1; i < values.length; i++) {
    if (values[i] !== values[i - 1] + 1) {
      isSequential = false;
      break;
    }
  }

  if (isSequential && values.length > 4) {
    return values[0] + '-' + values[values.length - 1];
  } else {
    return s;
  }
}

export function formatUseCount(count: number | undefined): string {
  if (!count) {
    return 'w/ uses';
  } else if (count > 4) {
    return 'w/ 1…' + count + ' uses';
  } else {
    return 'w/ ' + _.times(count).join('-') + ' uses';
  }
}

export function countMatches(haystack: string, needle: RegExp): number {
  return (haystack.match(needle) || []).length;
}

export function describeChances(
  options: string[],
  percentChances: number[],
  join = '-',
): [string | undefined, string] {
  const allSamePercentage = _.every(percentChances, i => i === percentChances[0]);
  if (allSamePercentage) {
    return [undefined, options.join(' or ')];
  } else {
    // There are a couple of ways we could do this.  E.g., Fujin USB could be
    // "40-60% m7.8/5-15.6/10" or "40% m7.8/5 or 60% 15.6/10".  However, it's
    // probably not worth further development right now.
    return [percentChances.join('-') + '%', options.join(join)];
  }
}

export function percentToMultiplier(percent: number | string): string {
  let suffix = '';
  if (typeof percent === 'string') {
    if (percent.length > 1 && percent.endsWith('?')) {
      suffix = '?';
    }
    percent = parseFloat(percent);
  }
  return toMrPFixed(1 + percent / 100) + suffix;
}

export function handleUncertain<T>(f: (value: string) => T) {
  return (value: string) => {
    return {
      ...f(value.replace(/\?$/, '')),
      isUncertain: value.endsWith('?'),
    };
  };
}
