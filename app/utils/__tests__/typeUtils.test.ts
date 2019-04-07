import { partitionArray } from '../typeUtils';

import { alphabet } from '../textUtils';

describe('typeUtils', () => {
  describe('partitionArray', () => {
    it('partitions an array of unequal sizes', () => {
      expect(partitionArray(alphabet, 4)).toEqual([
        ['A', 'B', 'C', 'D', 'E', 'F'],
        ['G', 'H', 'I', 'J', 'K', 'L', 'M'],
        ['N', 'O', 'P', 'Q', 'R', 'S'],
        ['T', 'U', 'V', 'W', 'X', 'Y', 'Z'],
      ]);
    });
  });
});
