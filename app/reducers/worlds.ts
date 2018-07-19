import { getType } from 'typesafe-actions';

const u = require('updeep');

import { unlockWorld, updateWorlds, World, WorldAction } from '../actions/worlds';

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

    case getType(unlockWorld):
      return u.updateIn(['worlds', action.payload], {isUnlocked: true}, state);

    /* istanbul ignore next */
    default:
      return state;
  }
}
