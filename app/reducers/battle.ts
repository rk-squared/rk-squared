import { getType } from 'typesafe-actions';

import { BattleAction, clearDropItems, DropItem, setDropItems } from '../actions/battle';

export interface BattleState {
  dropItems: DropItem[] | null;
}

const initialState = {
  dropItems: null,
};

export function battle(state: BattleState = initialState, action: BattleAction): BattleState {
  switch (action.type) {
    case getType(setDropItems):
      return {
        ...state,
        dropItems: action.payload.dropItems,
      };

    case getType(clearDropItems):
      return {
        ...state,
        dropItems: null,
      };

    /* istanbul ignore next */
    default:
      return state;
  }
}
