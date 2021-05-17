import { produce } from 'immer';
import { getType } from 'typesafe-actions';

import {
  addLegendMateria,
  addSoulBreak,
  Character,
  CharacterAction,
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

  // No longer used / needed:
  // vault?: { soulBreaks?: number[]; legendMateria?: number[] }
  // soulBreakExp?: ExpMap;
  // legendMateriaExp?: ExpMap;
  // soulBreakExpRequired?: ExpMap;
  // legendMateriaExpRequired?: ExpMap;
}

const initialState: CharacterState = {
  characters: {},
  soulBreaks: [],
  legendMateria: [],
};

function addIds(idList: number[] | undefined, idOrIds: number | number[]) {
  if (!idList) {
    return;
  }
  const existing = new Set(idList);
  idList.push(...arrayify(idOrIds).filter((i) => !existing.has(i)));
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
        draft.soulBreaks = action.payload.soulBreakIds;
        return;

      case getType(setLegendMateria):
        draft.legendMateria = action.payload.legendMateriaIds;
        return;

      case getType(addSoulBreak): {
        addIds(draft.soulBreaks, action.payload.idOrIds);
        return;
      }

      case getType(addLegendMateria): {
        addIds(draft.legendMateria, action.payload.idOrIds);
        return;
      }
    }
  });
}
