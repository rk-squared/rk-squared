import { produce } from 'immer';
import { getType } from 'typesafe-actions';

import {
  Character,
  CharacterAction,
  InventoryType,
  setCharacter,
  setCharacters,
  setLegendMateria,
  setSoulBreaks,
  updateCharacter,
} from '../actions/characters';

export interface CharacterState {
  characters: {
    [id: number]: Character;
  };

  /**
   * Soul break IDs as returned by the party screen.  This includes all soul
   * breaks that characters have at least started to learn, as well as all
   * soul breaks accessible via a relic in inventory.
   */
  soulBreaks?: number[];

  /**
   * Legend materia IDs as returned by the party screen.  See soulBreaks.
   */
  legendMateria?: number[];

  vault?: {
    /**
     * Soul break IDs as returned by the vault screen.
     */
    soulBreaks?: number[];
    /**
     * Legend materia IDs as returned by the vault screen.
     */
    legendMateria?: number[];
  };

  mastered?: {
    /**
     * Mastered soul break IDs
     */
    soulBreaks?: number[];
    legendMateria?: number[];
  };
}

const initialState: CharacterState = {
  characters: {},
  soulBreaks: [],
  legendMateria: [],
  vault: {
    soulBreaks: [],
    legendMateria: [],
  },
};

function getDestination(draft: CharacterState, inventoryType: InventoryType) {
  switch (inventoryType) {
    case InventoryType.INVENTORY:
      return draft;
    case InventoryType.VAULT:
      draft.vault = draft.vault || {};
      return draft.vault;
    case InventoryType.MASTERED:
      draft.mastered = draft.mastered || {};
      return draft.mastered;
  }
}

export function characters(
  state: CharacterState = initialState,
  action: CharacterAction,
): CharacterState {
  return produce(state, (draft: CharacterState) => {
    switch (action.type) {
      case getType(setCharacter):
        draft.characters[action.payload.id] = action.payload;
        return;

      case getType(setCharacters):
        draft.characters = action.payload.characters;
        return;

      case getType(updateCharacter):
        Object.assign(draft.characters[action.payload.id], action.payload.character);
        return;

      case getType(setSoulBreaks):
        getDestination(draft, action.payload.inventoryType).soulBreaks =
          action.payload.soulBreakIds;
        return;

      case getType(setLegendMateria):
        getDestination(draft, action.payload.inventoryType).legendMateria =
          action.payload.legendMateriaIds;
        return;
    }
  });
}
