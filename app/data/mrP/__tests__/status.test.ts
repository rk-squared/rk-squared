import { allTranceStatus, isTranceStatus } from '../status';

import { enlir } from '../../enlir';

describe('mrP/status', () => {
  describe('isTranceStatus', () => {
    it('identifies trance statuses', () => {
      // It's simpler to list them all...
      expect(allTranceStatus).toEqual(
        new Set([
          'Amarant Trance',
          'Angeal Trance',
          'Back to the Wall Mode',
          'Biggs Trance',
          'Black Flurry Mode',
          'Eiko Trance',
          'Freya Trance',
          'Beast Mode',
          'Garnet Trance',
          'Gilgamesh Trance',
          'Phoenix Mode',
          'Play Rough Mode',
          'Queen Trance',
          'Quina Trance',
          'Sephiroth Trance',
          'Steiner Trance',
          'Terra Trance',
          'Vivi Trance',
          'Zidane Trance',
        ]),
      );

      expect(isTranceStatus(enlir.statusByName['EX: Dreadwyrm Trance'])).toEqual(false);
    });
  });
});
