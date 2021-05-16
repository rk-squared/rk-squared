import { produce } from 'immer';
import { getType } from 'typesafe-actions';

import {
  addLegendMateria,
  addSoulBreak,
  Character,
  CharacterAction,
  InventoryType,
  setCharacter,
  setCharacters,
  setLegendMateria,
  setSoulBreaks,
  updateCharacter,
} from '../actions/characters';
import { arrayify } from '../utils/typeUtils';

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

  // No longer used / needed:
  // soulBreakExp?: ExpMap;
  // legendMateriaExp?: ExpMap;
  // soulBreakExpRequired?: ExpMap;
  // legendMateriaExpRequired?: ExpMap;
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
    case InventoryType.Inventory:
      return draft;
    case InventoryType.Vault:
      draft.vault = draft.vault || {};
      return draft.vault;
  }
}

function addIds(idList: number[] | undefined, idOrIds: number | number[]) {
  if (!idList) {
    return;
  }
  for (const i of arrayify(idOrIds)) {
    if (idList.indexOf(i) === -1) {
      idList.push(i);
    }
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

      // Known soul breaks and legend materia
      case getType(setSoulBreaks):
        getDestination(draft, action.payload.inventoryType).soulBreaks =
          action.payload.soulBreakIds;
        return;

      case getType(setLegendMateria):
        getDestination(draft, action.payload.inventoryType).legendMateria =
          action.payload.legendMateriaIds;
        return;

      case getType(addSoulBreak): {
        const dest = getDestination(draft, action.payload.inventoryType);
        addIds(dest.soulBreaks, action.payload.idOrIds);
        return;
      }

      case getType(addLegendMateria): {
        const dest = getDestination(draft, action.payload.inventoryType);
        addIds(dest.legendMateria, action.payload.idOrIds);
        return;
      }
    }
  });
}
