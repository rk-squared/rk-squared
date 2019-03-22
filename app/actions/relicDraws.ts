import { createAction } from 'typesafe-actions';

import * as _ from 'lodash';

import { TimeT } from '../utils/timeUtils';

export interface RelicDrawBanner {
  id: number;
  imageUrl: string;
  openedAt: TimeT;
  closedAt: TimeT;
  sortOrder: number;

  canPull: boolean;
  canSelect: boolean;

  exchangeShopId?: number;

  group?: string;
  bannerRelics?: number[];
}

export interface RelicDrawGroup {
  groupName: string; // internal (not human-friendly) group name
  imageUrl: string;
  sortOrder: number;
}

export interface RelicDrawProbabilities {
  byRarity: {
    [rarity: number]: number;
  };
  byRelic: {
    [relicId: number]: number;
  };
}

export function getOffBannerRelics(
  banner: RelicDrawBanner,
  probabilities: RelicDrawProbabilities,
): number[] {
  const bannerSet = new Set<number>(banner.bannerRelics);
  return _.keys(probabilities.byRelic)
    .map(i => +i)
    .filter(i => !bannerSet.has(i));
}

export const setRelicDrawBanners = createAction(
  'SET_RELIC_DRAW_BANNERS',
  (banners: RelicDrawBanner[]) => ({
    type: 'SET_RELIC_DRAW_BANNERS',
    payload: banners,
  }),
);

export const setRelicDrawGroups = createAction(
  'SET_RELIC_DRAW_GROUPS',
  (groups: RelicDrawGroup[]) => ({
    type: 'SET_RELIC_DRAW_GROUPS',
    payload: groups,
  }),
);

export const setRelicDrawProbabilities = createAction(
  'SET_RELIC_DRAW_PROBABILITIES',
  (bannerId: number, probabilities: RelicDrawProbabilities) => ({
    type: 'SET_RELIC_DRAW_PROBABILITIES',
    payload: {
      bannerId,
      probabilities,
    },
  }),
);

export type RelicDrawAction = ReturnType<
  typeof setRelicDrawBanners | typeof setRelicDrawGroups | typeof setRelicDrawProbabilities
>;
