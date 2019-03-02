import * as _ from 'lodash';

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

export function lowerCaseFirst(s: string): string {
  return s.replace(/^([A-Z])/, c => c.toLowerCase());
}

export function parseNumberString(s: string): number | null {
  let result = 0;
  for (const i of s.toLowerCase().split('-')) {
    if (numbers[i] == null) {
      return null;
    }
    result += numbers[i];
  }
  return result;
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

export function toMrPKilo(n: number): string {
  return n / 1000 + 'k';
}

// https://stackoverflow.com/a/2901298/25507
export function numberWithCommas(x: number): string {
  return x.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ',');
}

export function isAllSame<T>(values: T[], iteratee: (value: T) => any): boolean {
  return _.every(values, i => iteratee(i) === iteratee(values[0]));
}

export const enDashJoin = ' – ';

function rawSlashMerge(options: string[], { forceEnDash }: { forceEnDash: boolean }) {
  const optionParts = options.map(i => i.split(/([,? +])/));
  const maxLength = Math.max(...optionParts.map(i => i.length));

  let result = '';
  let same = 0;
  let different = 0;
  for (let i = 0; i < maxLength; i++) {
    if (isAllSame(optionParts, parts => parts[i])) {
      result += optionParts[0][i];
      same++;
    } else {
      const mergeParts = optionParts.filter(parts => parts[i] !== undefined).map(parts => parts[i]);
      // Merge with slashes if the parts don't have slashes themselves.  Merge
      // with en dashes otherwise.
      result += mergeParts.join(
        forceEnDash || _.some(mergeParts, s => s.match('/')) ? enDashJoin : '/',
      );
      different++;
    }
  }

  return { result, same, different };
}

export function slashMerge(options: string[], { forceEnDash } = { forceEnDash: false }): string {
  const standard = rawSlashMerge(options, { forceEnDash });

  // Try it again, without splitting up stat mods.
  const optionsWithCombinedStats = options.map(i => i.replace(/(\d+%) ([A-Z]{3})/g, '$1\u00A0$2'));
  const combinedStats = rawSlashMerge(optionsWithCombinedStats, { forceEnDash });

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
    return 'w/ 0…' + (count - 1) + ' uses';
  } else {
    return 'w/ ' + _.times(count).join('-') + ' uses';
  }
}
