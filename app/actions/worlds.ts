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
}

export const descriptions = {
  [WorldCategory.Realm]: 'Realms',
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
};

export const sortOrder = [
  WorldCategory.Renewal,
  WorldCategory.Event,
  WorldCategory.JumpStart,
  WorldCategory.SpecialEvent,
  WorldCategory.Raid,
  WorldCategory.CrystalTower,
  WorldCategory.Realm,
  WorldCategory.Nightmare,
  WorldCategory.Magicite,
  WorldCategory.Torment,
  WorldCategory.PowerUpMote,
  WorldCategory.Newcomer,
];

export interface World {
  category: WorldCategory;
  subcategory?: string;
  subcategorySortOrder?: number;
  name: string;
  id: number;
  openedAt: number;  // FIXME: Proper type for seconds-since-the-epoch
  closedAt: number;
  seriesId: number;
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
    case WorldCategory.JumpStart:
    case WorldCategory.SpecialEvent:
    case WorldCategory.Raid:
      return WorldSortOrder.ByTime;
    case WorldCategory.Torment:
      return WorldSortOrder.BySeriesId;
    case WorldCategory.CrystalTower:
    case WorldCategory.Realm:
    case WorldCategory.Nightmare:
    case WorldCategory.Magicite:
    case WorldCategory.PowerUpMote:
    case WorldCategory.Newcomer:
      return WorldSortOrder.ById;
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
