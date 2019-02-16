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
