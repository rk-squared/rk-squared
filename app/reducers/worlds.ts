import { produce } from 'immer';
import { getType } from 'typesafe-actions';

import {
  RecordWorldChapter,
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

  /**
   * Record dungeon chapter information.  This is duplicated within the worlds
   * object, but keeping it in its canonical form here lets us easily re-apply
   * it when the list of worlds is updated from the game.
   */
  recordWorldChapters?: RecordWorldChapter[];
}

function applyRecordWorldChapters(
  worldsObject: { [id: number]: World },
  chapters: RecordWorldChapter[],
) {
  const worldsList = Object.values(worldsObject);
  chapters.forEach(({ firstWorldId, name }, i) => {
    const lastWorldId = i + 1 < chapters.length ? chapters[i + 1].firstWorldId : Infinity;
    worldsList
      .filter(
        w => w.category === WorldCategory.Record && w.id >= firstWorldId && w.id < lastWorldId,
      )
      .forEach(w => {
        w.subcategory = name;
        w.subcategorySortOrder = i;
      });
  });
}

export function worlds(state: WorldState = {}, action: WorldAction): WorldState {
  return produce(state, (draft: WorldState) => {
    switch (action.type) {
      case getType(updateWorlds):
        draft.worlds = action.payload.worlds;
        if (draft.recordWorldChapters) {
          applyRecordWorldChapters(draft.worlds, draft.recordWorldChapters);
        }
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
        draft.recordWorldChapters = action.payload;
        if (draft.worlds) {
          applyRecordWorldChapters(draft.worlds, action.payload);
        }
        return;
    }
  });
}
