import { createAction } from 'typesafe-actions';

export interface Character {
  name: string;
  id: number;
  uniqueId: number;
  level: number;
  levelCap: number;
}

export enum InventoryType {
  Inventory,
  Vault,
}

export const setCharacters = createAction(
  'SET_CHARACTERS',
  (characters: { [id: number]: Character }) => ({
    type: 'SET_CHARACTERS',
    payload: {
      characters,
    },
  }),
);

export const setCharacter = createAction('SET_CHARACTER', (character: Character) => ({
  type: 'SET_CHARACTER',
  payload: character,
}));

export const updateCharacter = createAction(
  'UPDATE_CHARACTER',
  (id: number, character: Partial<Character>) => ({
    type: 'UPDATE_CHARACTER',
    payload: {
      id,
      character,
    },
  }),
);

export const setSoulBreaks = createAction(
  'SET_SOUL_BREAKS',
  (soulBreakIds: number[], inventoryType: InventoryType = InventoryType.Inventory) => ({
    type: 'SET_SOUL_BREAKS',
    payload: {
      soulBreakIds,
      inventoryType,
    },
  }),
);

export const setLegendMateria = createAction(
  'SET_LEGEND_MATERIA',
  (legendMateriaIds: number[], inventoryType: InventoryType = InventoryType.Inventory) => ({
    type: 'SET_LEGEND_MATERIA',
    payload: {
      legendMateriaIds,
      inventoryType,
    },
  }),
);

export const addSoulBreak = createAction(
  'ADD_SOUL_BREAK',
  (idOrIds: number | number[], inventoryType: InventoryType = InventoryType.Inventory) => ({
    type: 'ADD_SOUL_BREAK',
    payload: {
      idOrIds,
      inventoryType,
    },
  }),
);

export const addLegendMateria = createAction(
  'ADD_LEGEND_MATERIA',
  (idOrIds: number | number[], inventoryType: InventoryType = InventoryType.Inventory) => ({
    type: 'ADD_LEGEND_MATERIA',
    payload: {
      idOrIds,
      inventoryType,
    },
  }),
);

export type CharacterAction = ReturnType<
  | typeof setCharacter
  | typeof setCharacters
  | typeof updateCharacter
  | typeof setSoulBreaks
  | typeof setLegendMateria
  | typeof addSoulBreak
  | typeof addLegendMateria
>;
