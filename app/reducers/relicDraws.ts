import { produce } from 'immer';
import { getType } from 'typesafe-actions';

import * as _ from 'lodash';

import { defaultOptions } from '../actions/options';
import {
  clearWantedRelics,
  ExchangeShopSelections,
  expireOldRelicDrawBanners,
  RelicDrawAction,
  RelicDrawBanner,
  RelicDrawGroup,
  RelicDrawProbabilities,
  setExchangeShopSelections,
  setRelicDrawBannersAndGroups,
  setRelicDrawProbabilities,
  wantRelic,
} from '../actions/relicDraws';
import { RealmRelicDrawMythrilCost } from '../data/probabilities';
import { arrayify } from '../utils/typeUtils';

export interface RelicDrawState {
  banners: {
    [bannerId: number]: RelicDrawBanner;
  };
  groups: {
    [group: string]: RelicDrawGroup;
  };
  probabilities: {
    // should be [bannerId: number], but string is easier for Lodash to work with
    [bannerId: string]: RelicDrawProbabilities;
  };
  selections: {
    [exchangeShopId: number]: ExchangeShopSelections;
  };
  want?: {
    [relicId: number]: boolean;
  };
}

const initialState: RelicDrawState = {
  banners: {},
  groups: {},
  probabilities: {},
  selections: {},
  want: {},
};

export function mergeFirstMythrilCost(
  prevBanner: RelicDrawBanner,
  newBanner: RelicDrawBanner,
): RelicDrawBanner | null {
  const prevCost = prevBanner.cost;
  const newCost = newBanner.cost;
  if (!prevCost || !newCost) {
    return null;
  }
  const firstMythrilCost = _.min(
    _.filter(
      [
        prevCost.mythrilCost,
        prevCost.firstMythrilCost,
        newCost.mythrilCost,
        newCost.firstMythrilCost,
      ],
      i => i != null,
    ),
  );
  if (firstMythrilCost == null || firstMythrilCost === newCost.mythrilCost) {
    return null;
  }
  return {
    ...newBanner,
    cost: {
      ...newBanner.cost,
      firstMythrilCost,
    },
  };
}

export function mergeBannersFirstMythrilCost(
  newBanners: {
    [bannerId: number]: RelicDrawBanner;
  },
  prevBanners: {
    [bannerId: number]: RelicDrawBanner;
  },
) {
  _.forEach(newBanners, (newBanner, id) => {
    if (prevBanners[+id]) {
      const update = mergeFirstMythrilCost(prevBanners[+id], newBanner);
      if (update) {
        newBanners[+id] = update;
      }
    }
  });
}

/**
 * Realm Relic Draws were refreshed before tracking of mythrilCost and
 * firstMythrilCost was implemented, so backfill our data structures with what
 * we know those to be.
 */
export function updateGroupFirstMythrilCosts(
  banners: { [bannerId: number]: RelicDrawBanner },
  group: string,
  firstMythrilCost: number,
) {
  _.forEach(banners, (banner, id) => {
    if (
      banner.group !== group ||
      !banner.cost ||
      !banner.cost.mythrilCost ||
      banner.cost.mythrilCost === firstMythrilCost
    ) {
      return;
    }
    banners[+id] = {
      ...banner,
      cost: {
        ...banner.cost,
        firstMythrilCost,
      },
    };
  });
}

export function relicDraws(
  state: RelicDrawState = initialState,
  action: RelicDrawAction,
): RelicDrawState {
  return produce(state, (draft: RelicDrawState) => {
    switch (action.type) {
      case getType(setRelicDrawBannersAndGroups): {
        const newBanners = _.keyBy(action.payload.banners, 'id');

        mergeBannersFirstMythrilCost(newBanners, state.banners);
        updateGroupFirstMythrilCosts(newBanners, 'group7', RealmRelicDrawMythrilCost);

        Object.assign(draft.banners, newBanners);
        Object.assign(draft.groups, _.keyBy(action.payload.groups, 'groupName'));

        return;
      }

      case getType(setRelicDrawProbabilities):
        draft.probabilities[action.payload.bannerId] = action.payload.probabilities;
        return;

      case getType(setExchangeShopSelections): {
        const { exchangeShopId, selections } = action.payload;
        draft.selections = draft.selections || {};
        draft.selections[exchangeShopId] = selections;
        return;
      }

      case getType(expireOldRelicDrawBanners): {
        const maxAgeInDays =
          action.payload.maxAgeInDays != null
            ? action.payload.maxAgeInDays
            : defaultOptions.maxOldRelicDrawBannerAgeInDays;

        const minClosedAt = action.payload.currentTime / 1000 - maxAgeInDays * 24 * 3600;

        draft.banners = _.omitBy(
          draft.banners,
          (value: RelicDrawBanner) => value.closedAt < minClosedAt,
        );

        const usedGroups = new Set<string>(_.map(draft.banners, i => i.group).filter(
          i => i != null,
        ) as string[]);
        draft.groups = _.pickBy(draft.groups, (value, key) => usedGroups.has(key));

        draft.probabilities = _.pickBy(
          draft.probabilities,
          (value, key) => draft.banners[+key] != null,
        );

        // This would be the logical place to also expire old exchange shop
        // selections, but we want to keep those around so that we can show
        // which selections are new.
        return;
      }

      case getType(wantRelic): {
        const relicIds = arrayify(action.payload.relicId);
        draft.want = draft.want || {};
        if (!action.payload.want) {
          for (const id of relicIds) {
            delete draft.want[id];
          }
        } else {
          for (const id of relicIds) {
            draft.want[id] = true;
          }
        }
        return;
      }

      case getType(clearWantedRelics): {
        draft.want = draft.want || {};
        for (const id of action.payload) {
          delete draft.want[id];
        }
        return;
      }
    }
  });
}
