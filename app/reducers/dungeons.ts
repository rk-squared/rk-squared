import { getType } from 'typesafe-actions';

import { addWorldDungeons, Dungeon, DungeonsAction, updateDungeon } from '../actions/dungeons';
import { World } from '../actions/worlds';

import * as _ from 'lodash';

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

export function getDungeonsForWorld(state: DungeonState, worldId: number) {
  const worldDungeons = state.byWorld[worldId];
  return worldDungeons ? worldDungeons.map((i: number) => state.dungeons[i]) : undefined;
}

export function getDungeonsForWorlds(state: DungeonState, worlds: World[]) {
  const worldDungeons: Array<Dungeon[] | undefined> = worlds.map(
    w => getDungeonsForWorld(state, w.id)
  );
  return _.flatten(_.filter(worldDungeons) as any as Dungeon[][]);
}

export function dungeons(state: DungeonState = initialState, action: DungeonsAction): DungeonState {
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
      const { dungeonId, dungeon } = action.payload;
      if (!state.dungeons[dungeonId]) {
        // Missing dungeon info - no sense in storing incomplete info.
        return state;
      }
      return {
        ...state,
        dungeons: {
          ...state.dungeons,
          [dungeonId]: {
            ...state.dungeons[dungeonId],
            ...dungeon
          }
        }
      };

    /* istanbul ignore next */
    default:
      return state;
  }
}
