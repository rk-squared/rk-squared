import { createAction } from 'typesafe-actions';

export interface DropItem {
  // FFRK API values
  amount?: number;
  type?: number;     // omitted for record materia, which aren't real items
  rarity?: number;   // omitted for record materia, which aren't real items
  itemId?: number;

  // Added by RK-Squared
  name: string;
  imageUrl?: string;
}

export const setDropItems = createAction('SET_DROP_ITEMS', (dropItems: DropItem[]) => ({
  type: 'SET_DROP_ITEMS',
  payload: {
    dropItems
  }
}));

export const clearDropItems = createAction('CLEAR_DROP_ITEMS');
