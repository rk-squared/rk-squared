import * as _ from 'lodash';

import { closeBannersExcept, RelicDrawBanner } from '../../actions/relicDraws';
import { mergeFirstMythrilCost, relicDraws, updateGroupFirstMythrilCosts } from '../relicDraws';

import { FAR_FUTURE } from '../../utils/timeUtils';

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

  describe('closeBannersExcept', () => {
    it('closes currently open banners', () => {
      const now = Date.now() / 1000;
      const oneWeek = 3600 * 24 * 7;
      const originalRealmBanner = makeBanner(874, 50, 'group7');
      const refreshedRealmBanner = makeBanner(4181, 50, 'group17');
      const oldStandaloneBanner = makeBanner(4204, 50);
      const standaloneBanner = makeBanner(4207, 50);
      originalRealmBanner.closedAt = refreshedRealmBanner.closedAt = FAR_FUTURE;
      oldStandaloneBanner.closedAt = now - oneWeek;
      standaloneBanner.closedAt = now + oneWeek;

      const initialState = {
        banners: _.keyBy(
          [originalRealmBanner, refreshedRealmBanner, oldStandaloneBanner, standaloneBanner],
          'id',
        ),
        groups: {},
        probabilities: {},
        selections: {},
      };

      const newState = relicDraws(
        initialState,
        closeBannersExcept(now * 1000, [refreshedRealmBanner.id, standaloneBanner.id]),
      );

      expect(newState.banners[originalRealmBanner.id].closedAt).toBeLessThan(now);
      expect(newState.banners[refreshedRealmBanner.id].closedAt).toBeGreaterThan(now);
      expect(newState.banners[oldStandaloneBanner.id].closedAt).toEqual(now - oneWeek);
      expect(newState.banners[standaloneBanner.id].closedAt).toEqual(now + oneWeek);
    });
  });
});
