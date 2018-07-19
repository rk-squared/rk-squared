/**
 * @file
 * Reducer for user preferences within RK Squared
 */

import { getType } from 'typesafe-actions';

import { PrefsAction, showItemType, showItemTypes } from '../actions/prefs';
import { ItemType } from '../data/items';

import * as _ from 'lodash';

export interface PrefsState {
  showItemType: {
    [t in ItemType]: boolean;
  };
}

const initialState = {
  showItemType: _.fromPairs(
    Object.keys(ItemType).map(i => [ItemType[i as any], true])
  ) as { [t in ItemType]: boolean }
};

export function prefs(state: PrefsState = initialState, action: PrefsAction): PrefsState {
  switch (action.type) {
    case getType(showItemType):
      return {
        ...state,
        showItemType: {
          ...state.showItemType,
          [action.payload.type]: action.payload.show
        }
      };

    case getType(showItemTypes):
      return {
        ...state,
        showItemType: {
          ...state.showItemType,
          ...action.payload.updates
        }
      };

    /* istanbul ignore next */
    default:
      return state;
  }
}
