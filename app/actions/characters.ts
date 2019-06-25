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

/**
 * Sets a new soul break experience map, replacing whatever's there.
 */
export const setSoulBreakExp = createAction('SET_SOUL_BREAK_EXP', (exp: ExpMap) => ({
  type: 'SET_SOUL_BREAK_EXP',
  payload: exp,
}));

/**
 * Sets a new legend materia experience map, replacing whatever's there.
 */
export const setLegendMateriaExp = createAction('SET_LEGEND_MATERIA_EXP', (exp: ExpMap) => ({
  type: 'SET_LEGEND_MATERIA_EXP',
  payload: exp,
}));

/**
 * Updates the soul break experience map, adding to or updating existing content.
 */
export const updateSoulBreakExp = createAction('UPDATE_SOUL_BREAK_EXP', (exp: ExpMap) => ({
  type: 'UPDATE_SOUL_BREAK_EXP',
  payload: exp,
}));

/**
 * Updates the legend materia experience map, adding to or updating existing content.
 */
export const updateLegendMateriaExp = createAction('UPDATE_LEGEND_MATERIA_EXP', (exp: ExpMap) => ({
  type: 'UPDATE_LEGEND_MATERIA_EXP',
  payload: exp,
}));

/**
 * Updates/sets total experience required for each soul break.  This is a fixed
 * property of game data, rather than something that varies per profile, so we
 * don't distinguish between vault and inventory or between setting and
 * updating.
 */
export const setSoulBreakExpRequired = createAction(
  'SET_SOUL_BREAK_EXP_REQUIRED',
  (exp: ExpMap) => ({
    type: 'SET_SOUL_BREAK_EXP_REQUIRED',
    payload: exp,
  }),
);

/**
 * See setSoulBreakExpRequired.
 */
export const setLegendMateriaExpRequired = createAction(
  'SET_LEGEND_MATERIA_EXP_REQUIRED',
  (exp: ExpMap) => ({
    type: 'SET_LEGEND_MATERIA_EXP_REQUIRED',
    payload: exp,
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
  | typeof setSoulBreakExp
  | typeof setLegendMateriaExp
  | typeof updateSoulBreakExp
  | typeof updateLegendMateriaExp
  | typeof setSoulBreakExpRequired
  | typeof setLegendMateriaExpRequired
>;
