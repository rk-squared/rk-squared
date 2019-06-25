declare module 'trie-search' {
  interface TrieOptions<T> {
    ignoreCase?: boolean;
    maxCacheSize?: number;
    cache?: boolean;
    splitOnRegEx?: RegExp;
    splitOnGetRegEx?: RegExp;
    min?: number;
    keepAll?: boolean;
    keepAllKey?: number;
    indexField?: keyof T;
    idFieldOrFunction?: ((item: T) => any) | keyof T;
    expandRegexes?: Array<{ regex: RegExp; alternate: string }>;
    insertFullUnsplitKey?: boolean;
  }

  type Reducer<T> = (
    accumulator: string[],
    phrase: string,
    matches: string[],
    trie: TrieSearch<T>,
  ) => string[];

  class TrieSearch<T> {
    constructor(keyFields: string | string[], options: TrieOptions<T>);

    addAll(items: T[]): void;
    addFromObject(items: { [key: string]: T }): void;
    get(phrases: string | string[], reducer?: Reducer<T>): T[];
  }

  namespace TrieSearch {
    const UNION_REDUCER: Reducer<any>;
  }

  export = TrieSearch;
}
