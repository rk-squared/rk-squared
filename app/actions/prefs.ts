import { createAction } from 'typesafe-actions';

import * as _ from 'lodash';

import { EnlirSoulBreakOrLegendMateria } from '../data/enlir';
import { ItemType } from '../data/items';

export enum ShowSoulBreaksType {
  All = 0,
  Gl = 1,
  Owned = 2,

  Default = All,
}

export enum ShowRelicSelectionType {
  All = 0,
  HideCurrentAnima = 1,
  HideAllAnima = 2,

  Default = All,
}

export interface Prefs {
  showItemType: { [t in ItemType]: boolean };

  showSoulBreaks?: ShowSoulBreaksType;

  // Relic selection preferences
  showRelicSelections?: ShowRelicSelectionType;
  hideRelicSelectionDupes?: boolean;
  showNewRelicSelectionsOnly?: boolean;

  lastFilename?: {
    [key: string]: string;
  };
}

export function filterSoulBreaks(showSoulBreaks?: ShowSoulBreaksType, owned?: Set<number>) {
  if (showSoulBreaks == null) {
    showSoulBreaks = ShowSoulBreaksType.Default;
  }
  switch (showSoulBreaks) {
    case ShowSoulBreaksType.All:
      return _.constant(true);
    case ShowSoulBreaksType.Gl:
      return (item: EnlirSoulBreakOrLegendMateria) => item.gl;
    case ShowSoulBreaksType.Owned:
      if (owned == null) {
        return _.constant(true);
      } else {
        return (item: EnlirSoulBreakOrLegendMateria) => owned.has(item.id);
      }
  }
}

export function getLastFilename(prefs: Prefs, key: string, defaultFilename: string): string {
  if (!prefs.lastFilename || !prefs.lastFilename[key]) {
    return defaultFilename;
  } else {
    return prefs.lastFilename[key];
  }
}

export const showItemType = createAction('SHOW_ITEM_TYPE', (type: ItemType, show: boolean) => ({
  type: 'SHOW_ITEM_TYPE',
  payload: {
    type,
    show,
  },
}));

export const showItemTypes = createAction(
  'SHOW_ITEM_TYPES',
  (updates: { [t in ItemType]?: boolean }) => ({
    type: 'SHOW_ITEM_TYPES',
    payload: {
      updates,
    },
  }),
);

export const updatePrefs = createAction('UPDATE_PREFS', (updates: Partial<Prefs>) => ({
  type: 'UPDATE_PREFS',
  payload: updates,
}));

export const setLastFilename = createAction(
  'SET_LAST_FILENAME',
  (key: string, lastFilename: string) => ({
    type: 'SET_LAST_FILENAME',
    payload: {
      key,
      lastFilename,
    },
  }),
);

export type PrefsAction = ReturnType<
  typeof showItemType | typeof showItemTypes | typeof updatePrefs | typeof setLastFilename
>;
