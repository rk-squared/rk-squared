import { createAction } from 'typesafe-actions';
import { DropItemId, ItemType } from '../data/items';
import { TimeT } from '../utils/timeUtils';

import * as _ from 'lodash';

export interface PrizeItem {
  type: ItemType;
  amount: number;
  name: string;
  id: number;
}

export interface Dungeon {
  name: string;
  id: number;

  openedAt: TimeT;
  closedAt: TimeT;
  seriesId: number;

  isUnlocked: boolean;
  isComplete: boolean;
  isMaster: boolean;

  difficulty: number;
  totalStamina: number;
  staminaList: number[];
  dungeonChests?: number | undefined; // Unclaimed record dungeon chests

  prizes: {
    completion: PrizeItem[];
    firstTime: PrizeItem[];
    mastery: PrizeItem[];
    claimedGrade?: PrizeItem[]; // One-time grade-based prizes
    unclaimedGrade?: PrizeItem[]; // (speed, damage done, etc.)
  };
}

export function formatDifficulty(dungeon: Dungeon): string {
  return dungeon.difficulty === 0 ? '???' : dungeon.difficulty.toString();
}

function makeDungeonChestPrizeItem(amount: number): PrizeItem {
  return {
    type: ItemType.DropItem,
    amount,
    id: DropItemId.Chest1Star,
    name: '??? Dungeon Chest',
  };
}

export function hasAvailablePrizes(dungeon: Dungeon): boolean {
  const unclaimedGrade = dungeon.prizes.unclaimedGrade || [];
  return (
    !dungeon.isComplete ||
    !dungeon.isMaster ||
    unclaimedGrade.length !== 0 ||
    (dungeon.dungeonChests || 0) !== 0
  );
}

export function getAvailablePrizes(dungeonOrDungeons: Dungeon | Dungeon[]): PrizeItem[] {
  const dungeons = Array.isArray(dungeonOrDungeons) ? dungeonOrDungeons : [dungeonOrDungeons];

  const result: { [id: number]: PrizeItem } = {};

  function addPrizes(prizes: PrizeItem[]) {
    if (!prizes) {
      return;
    }
    for (const p of prizes) {
      if (result[p.id]) {
        result[p.id].amount += p.amount;
      } else {
        result[p.id] = { ...p };
      }
    }
  }

  for (const d of dungeons) {
    if (!d.isComplete) {
      addPrizes(d.prizes.firstTime);
    }
    if (!d.isMaster) {
      addPrizes(d.prizes.mastery);
    }
    addPrizes(d.prizes.unclaimedGrade || []);
  }

  const ids = Object.keys(result).sort();
  const sortedPrizes = ids.map(i => result[+i]);

  const dungeonChests = _.sumBy(dungeons, i => i.dungeonChests || 0);
  if (dungeonChests) {
    sortedPrizes.push(makeDungeonChestPrizeItem(dungeonChests));
  }

  return sortedPrizes;
}

/**
 * Add (replace) the list of dungeons for a world.
 */
export const addWorldDungeons = createAction(
  'ADD_WORLD_DUNGEONS',
  (worldId: number, dungeons: Dungeon[]) => ({
    type: 'ADD_WORLD_DUNGEONS',
    payload: {
      worldId,
      dungeons,
    },
  }),
);

/**
 * Remove (forget) the list of dungeons for a world.
 */
export const forgetWorldDungeons = createAction('FORGET_WORLD_DUNGEONS', (worldId: number) => ({
  type: 'FORGET_WORLD_DUNGEONS',
  payload: worldId,
}));

/**
 * Update the information on a single known dungeon.
 */
export const updateDungeon = createAction(
  'UPDATE_DUNGEON',
  (dungeonId: number, dungeon: Partial<Dungeon>) => ({
    type: 'UPDATE_DUNGEON',
    payload: {
      dungeonId,
      dungeon,
    },
  }),
);

/**
 * Mark an entire world's dungeons as completed and/or mastered.
 */
export const finishWorldDungeons = createAction(
  'FINISH_WORLD_DUNGEONS',
  (worldId: number, { isComplete, isMaster }: { isComplete?: boolean; isMaster?: boolean }) => ({
    type: 'FINISH_WORLD_DUNGEONS',
    payload: {
      worldId,
      isComplete,
      isMaster,
    },
  }),
);

/**
 * Instruct the app to load all unknown dungeons from the FFRK servers.
 */
export const loadDungeons = createAction('LOAD_DUNGEONS', (worldIds: number[]) => ({
  type: 'LOAD_DUNGEONS',
  payload: {
    worldIds,
  },
}));

export const openDungeonChest = createAction('OPEN_DUNGEON_CHEST', (dungeonId: number) => ({
  type: 'OPEN_DUNGEON_CHEST',
  payload: {
    dungeonId,
  },
}));

export type DungeonsAction = ReturnType<
  | typeof addWorldDungeons
  | typeof finishWorldDungeons
  | typeof forgetWorldDungeons
  | typeof openDungeonChest
  | typeof updateDungeon
  | typeof loadDungeons
>;
