import { getType } from 'typesafe-actions';

import * as _ from 'lodash';

import {
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
  favorites: {},
  inventory: {},
};

const toSet = (ids: number[]) =>
  _.fromPairs(_.map(ids, i => [i, true]));

/// If a record materia is in our inventory, then we know that we've obtained it.
const toObtainedUpdate = (rm: { [id: number]: RecordMateria }, ids: number[]) => ({
  recordMateria: _.fromPairs(_.map(_.filter(ids, id => rm[id]), id => [id, { obtained: true }]))
});

export function recordMateria(state: RecordMateriaState = initialState,
                              action: RecordMateriaAction): RecordMateriaState {
  switch (action.type) {
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
      const update: any = {};
      if (action.payload.inventory != null) {
        update.inventory = { [action.payload.id]: action.payload.inventory };
      }
      if (action.payload.favorite != null) {
        update.favorites = { [action.payload.id]: action.payload.favorite };
      }
      return u.update(update, state);
    }

    default:
      return state;
  }
}
