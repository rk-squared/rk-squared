import { getType } from 'typesafe-actions';

import { updateWorlds, World, WorldAction } from '../actions/worlds';

export interface WorldState {
  worlds?: {
    [id: number]: World
  };
}

export function worlds(state: WorldState = {}, action: WorldAction): WorldState {
  switch (action.type) {
    case getType(updateWorlds):
      return {
        ...state,
        worlds: action.payload.worlds
      };

    default:
      return state;
  }
}
