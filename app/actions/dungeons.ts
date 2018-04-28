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

export function getAvailablePrizes(dungeons: Dungeon[]): PrizeItem[] {
  const result: {[id: number]: PrizeItem} = {};

  function addPrizes(prizes: PrizeItem[]) {
    if (!prizes) {
      return;
    }
    for (const p of prizes) {
      if (result[p.id]) {
        result[p.id].amount += p.amount;
      } else {
        result[p.id] = {...p};
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
  }

  const ids = Object.keys(result).sort();
  return ids.map(i => result[+i]);
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

export const loadDungeons = createAction('LOAD_DUNGEONS', (worldIds: number[]) => ({
  type: 'LOAD_DUNGEONS',
  payload: {
    worldIds
  }
}));
