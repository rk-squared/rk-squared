import * as _ from 'lodash';

import { RelicDrawBanner } from '../../actions/relicDraws';
import { mergeFirstMythrilCost, updateGroupFirstMythrilCosts } from '../relicDraws';

const makeBanner = (id: number, mythrilCost: number, group?: string): RelicDrawBanner => {
  const now = Date.now() / 1000;
  return {
    id,
    group,
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

  describe('updateGroupRelicDrawCosts', () => {
    it('updates Realm Relic Draw banners', () => {
      const group = 'group1';
      const pulledRealmBanner = makeBanner(1, 50, group);
      const newRealmBanner = makeBanner(2, 15, group);
      const standaloneBanner = makeBanner(3, 50);
      const banners = _.keyBy([pulledRealmBanner, newRealmBanner, standaloneBanner], 'id');

      updateGroupFirstMythrilCosts(banners, group, 15);

      expect(banners[pulledRealmBanner.id].cost!.firstMythrilCost).toEqual(15);
      expect(banners[pulledRealmBanner.id].cost!.mythrilCost).toEqual(50);
      expect(banners[newRealmBanner.id].cost!.firstMythrilCost).toBeFalsy();
      expect(banners[newRealmBanner.id].cost!.mythrilCost).toEqual(15);
      expect(banners[standaloneBanner.id].cost!.firstMythrilCost).toBeFalsy();
      expect(banners[standaloneBanner.id].cost!.mythrilCost).toEqual(50);
    });
  });
});
