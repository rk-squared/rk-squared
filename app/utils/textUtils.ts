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

export function pluralize(n: number, word: string, pluralWord?: string) {
  pluralWord = pluralWord || word + 's';
  return n === 1 ? word : pluralWord;
}

export function joinUrl(a: string, b: string) {
  return _.trimEnd(a, '/') + '/' + _.trimStart(b, '/');
}

// https://stackoverflow.com/a/6234804/25507
export function escapeHtml(unsafe: string) {
  return unsafe
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;');
}
