import { createAction } from 'typesafe-actions';

export interface Character {
  name: string;
  id: number;
  uniqueId: number;
  level: number;
  levelCap: number;
}

export enum InventoryType {
  INVENTORY,
  VAULT,
}

export interface ExpMap {
  [id: number]: number;
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
  (soulBreakIds: number[], inventoryType = InventoryType.INVENTORY) => ({
    type: 'SET_SOUL_BREAKS',
    payload: {
      soulBreakIds,
      inventoryType,
    },
  }),
);

export const setLegendMateria = createAction(
  'SET_LEGEND_MATERIA',
  (legendMateriaIds: number[], inventoryType = InventoryType.INVENTORY) => ({
    type: 'SET_LEGEND_MATERIA',
    payload: {
      legendMateriaIds,
      inventoryType,
    },
  }),
);

export const setSoulBreakExp = createAction('SET_SOUL_BREAK_EXP', (exp: ExpMap) => ({
  type: 'SET_SOUL_BREAK_EXP',
  payload: exp,
}));

export const setLegendMateriaExp = createAction('SET_LEGEND_MATERIA_EXP', (exp: ExpMap) => ({
  type: 'SET_LEGEND_MATERIA_EXP',
  payload: exp,
}));

export type CharacterAction = ReturnType<
  | typeof setCharacter
  | typeof setCharacters
  | typeof updateCharacter
  | typeof setSoulBreaks
  | typeof setLegendMateria
  | typeof setSoulBreakExp
  | typeof setLegendMateriaExp
>;
