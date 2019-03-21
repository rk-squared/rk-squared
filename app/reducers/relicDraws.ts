import { produce } from 'immer';
import { getType } from 'typesafe-actions';

import * as _ from 'lodash';

import {
  RelicDrawAction,
  RelicDrawBanner,
  RelicDrawGroup,
  RelicDrawProbabilities,
  setRelicDrawBanners,
  setRelicDrawGroups,
  setRelicDrawProbabilities,
} from '../actions/relicDraws';

export interface RelicDrawState {
  banners: {
    [bannerId: number]: RelicDrawBanner;
  };
  groups: {
    [group: string]: RelicDrawGroup;
  };
  probabilities: {
    [bannerId: string]: RelicDrawProbabilities;
  };
}

const initialState: RelicDrawState = {
  banners: {},
  groups: {},
  probabilities: {},
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
        return;
      }

      case getType(setRelicDrawGroups):
        draft.groups = _.keyBy(action.payload, 'groupName');
        return;

      case getType(setRelicDrawProbabilities):
        draft.probabilities[action.payload.bannerId] = action.payload.probabilities;
        return;
    }
  });
}
