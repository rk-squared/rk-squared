import { produce } from 'immer';
import { getType } from 'typesafe-actions';

import { setWorldIcon, unlockWorld, updateWorlds, World, WorldAction } from '../actions/worlds';

export interface WorldState {
  worlds?: {
    [id: number]: World;
  };
}

export function worlds(state: WorldState = {}, action: WorldAction): WorldState {
  return produce(state, (draft: WorldState) => {
    switch (action.type) {
      case getType(updateWorlds):
        draft.worlds = action.payload.worlds;
        return;

      case getType(unlockWorld):
        if (draft.worlds) {
          draft.worlds[action.payload].isUnlocked = true;
        }
        return;

      case getType(setWorldIcon):
        if (draft.worlds && draft.worlds[action.payload.worldId]) {
          draft.worlds[action.payload.worldId].iconUrl = action.payload.icon.iconUrl;
          draft.worlds[action.payload.worldId].localIcon = action.payload.icon.localIcon;
        }
        return;
    }
  });
}
