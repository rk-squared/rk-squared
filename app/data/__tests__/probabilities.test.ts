import { chanceOfDesiredDrawProp5, combinations } from '../probabilities';

describe('probabilities', () => {
  describe('combinations', () => {
    it('calculates combinations', () => {
      // https://medium.com/i-math/combinations-permutations-fa7ac680f0ac
      expect(combinations(52, 5)).toEqual(2598960);
    });

    it('handles edge cases', () => {
      expect(combinations(11, 0)).toEqual(1);
      expect(combinations(11, 11)).toEqual(1);
    });
  });

  describe('chanceOfDesiredDrawProp5', () => {
    it('calculates chances for a normal 11 pull', () => {
      // A normal banner for which we want 5 on-banner relics and no off-banner
      // relics.
      const { desiredChance, expectedValue } = chanceOfDesiredDrawProp5(
        { drawCount: 11, guaranteedCount: 1, guaranteedRarity: 5 },
        0.1404,
        0.05,
      );
      expect(desiredChance).toBeCloseTo(0.5319173336944308);
      expect(expectedValue).toBeCloseTo(0.6784661320463586);
    });
  });
});
