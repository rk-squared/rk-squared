import { createAction } from 'typesafe-actions';

import * as _ from 'lodash';

import { RelicDrawPullParams, StandardDrawCount } from '../data/probabilities';
import { logger } from '../utils/logger';
import { TimeT } from '../utils/timeUtils';

/**
 * Details on how much it costs to draw on a banner.  This is slightly
 * complicated by the time 1 vs. 3 vs. 11 pulls and gems vs. mythril and
 * various promotions are considered, so we try and simplify it and present it
 * in its own derived structure.
 */
export interface RelicDrawBannerCost {
  drawCount?: number;
  mythrilCost?: number;

  /**
   * Cost for 1st pull only, for cases where that differs.  Currently only
   * populated for banners where we know that it differs from mythrilCost
   * (i.e., for banners where we've already pulled once and seen the full
   * price ourselves), so it should always differ from mythrilCost.
   */
  firstMythrilCost?: number;

  /**
   * Guaranteed rarity and count.  FFRK only communicates these via its
   * rise_message string field.  To redice the amount of string processing
   * that we have to do, we ,ay instead hard-code it via special cases from
   * looking at other fields (like drawCount); see getBannerPullParams.  As a
   * result, these fields are normally blank.
   */
  guaranteedRarity?: number;
  /** See guaranteedRarity */
  guaranteedCount?: number;
}

export interface RelicDrawBanner {
  id: number;
  imageUrl: string;
  openedAt: TimeT;
  closedAt: TimeT;
  sortOrder: number;

  canPull: boolean;
  canSelect: boolean;
  pullLimit?: number;

  exchangeShopId?: number;

  group?: string;

  /**
   * Relic IDs of this banner's featured relics
   */
  bannerRelics?: number[];

  cost?: RelicDrawBannerCost;
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

export type ExchangeShopSelections = number[][];

export function getOffBannerRelics(
  banner: RelicDrawBanner,
  probabilities: RelicDrawProbabilities,
): number[] {
  const bannerSet = new Set<number>(banner.bannerRelics);
  return _.keys(probabilities.byRelic)
    .map(i => +i)
    .filter(i => !bannerSet.has(i));
}

export function getBannerDrawCount(banner: RelicDrawBanner) {
  return banner.cost && banner.cost.drawCount ? banner.cost.drawCount : StandardDrawCount;
}

function makeSimplePullParam(banner: RelicDrawBanner, drawCount: number) {
  return {
    drawCount,
    guaranteedRarity:
      banner.cost && banner.cost.guaranteedRarity ? banner.cost.guaranteedRarity : 5,
    guaranteedCount: banner.cost && banner.cost.guaranteedCount ? banner.cost.guaranteedCount : 1,
  };
}

export function getBannerPullParams(banner: RelicDrawBanner): RelicDrawPullParams[] {
  const drawCount = getBannerDrawCount(banner);
  if (drawCount === StandardDrawCount) {
    return [
      {
        drawCount: 1,
        guaranteedRarity: 0,
        guaranteedCount: 0,
      },
      {
        drawCount: 3,
        guaranteedRarity: 0,
        guaranteedCount: 0,
      },
      makeSimplePullParam(banner, drawCount),
    ];
  } else if (drawCount === 3) {
    // Realms on Parade / Luck of the Realms
    return [makeSimplePullParam(banner, drawCount)];
  } else if (drawCount === 40) {
    // 40x presents for festivals
    return [
      {
        drawCount,
        guaranteedRarity: 6,
        guaranteedCount: 2,
      },
    ];
  } else {
    // Unknown; return generic results.
    logger.warn(`Unknown relic draw: ${drawCount}`);
    return [makeSimplePullParam(banner, drawCount)];
  }
}

/**
 * Gets the "normal" banner pull parameters.  For example, a 11 pull also
 * offers x1 and x3 pulls, but those are rarely useful.
 */
export function getNormalBannerPullParams(banner: RelicDrawBanner): RelicDrawPullParams {
  return _.last(getBannerPullParams(banner))!;
}

export const setRelicDrawBannersAndGroups = createAction(
  'SET_RELIC_DRAW_BANNERS',
  (banners: RelicDrawBanner[], groups: RelicDrawGroup[]) => ({
    type: 'SET_RELIC_DRAW_BANNERS',
    payload: {
      banners,
      groups,
    },
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

export const setExchangeShopSelections = createAction(
  'SET_EXCHANGE_SHOP_SELECTIONS',
  (exchangeShopId: number, selections: ExchangeShopSelections) => ({
    type: 'SET_EXCHANGE_SHOP_SELECTIONS',
    payload: {
      exchangeShopId,
      selections,
    },
  }),
);

export const closeBannersExcept = createAction(
  'CLOSE_BANNERS_EXCEPT',
  (currentTime: number, exceptBannerIds: number[]) => ({
    type: 'CLOSE_BANNERS_EXCEPT',
    payload: {
      currentTime,
      exceptBannerIds,
    },
  }),
);

export const expireOldRelicDrawBanners = createAction(
  'EXPIRE_OLD_RELIC_DRAW_BANNERS',
  (currentTime: number, maxAgeInDays?: number) => ({
    type: 'EXPIRE_OLD_RELIC_DRAW_BANNERS',
    payload: {
      currentTime,
      maxAgeInDays,
    },
  }),
);

export const wantRelic = createAction(
  'WANT_RELIC',
  (relicId: number | number[], want: boolean) => ({
    type: 'WANT_RELIC',
    payload: {
      relicId,
      want,
    },
  }),
);

export const clearWantedRelics = createAction('CLEAR_WANTED_RELICS', (relicIds: number[]) => ({
  type: 'CLEAR_WANTED_RELICS',
  payload: relicIds,
}));

/**
 * Instruct the app to load all missing relic probabilities and exchange shop
 * selections from the FFRK servers.
 */
export const loadBanners = createAction('LOAD_BANNERS', (bannerIds: number[]) => ({
  type: 'LOAD_BANNERS',
  payload: {
    bannerIds,
  },
}));

export type RelicDrawAction = ReturnType<
  | typeof loadBanners
  | typeof setRelicDrawBannersAndGroups
  | typeof setRelicDrawProbabilities
  | typeof setExchangeShopSelections
  | typeof closeBannersExcept
  | typeof expireOldRelicDrawBanners
  | typeof wantRelic
  | typeof clearWantedRelics
>;
