import { produce } from 'immer';
import { getType } from 'typesafe-actions';

import {
  setRecordWorldChapters,
  setWorldIcon,
  unlockWorld,
  updateWorlds,
  World,
  WorldAction,
  WorldCategory,
} from '../actions/worlds';

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

      case getType(setRecordWorldChapters):
        if (!draft.worlds) {
          return;
        }
        const draftWorlds = Object.values(draft.worlds);
        action.payload.forEach(({ firstWorldId, name }, i) => {
          const lastWorldId =
            i + 1 < action.payload.length ? action.payload[i + 1].firstWorldId : Infinity;
          draftWorlds
            .filter(
              w =>
                w.category === WorldCategory.Record && w.id >= firstWorldId && w.id < lastWorldId,
            )
            .forEach(w => {
              w.subcategory = name;
              w.subcategorySortOrder = i;
            });
        });
        return;
    }
  });
}
