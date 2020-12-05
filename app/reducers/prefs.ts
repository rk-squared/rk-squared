/**
 * @file
 * Reducer for user preferences within RK Squared
 */

import { getType } from 'typesafe-actions';

import { produce } from 'immer';
import * as _ from 'lodash';

import {
  Prefs,
  PrefsAction,
  setLastFilename,
  showItemType,
  showItemTypes,
  ShowSoulBreaksType,
  updatePrefs,
} from '../actions/prefs';
import { ItemType } from '../data/items';

export type PrefsState = Prefs;

export const initialState: PrefsState = {
  showItemType: _.fromPairs(Object.keys(ItemType).map(i => [(ItemType as any)[i], true])) as {
    [t in ItemType]: boolean;
  },
  showSoulBreaks: ShowSoulBreaksType.All,
};

export function prefs(state: PrefsState = initialState, action: PrefsAction): PrefsState {
  return produce(state, (draft: PrefsState) => {
    switch (action.type) {
      case getType(showItemType):
        draft.showItemType[action.payload.type] = action.payload.show;
        return;

      case getType(showItemTypes):
        Object.assign(draft.showItemType, action.payload.updates);
        return;

      case getType(updatePrefs):
        Object.assign(draft, action.payload);
        return;

      case getType(setLastFilename):
        draft.lastFilename = draft.lastFilename || {};
        draft.lastFilename[action.payload.key] = action.payload.lastFilename;
        return;
    }
  });
}
