import { allTranceStatus, extractCount, isTranceStatus } from '../status';

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
          'Genesis Trance',
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

  describe('extractCount', () => {
    it('handles no counts', () => {
      expect(extractCount('Summoning')).toEqual([null, 'Summoning']);
    });

    it('handles simple counts', () => {
      expect(extractCount('three Dark')).toEqual([3, 'Dark']);
    });

    it('handles slash-separated counts', () => {
      expect(extractCount('1/2/3 Fire')).toEqual(['1/2/3', 'Fire']);
    });

    it('handles "twice"', () => {
      expect(extractCount('Renzokuken Freezeslash twice')).toEqual([2, 'Renzokuken Freezeslash']);
    });
  });
});
