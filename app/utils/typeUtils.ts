import * as _ from 'lodash';

export function assertNever(x: never): never {
  throw new Error('Unexpected object: ' + x);
}

// https://stackoverflow.com/q/49752151/25507
export type KeysOfType<T, TProp> = { [P in keyof T]: T[P] extends TProp ? P : never }[keyof T];

export const arrayify = <T>(value: T | T[]) => (Array.isArray(value) ? value : [value]);
export const arrayifyLength = <T>(value: T | T[]) => (Array.isArray(value) ? value.length : 1);
export const scalarify = <T>(value: T[]) => (value.length === 1 ? value[0] : value);

export function compareWithUndefined<T>(compare: (a: T, b: T) => number) {
  return (a: T | undefined, b: T | undefined) => {
    if (a == null && b == null) {
      return 0;
    } else if (a == null) {
      return -1;
    } else if (b == null) {
      return 1;
    } else {
      return compare(a, b);
    }
  };
}

export function isAllSame<T>(values: T[], iteratee?: (value: T) => any): boolean {
  if (!values.length) {
    return true;
  } else if (!iteratee) {
    const first = values[0];
    return _.every(values, i => i === first);
  } else {
    const first = iteratee(values[0]);
    return _.every(values, i => iteratee(i) === first);
  }
}

export function getAllSameValue<T>(values: T[], iteratee?: (value: T) => any): T | null {
  iteratee = iteratee || _.identity;
  if (values.length && isAllSame(values, iteratee)) {
    return iteratee(values[0]);
  } else {
    return null;
  }
}

export function getSign(value: number): number {
  return value === 0 ? 0 : value > 0 ? 1 : -1;
}

/**
 * Split total into roughly equal parts, each of size parts, and return the
 * lengths.
 */
function partitionNumber(total: number, parts: number): number[] {
  const result: number[] = [];
  let done = 0;
  let remainder = 0;
  const partSize = total / parts;
  while (done < total) {
    const thisPart = Math.min(Math.floor(partSize + remainder), total - done);
    remainder = partSize + remainder - thisPart;
    result.push(thisPart);
    done += thisPart;
  }
  return result;
}

/**
 * Split an array into roughly equal parts, each of the given size, and return
 * the parts.
 */
export function partitionArray<T>(items: T[], parts: number): T[][] {
  type Accumulator = [T[][], number];
  return _.reduce(
    partitionNumber(items.length, parts),
    ([result, length]: Accumulator, value) => {
      result.push(items.slice(length, length + value));
      return [result, length + value] as Accumulator;
    },
    [[], 0] as Accumulator,
  )[0];
}

export function simpleFilter<T>(items: Array<T | null | undefined | false>): T[] {
  return _.filter(items) as T[];
}

export function runningTotal(items: number[], start = 0): number[] {
  const result = [];
  let total = start;
  for (const i of items) {
    total += i;
    result.push(total);
  }
  return result;
}
