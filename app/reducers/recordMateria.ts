import { getType } from 'typesafe-actions';

import * as _ from 'lodash';

import {
  RecordMateria,
  RecordMateriaAction,
  setRecordMateria,
  updateRecordMateriaInventory
} from '../actions/recordMateria';

export interface RecordMateriaState {
  recordMateria: {
    [id: number]: RecordMateria;
  };
  favorites: undefined | {
    [id: number]: boolean;
  };
  inventory: undefined | {
    [id: number]: boolean;
  };
}

const initialState = {
  recordMateria: {},
  favorites: {},
  inventory: {},
};

const toSet = (ids: number[]) => _.fromPairs(_.map(ids, i => [i, true]));

export function recordMateria(state: RecordMateriaState = initialState,
                              action: RecordMateriaAction): RecordMateriaState {
  switch (action.type) {
    case getType(setRecordMateria):
      return {
        ...state,
        recordMateria: action.payload.recordMateria
      };

    case getType(updateRecordMateriaInventory):
      return {
        ...state,
        inventory: toSet(action.payload.inventory),
        favorites: toSet(action.payload.favorites),
      };

    default:
      return state;
  }
}
