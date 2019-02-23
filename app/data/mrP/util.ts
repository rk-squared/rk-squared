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

// https://stackoverflow.com/a/2901298/25507
export function numberWithCommas(x: number): string {
  return x.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ',');
}

export function isAllSame<T>(values: T[], iteratee: (value: T) => any): boolean {
  return _.every(values, i => iteratee(i) === iteratee(values[0]));
}

export function slashMerge(options: string[]): string {
  // MrP-specific logic: Don't split up stat mods
  options = options.map(i => i.replace(/(\d+%) ([A-Z]{3})/g, '$1\u00A0$2'));

  const optionParts = options.map(i => i.split(/([ +])/));
  const maxLength = Math.max(...optionParts.map(i => i.length));

  let result = '';
  for (let i = 0; i < maxLength; i++) {
    if (isAllSame(optionParts, parts => parts[i])) {
      result += optionParts[0][i];
    } else {
      result += optionParts
        .filter(parts => parts[i] !== undefined)
        .map(parts => parts[i])
        .join('/');
    }
  }

  // MrP-specific logic: Undo our no-split logic
  result = result.replace(/\u00A0/gu, ' ');

  return result;
}
