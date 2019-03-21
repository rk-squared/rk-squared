import { produce } from 'immer';
import { getType } from 'typesafe-actions';

import * as _ from 'lodash';

import {
  GachaAction,
  GachaBanner,
  GachaGroup,
  GachaProbabilities,
  setGachaBanners,
  setGachaGroups,
  setGachaProbabilities,
} from '../actions/gacha';

export interface GachaState {
  banners: {
    [bannerId: number]: GachaBanner;
  };
  groups: {
    [group: string]: GachaGroup;
  };
  probabilities: {
    [bannerId: string]: GachaProbabilities;
  };
}

const initialState: GachaState = {
  banners: {},
  groups: {},
  probabilities: {},
};

export function gacha(state: GachaState = initialState, action: GachaAction): GachaState {
  return produce(state, (draft: GachaState) => {
    switch (action.type) {
      case getType(setGachaBanners): {
        const newBanners = _.keyBy(action.payload, 'id');
        draft.banners = newBanners;
        draft.probabilities = _.pickBy(
          draft.probabilities,
          (value, key) => newBanners[key] != null,
        );
        return;
      }

      case getType(setGachaGroups):
        draft.groups = _.keyBy(action.payload, 'groupName');
        return;

      case getType(setGachaProbabilities):
        draft.probabilities[action.payload.bannerId] = action.payload.probabilities;
        return;
    }
  });
}
