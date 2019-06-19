import { RelicDrawBanner } from '../../actions/relicDraws';

import * as _ from 'lodash';
import { mergeFirstMythrilCost } from '../relicDraws';

const makeBanner = (id: number, mythrilCost: number): RelicDrawBanner => {
  const now = Date.now() / 1000;
  return {
    id,
    imageUrl: 'localhost',
    openedAt: now,
    closedAt: now,
    sortOrder: 0,
    canPull: true,
    canSelect: false,
    cost: {
      drawCount: 11,
      mythrilCost,
    },
  };
};

describe('relicDraws reducer', () => {
  describe('mergeFirstMythrilCost', () => {
    it('merges half-priced banners', () => {
      const prevBanner = makeBanner(1, 25);
      const newBanner = makeBanner(1, 50);
      const update = mergeFirstMythrilCost(prevBanner, newBanner);
      expect(update).toBeTruthy();
      expect(update!.cost).toBeTruthy();
      expect(update!.cost!.firstMythrilCost).toEqual(25);
      expect(update!.cost!.mythrilCost).toEqual(50);
    });

    it('leaves full-priced banners alone', () => {
      const prevBanner = makeBanner(1, 50);
      const newBanner = makeBanner(1, 50);
      const update = mergeFirstMythrilCost(prevBanner, newBanner);
      expect(update).toEqual(null);
    });
  });
});
