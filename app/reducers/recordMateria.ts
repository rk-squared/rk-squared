import { getType } from 'typesafe-actions';

import * as _ from 'lodash';

import {
  obtainRecordMateria,
  RecordMateria,
  RecordMateriaAction,
  setRecordMateria,
  setRecordMateriaInventory,
  updateRecordMateriaInventory
} from '../actions/recordMateria';

const u = require('updeep');

export interface RecordMateriaState {
  recordMateria: {
    [id: number]: RecordMateria;
  };

  // Whether each record materia is a favorite, and whether it's in inventory
  // (instead of the vault).  Storing these separately from the recordMateria
  // list is a bit artificial, but it lets us process the main record materia
  // list all at once from the Library page while still updating these whenever
  // the party list is loaded.
  //
  // (The alternative would be to process the record materia list from the party
  // list, vault (if possible), and Enlir.)
  favorites: undefined | {
    [id: number]: boolean;
  };
  inventory: undefined | {
    [id: number]: boolean;
  };
}

const initialState = {
  recordMateria: {},
  favorites: undefined,
  inventory: undefined,
};

const toSet = (ids: number[]) =>
  _.fromPairs(_.map(ids, i => [i, true]));

/// If a record materia is in our inventory, then we know that we've obtained it.
const toObtainedUpdate = (rm: { [id: number]: RecordMateria }, ids: number[]) => ({
  recordMateria: _.fromPairs(_.map(_.filter(ids, id => rm[id]), id => [id, { obtained: true }]))
});

const toInventoryListUpdate = (ids: number[]) => ({
  inventory: _.fromPairs(_.map(ids, i => [i, true]))
});

const toInventoryUpdate = (id: number, inventory: boolean | undefined, favorite: boolean | undefined) => {
  const update: any = {};
  if (inventory != null) {
    update.inventory = { [id]: inventory };
  }
  if (favorite != null) {
    update.favorites = { [id]: favorite };
  }
  return update;
};

export function recordMateria(state: RecordMateriaState = initialState,
                              action: RecordMateriaAction): RecordMateriaState {
  switch (action.type) {
    case getType(obtainRecordMateria):
      const ids = Array.isArray(action.payload.id) ? action.payload.id : [action.payload.id];

      state = u.update(toObtainedUpdate(state.recordMateria, ids), state);

      if (state.inventory != null) {
        state = u.update(toInventoryListUpdate(ids), state);
      }

      return state;

    case getType(setRecordMateria):
      return {
        ...state,
        recordMateria: action.payload.recordMateria
      };

    case getType(setRecordMateriaInventory): {
      return {
        ...u.update(toObtainedUpdate(state.recordMateria, action.payload.inventory), state),
        inventory: toSet(action.payload.inventory),
        favorites: toSet(action.payload.favorites),
      };
    }

    case getType(updateRecordMateriaInventory): {
      if (state.favorites == null) {
        // Never saw inventory - can't do a partial update.
        return state;
      }

      const { id, inventory, favorite } = action.payload;
      return u.update(toInventoryUpdate(id, inventory, favorite), state);
    }

    /* istanbul ignore next */
    default:
      return state;
  }
}
