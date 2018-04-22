import { getType } from 'typesafe-actions';

import { addWorldDungeons, Dungeon } from '../actions/dungeons';

export interface DungeonState {
  dungeons: {
    [id: number]: Dungeon
  };
  byWorld: {
    [id: number]: Dungeon[];
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
          [action.payload.worldId]: action.payload.dungeons
        }
      };

    default:
      return state;
  }
}
