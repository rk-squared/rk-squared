import { parseNumberString, parsePercentageCounts } from '../util';

describe('mrP/util', () => {
  describe('parseNumberString', () => {
    it('parses number strings', () => {
      expect(parseNumberString('One')).toEqual(1);
      expect(parseNumberString('Twenty-two')).toEqual(22);
    });
  });

  describe('parsePercentageCounts', () => {
    it('parses percentage counts', () => {
      expect(
        parsePercentageCounts(
          'Randomly deals one (74%), two (25%) or thirteen (1%) single attacks',
        ),
      ).toEqual([[1, 74], [2, 25], [13, 1]]);
    });
  });
});
