import { createAction } from 'typesafe-actions';

import { TimeT } from '../utils/timeUtils';

export interface GachaBanner {
  id: number;
  imageUrl: string;
  openedAt: TimeT;
  closedAt: TimeT;
  sortOrder: number;

  canSelect: boolean;
  canPull: boolean;

  exchangeShopId?: number;

  group?: string;
  bannerItems?: number[];
}

export interface GachaGroup {
  groupName: string; // internal (not human-friendly) group name
  imageUrl: string;
  sortOrder: number;
}

export interface GachaProbabilities {
  byRarity: {
    [rarity: number]: number;
  };
  byItem: {
    [id: number]: number;
  };
}

export const setGachaBanners = createAction('SET_GACHA_BANNERS', (banners: GachaBanner[]) => ({
  type: 'SET_GACHA_BANNERS',
  payload: banners,
}));

export const setGachaGroups = createAction('SET_GACHA_GROUPS', (groups: GachaGroup[]) => ({
  type: 'SET_GACHA_GROUPS',
  payload: groups,
}));

export const setGachaProbabilities = createAction(
  'SET_GACHA_PROBABILITIES',
  (bannerId: number, probabilities: GachaProbabilities) => ({
    type: 'SET_GACHA_PROBABILITIES',
    payload: {
      bannerId,
      probabilities,
    },
  }),
);

export type GachaAction = ReturnType<
  typeof setGachaBanners | typeof setGachaGroups | typeof setGachaProbabilities
>;
