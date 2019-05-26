import { produce } from 'immer';
import { getType } from 'typesafe-actions';

import * as _ from 'lodash';

import {
  clearWantedRelics,
  ExchangeShopSelections,
  RelicDrawAction,
  RelicDrawBanner,
  RelicDrawGroup,
  RelicDrawProbabilities,
  setExchangeShopSelections,
  setRelicDrawBanners,
  setRelicDrawGroups,
  setRelicDrawProbabilities,
  wantRelic,
} from '../actions/relicDraws';

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

export function relicDraws(
  state: RelicDrawState = initialState,
  action: RelicDrawAction,
): RelicDrawState {
  return produce(state, (draft: RelicDrawState) => {
    switch (action.type) {
      case getType(setRelicDrawBanners): {
        const newBanners = _.keyBy(action.payload, 'id');
        draft.banners = newBanners;
        draft.probabilities = _.pickBy(
          draft.probabilities,
          (value, key) => newBanners[key] != null,
        );
        // This would be the logical place to also expire old exchange shop
        // selections, but we want to keep those around so that we can show
        // which selections are new.
        return;
      }

      case getType(setRelicDrawGroups):
        draft.groups = _.keyBy(action.payload, 'groupName');
        return;

      case getType(setRelicDrawProbabilities):
        draft.probabilities[action.payload.bannerId] = action.payload.probabilities;
        return;

      case getType(setExchangeShopSelections): {
        const { exchangeShopId, selections } = action.payload;
        draft.selections = draft.selections || {};
        draft.selections[exchangeShopId] = selections;
        return;
      }

      case getType(wantRelic): {
        const { relicId, want } = action.payload;
        draft.want = draft.want || {};
        if (!want) {
          delete draft.want[relicId];
        } else {
          draft.want[relicId] = want;
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
