import { createAction } from 'typesafe-actions';

import * as _ from 'lodash';

import { LocalIconType } from '../data/localData';
import { FAR_FUTURE, TimeT } from '../utils/timeUtils';

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
  Dreams,
  Dreambreaker,
  Dragonking,
  Labyrinth,
}

export const descriptions: { [c in WorldCategory]: string } = {
  [WorldCategory.Realm]: 'Realm Dungeons',
  [WorldCategory.Nightmare]: 'Nightmare',
  [WorldCategory.Magicite]: 'Magicite',
  [WorldCategory.Dreams]: 'Dreams',
  [WorldCategory.Torment]: 'Torments',
  [WorldCategory.Dreambreaker]: 'Dreambreaker',
  [WorldCategory.Event]: 'Events',
  [WorldCategory.SpecialEvent]: 'Special Events',
  [WorldCategory.JumpStart]: 'Jump Start',
  [WorldCategory.Raid]: 'Raids',
  [WorldCategory.CrystalTower]: 'Crystal Tower',
  [WorldCategory.PowerUpMote]: 'Power Up & Mote Dungeons',
  [WorldCategory.Newcomer]: 'Newcomer Dungeons',
  [WorldCategory.Renewal]: 'Renewal Dungeons',
  [WorldCategory.Record]: 'Record Dungeons',
  [WorldCategory.Dragonking]: 'Dragonking',
  [WorldCategory.Labyrinth]: 'Labyrinth',
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
  WorldCategory.Labyrinth,
  WorldCategory.Nightmare,
  WorldCategory.Magicite,
  WorldCategory.Dreams,
  WorldCategory.Torment,
  WorldCategory.Dreambreaker,
  WorldCategory.Dragonking,
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
  openedAt: TimeT;
  closedAt: TimeT;
  seriesId: number;
  isUnlocked: boolean;

  /**
   * Optional URL (see data/urls) to an image icon for this world
   */
  iconUrl?: string;

  /**
   * Optional key of a localIcon (see data/localData)
   */
  localIcon?: LocalIconType;
}

enum WorldSortOrder {
  ById,
  ByReverseId,
  ByTime,
  BySeriesId,
}

export interface RecordWorldChapter {
  firstWorldId: number;
  name: string;
}

function getSortOrder(category: WorldCategory): WorldSortOrder {
  switch (category) {
    case WorldCategory.Renewal:
      return WorldSortOrder.ByReverseId;
    case WorldCategory.Event:
    case WorldCategory.SpecialEvent:
    case WorldCategory.Raid:
      return WorldSortOrder.ByTime;
    case WorldCategory.Dreams:
    case WorldCategory.Torment:
    case WorldCategory.Dreambreaker:
    case WorldCategory.Dragonking:
      // Old torments were sorted by series.  Neo Torments were listed by time
      // when first released, but now that they've all been out for a bit, the
      // the game lists them by series.  Similarly, FFRK lists Dreambreaker
      // dungeons and permanent Dreams dungeons by series, so we'll follow suit.
      return WorldSortOrder.BySeriesId;
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
    case WorldCategory.Labyrinth:
      // All labyrinth seasons may use one world, so this may be irrelevant.
      return WorldSortOrder.ById;
  }
}

/**
 * Far-future timestamps indicate a world that never closes - but different
 * worlds may have different far-future timestamps.  (E.g., the FF15 torment's
 * is a bit before the FF13 torment's.)  We want these to sort the same, so
 * special-case far-future timestamps to accommodate.
 */
const getClosedAt = (world: any) => (world.closedAt > FAR_FUTURE ? Infinity : world.closedAt);

export function getSorter(category: WorldCategory): (worlds: World[]) => World[] {
  switch (getSortOrder(category)) {
    case WorldSortOrder.BySeriesId:
      return (worlds) => _.sortBy(worlds, 'seriesId');
    case WorldSortOrder.ById:
      return (worlds) => _.sortBy(worlds, 'id');
    case WorldSortOrder.ByReverseId:
      return (worlds) => _.sortBy(worlds, (i) => -i.id);
    case WorldSortOrder.ByTime:
      return (worlds) =>
        _.sortBy(worlds, [(i: any) => -getClosedAt(i), (i: any) => -i.openedAt, 'id']);
  }
}

export const updateWorlds = createAction('UPDATE_WORLDS', (worlds: { [id: number]: World }) => ({
  type: 'UPDATE_WORLDS',
  payload: {
    worlds,
  },
}));

export const unlockWorld = createAction('UNLOCK_WORLD', (worldId: number) => ({
  type: 'UNLOCK_WORLD',
  payload: worldId,
}));

export const setWorldIcon = createAction(
  'SET_WORLD_ICON',
  (worldId: number, icon: { localIcon?: LocalIconType; iconUrl?: string }) => ({
    type: 'SET_WORLD_ICON',
    payload: {
      worldId,
      icon,
    },
  }),
);

export const setRecordWorldChapters = createAction(
  'SET_RECORD_WORLD_CHAPTERS',
  (chapters: RecordWorldChapter[]) => ({
    type: 'SET_RECORD_WORLD_CHAPTERS',
    payload: chapters,
  }),
);

export type WorldAction = ReturnType<
  typeof updateWorlds | typeof unlockWorld | typeof setWorldIcon | typeof setRecordWorldChapters
>;
