import { getType } from 'typesafe-actions';

import { addWorldDungeons, Dungeon, updateDungeon } from '../actions/dungeons';

export interface DungeonState {
  dungeons: {
    [id: number]: Dungeon
  };
  byWorld: {
    [id: number]: number[];
  };
}

const initialState = {
  dungeons: {},
  byWorld: {},
};

// FIXME: Types for actions
export default function worlds(state: DungeonState = initialState, action: any): DungeonState {
  switch (action.type) {
    case getType(addWorldDungeons):
      const newDungeons: {[id: number]: Dungeon} = {...state.dungeons};
      for (const i of action.payload.dungeons) {
        newDungeons[i.id] = i;
      }

      return {
        dungeons: newDungeons,
        byWorld: {
          ...state.byWorld,
          [action.payload.worldId]: action.payload.dungeons.map((i: Dungeon) => i.id)
        }
      };

    case getType(updateDungeon):
      // FIXME: https://github.com/piotrwitek/typesafe-actions#reducer-switch-cases gets strong typing without this?
      // Or switch other reduces to use this.
      const payload = (action as ReturnType<typeof updateDungeon>).payload;
      if (!state.dungeons[payload.dungeonId]) {
        // Missing dungeon info - no sense in storing incomplete info.
        return state;
      }
      return {
        ...state,
        dungeons: {
          ...state.dungeons,
          [payload.dungeonId]: {
            ...state.dungeons[payload.dungeonId],
            ...payload.dungeon
          }
        }
      };

    default:
      return state;
  }
}
