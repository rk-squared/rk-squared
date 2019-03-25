import * as _ from 'lodash';

export const arrayify = <T>(value: T | T[]) => (Array.isArray(value) ? value : [value]);

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
  if (!iteratee) {
    return _.every(values, i => values[0]);
  } else {
    return _.every(values, i => iteratee(i) === iteratee(values[0]));
  }
}

export function getAllSameValue<T>(values: T[], iteratee?: (value: T) => any): T | null {
  iteratee = iteratee || _.identity;
  if (isAllSame(values, iteratee)) {
    return iteratee(values[0]);
  } else {
    return null;
  }
}
