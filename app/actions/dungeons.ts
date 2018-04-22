import { createAction } from 'typesafe-actions';
import { ItemType } from '../data/items';

export interface PrizeItem {
  type: ItemType;
  amount: number;
  name: string;
  id: number;
}

export interface Dungeon {
  name: string;
  id: number;

  openedAt: number;  // FIXME: Proper type for seconds-since-the-epoch
  closedAt: number;
  seriesId: number;

  isUnlocked: boolean;
  isComplete: boolean;
  isMaster: boolean;

  difficulty: number;
  totalStamina: number;
  staminaList: number[];

  prizes: {
    completion: PrizeItem[];
    firstTime: PrizeItem[];
    mastery: PrizeItem[];
  };
}

export const addWorldDungeons = createAction('ADD_WORLD_DUNGEONS', (worldId: number, dungeons: Dungeon[]) => ({
  type: 'ADD_WORLD_DUNGEONS',
  payload: {
    worldId,
    dungeons
  }
}));

export const updateDungeon = createAction('UPDATE_DUNGEON', (dungeonId: number, dungeon: Partial<Dungeon>) => ({
  type: 'UPDATE_DUNGEON',
  payload: {
    dungeonId,
    dungeon
  }
}));
