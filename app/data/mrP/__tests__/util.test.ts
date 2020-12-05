import { parseNumberString } from '../util';

describe('mrP/util', () => {
  describe('parseNumberString', () => {
    it('parses number strings', () => {
      expect(parseNumberString('One')).toEqual(1);
      expect(parseNumberString('Twenty-two')).toEqual(22);
    });
  });
});
