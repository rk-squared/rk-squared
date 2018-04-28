import { createAction } from 'typesafe-actions';

import { ItemType } from '../data/items';

export const showItemType = createAction('SHOW_ITEM_TYPE', (type: ItemType, show: boolean) => ({
  type: 'SHOW_ITEM_TYPE',
  payload: {
    type,
    show
  }
}));

export const showItemTypes = createAction('SHOW_ITEM_TYPES', (updates: {[t in ItemType]?: boolean}) => ({
  type: 'SHOW_ITEM_TYPES',
  payload: {
    updates
  }
}));

export type PrefsAction = ReturnType<typeof showItemType | typeof showItemTypes>;
