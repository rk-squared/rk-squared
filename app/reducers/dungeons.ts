import { getType } from 'typesafe-actions';

import { produce } from 'immer';
import * as _ from 'lodash';

import {
  addWorldDungeons,
  Dungeon,
  DungeonsAction,
  finishWorldDungeons,
  forgetWorldDungeons,
  isLabyrinthPainting,
  openDungeonChest,
  updateDungeon,
} from '../actions/dungeons';
import { World } from '../actions/worlds';

export interface DungeonState {
  dungeons: {
    [id: number]: Dungeon;
  };
  byWorld: {
    [id: number]: number[];
  };
}

const initialState = {
  dungeons: {},
  byWorld: {},
};

export function getDungeonsForWorld(state: DungeonState, worldId: number): Dungeon[] | undefined {
  const worldDungeons = state.byWorld[worldId];
  return !worldDungeons
    ? undefined
    : worldDungeons.map((i: number) => state.dungeons[i]).filter((i) => !isLabyrinthPainting(i));
}

export function getDungeonsForWorlds(state: DungeonState, worlds: World[]): Dungeon[] {
  const worldDungeons: Array<Dungeon[] | undefined> = worlds.map((w) =>
    getDungeonsForWorld(state, w.id),
  );
  return _.flatten((_.filter(worldDungeons) as any) as Dungeon[][]);
}

export function getWorldIdForDungeon(state: DungeonState, dungeonId: number): number | undefined {
  const result = _.findKey(state.byWorld, (i) => i.indexOf(dungeonId) !== -1);
  return result ? +result : undefined;
}

export function dungeons(state: DungeonState = initialState, action: DungeonsAction): DungeonState {
  return produce(state, (draft: DungeonState) => {
    switch (action.type) {
      case getType(addWorldDungeons): {
        const newDungeons: { [id: number]: Dungeon } = { ...state.dungeons };
        for (const i of action.payload.dungeons) {
          newDungeons[i.id] = i;
        }

        draft.dungeons = newDungeons;
        draft.byWorld[action.payload.worldId] = action.payload.dungeons.map((i: Dungeon) => i.id);

        return;
      }

      case getType(finishWorldDungeons): {
        const { worldId, isComplete, isMaster } = action.payload;

        const dungeonUpdate: Partial<Dungeon> = {};
        if (isComplete) {
          dungeonUpdate.isComplete = true;
        }
        if (isMaster) {
          dungeonUpdate.isMaster = true;
        }

        for (const dungeonId of state.byWorld[worldId]) {
          const dungeon = draft.dungeons[dungeonId];
          if (isComplete) {
            dungeon.isComplete = true;
          }
          if (isMaster) {
            dungeon.isMaster = true;
          }
        }
        return;
      }

      case getType(forgetWorldDungeons):
        if (!state.byWorld[action.payload]) {
          return;
        }
        for (const dungeonId of state.byWorld[action.payload]) {
          delete draft.dungeons[dungeonId];
        }
        delete draft.byWorld[action.payload];
        return;

      case getType(openDungeonChest): {
        const { dungeonId } = action.payload;
        const dungeon = draft.dungeons[dungeonId];
        if (!dungeon || !dungeon.dungeonChests) {
          return;
        }
        dungeon.dungeonChests -= 1;
        return;
      }

      case getType(updateDungeon): {
        const { dungeonId, dungeon } = action.payload;
        if (!state.dungeons[dungeonId]) {
          // Missing dungeon info - no sense in storing incomplete info.
          return;
        }
        Object.assign(draft.dungeons[dungeonId], dungeon);
        return;
      }
    }
  });
}
