import { getType } from 'typesafe-actions';

import { clearDropItems, DropItem, setDropItems} from '../actions/battle';

export interface BattleState {
  dropItems?: DropItem[] | null;
}

// FIXME: Types for actions
export default function battle(state: BattleState = {}, action: any): BattleState {
  switch (action.type) {
    case getType(setDropItems):
      return {
        ...state,
        dropItems: action.payload.dropItems
      };

    case getType(clearDropItems):
      return {
        ...state,
        dropItems: null
      };

    default:
      return state;
  }
}
