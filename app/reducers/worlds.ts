import { getType } from 'typesafe-actions';

import { updateWorlds, World } from '../actions/worlds';

export interface WorldState {
  worlds?: {
    [id: number]: World
  };
}

// FIXME: Types for actions
export default function worlds(state: WorldState = {}, action: any): WorldState {
  switch (action.type) {
    case getType(updateWorlds):
      // FIXME: Merge, instead of replace, motes and power up dungeons
      return {
        ...state,
        worlds: action.payload.worlds
      };

    default:
      return state;
  }
}
