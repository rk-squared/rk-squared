import { allTranceStatus, isTranceStatus } from '../status';

import { enlir } from '../../enlir';

describe('mrP/status', () => {
  describe('isTranceStatus', () => {
    it('identifies trance statuses', () => {
      // It's simpler to list them all...
      expect(allTranceStatus).toEqual(
        new Set([
          'Biggs Trance',
          'Gilgamesh Trance',
          'Terra Trance',
          'Phoenix Mode',
          'Galian Beast',
          'Sephiroth Trance',
          'Angeal Trance',
          'Zidane Trance',
          'Garnet Trance',
          'Vivi Trance',
          'Steiner Trance',
          'Freya Trance',
          'Quina Trance',
          'Eiko Trance',
          'Amarant Trance',
          'Play Rough Mode',
          'Queen Trance',
          'Back to the Wall Mode',
        ]),
      );

      expect(isTranceStatus(enlir.statusByName['EX: Dreadwyrm Trance'])).toEqual(false);
    });
  });
});
