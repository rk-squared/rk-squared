import { createAction } from 'typesafe-actions';

import * as _ from 'lodash';

export enum WorldCategory {
  Realm,
  Nightmare,
  Magicite,
  Torment,
  Event,
  SpecialEvent,
  JumpStart,
  Raid,
  CrystalTower,
  PowerUpMote,
  Newcomer,
  Renewal,
  Record,
}

export const descriptions = {
  [WorldCategory.Realm]: 'Realm Dungeons',
  [WorldCategory.Nightmare]: 'Nightmare',
  [WorldCategory.Magicite]: 'Magicite',
  [WorldCategory.Torment]: 'Torments',
  [WorldCategory.Event]: 'Events',
  [WorldCategory.SpecialEvent]: 'Special Events',
  [WorldCategory.JumpStart]: 'Jump Start',
  [WorldCategory.Raid]: 'Raids',
  [WorldCategory.CrystalTower]: 'Crystal Tower',
  [WorldCategory.PowerUpMote]: 'Power Up & Mote Dungeons',
  [WorldCategory.Newcomer]: 'Newcomers\' Dungeons',
  [WorldCategory.Renewal]: 'Renewal Dungeons',
  [WorldCategory.Record]: 'Record Dungeons',
};

export const sortOrder = [
  WorldCategory.Renewal,
  WorldCategory.Event,
  WorldCategory.JumpStart,
  WorldCategory.SpecialEvent,
  WorldCategory.Raid,
  WorldCategory.CrystalTower,
  WorldCategory.Realm,
  WorldCategory.Record,
  WorldCategory.Nightmare,
  WorldCategory.Magicite,
  WorldCategory.Torment,
  WorldCategory.PowerUpMote,
  WorldCategory.Newcomer,
];

// FIXME: Add eventId - and track "enter" requests to mark dungeons as unlocked - and unit test all of it
export interface World {
  category: WorldCategory;
  subcategory?: string;
  subcategorySortOrder?: number;
  name: string;
  id: number;
  openedAt: number;  // FIXME: Proper type for seconds-since-the-epoch
  closedAt: number;
  seriesId: number;
  isUnlocked: boolean;
}

enum WorldSortOrder {
  ById,
  ByReverseId,
  ByTime,
  BySeriesId,
}

function getSortOrder(category: WorldCategory) {
  switch (category) {
    case WorldCategory.Renewal:
      return WorldSortOrder.ByReverseId;
    case WorldCategory.Event:
    case WorldCategory.SpecialEvent:
    case WorldCategory.Raid:
      return WorldSortOrder.ByTime;
    case WorldCategory.Torment:
      // Old torments were sorted by series, but Neo Torments are listed by
      // time.
      return WorldSortOrder.ByTime;
    case WorldCategory.CrystalTower:
    case WorldCategory.Realm:
    case WorldCategory.Record:
    case WorldCategory.Nightmare:
    case WorldCategory.Magicite:
    case WorldCategory.PowerUpMote:
    case WorldCategory.Newcomer:
      return WorldSortOrder.ById;
    case WorldCategory.JumpStart:
      // Jump Starts were ByTime, but, once they were all open, by series
      // makes more sense.
      return WorldSortOrder.BySeriesId;
  }
}

export function getSorter(category: WorldCategory): (worlds: World[]) => World[] {
  switch (getSortOrder(category)) {
    case WorldSortOrder.BySeriesId:
      return worlds => _.sortBy(worlds, 'seriesId');
    case WorldSortOrder.ById:
      return worlds => _.sortBy(worlds, 'id');
    case WorldSortOrder.ByReverseId:
      return worlds => _.sortBy(worlds, i => -i.id);
    case WorldSortOrder.ByTime:
      return worlds => _.sortBy(worlds, [(i: any) => -i.closedAt, (i: any) => -i.openedAt, 'id']);
  }
}

export const updateWorlds = createAction('UPDATE_WORLDS', (worlds: {[id: number]: World}) => ({
  type: 'UPDATE_WORLDS',
  payload: {
    worlds
  }
}));

export const unlockWorld = createAction('UNLOCK_WORLD', (worldId: number) => ({
  type: 'UNLOCK_WORLD',
  payload: worldId
}));

export type WorldAction = ReturnType<typeof updateWorlds | typeof unlockWorld>;
