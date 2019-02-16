import { getType } from 'typesafe-actions';

import { produce } from 'immer';
import * as _ from 'lodash';

import {
  obtainRecordMateria,
  RecordMateria,
  RecordMateriaAction,
  setRecordMateria,
  setRecordMateriaInventory,
  updateRecordMateriaInventory,
} from '../actions/recordMateria';
import { arrayify } from '../utils/typeUtils';

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
  favorites:
    | undefined
    | {
        [id: number]: boolean;
      };
  inventory:
    | undefined
    | {
        [id: number]: boolean;
      };

  // Whether each record materia is obtained.  We used to derive this from the
  // Library page and store it with RecordMateria, but it's not consistently
  // reported here, so we also track it here, derived from the party list, and
  // use this to help maintain RecordMateria.obtained.
  obtained:
    | undefined
    | {
        [id: number]: boolean;
      };
}

const initialState = {
  recordMateria: {},
  favorites: undefined,
  inventory: undefined,
  obtained: undefined,
};

const toSet = (ids: number[]) => _.fromPairs(_.map(ids, i => [i, true]));

export function recordMateria(
  state: RecordMateriaState = initialState,
  action: RecordMateriaAction,
): RecordMateriaState {
  return produce(state, (draft: RecordMateriaState) => {
    switch (action.type) {
      case getType(obtainRecordMateria):
        const ids = arrayify(action.payload.id);

        for (const i of ids) {
          if (draft.recordMateria[i]) {
            draft.recordMateria[i].obtained = true;
          }
        }

        if (draft.obtained != null) {
          for (const i of ids) {
            draft.obtained[i] = true;
          }
        }

        if (draft.inventory != null) {
          for (const i of ids) {
            draft.inventory[i] = true;
          }
        }

        return;

      case getType(setRecordMateria):
        draft.recordMateria = action.payload.recordMateria;

        // Record materia as obtained from

        return;

      case getType(setRecordMateriaInventory): {
        const all = [...action.payload.inventory, ...action.payload.warehouse];

        for (const i of all) {
          if (draft.recordMateria[i]) {
            draft.recordMateria[i].obtained = true;
          }
        }

        draft.inventory = toSet(action.payload.inventory);
        draft.favorites = toSet(action.payload.favorites);
        draft.obtained = toSet(all);

        return;
      }

      case getType(updateRecordMateriaInventory): {
        const { id, inventory, favorite } = action.payload;
        if (draft.inventory != null && inventory != null) {
          draft.inventory[id] = inventory;
        }
        if (draft.favorites != null && favorite != null) {
          draft.favorites[id] = favorite;
        }
        if (draft.obtained != null && (inventory != null || favorite != null)) {
          draft.obtained[id] = true;
        }
        return;
      }
    }
  });
}
