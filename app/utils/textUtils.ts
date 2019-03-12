import * as _ from 'lodash';

export const alphabet = _.times(26, i => String.fromCharCode('A'.charCodeAt(0) + i));

export function alphabetize<T>(items: T[], by: (item: T) => string): { [letter: string]: T[] } {
  const result: { [letter: string]: T[] } = {};
  _.sortBy(items, by).map(i => {
    const letter = by(i)
      .charAt(0)
      .toUpperCase();
    result[letter] = result[letter] || [];
    result[letter].push(i);
  });
  return result;
}
