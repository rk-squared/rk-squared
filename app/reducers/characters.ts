import { produce } from 'immer';
import { getType } from 'typesafe-actions';

import {
  Character,
  CharacterAction,
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
  soulBreaks?: number[];
  legendMateria?: number[];
}

const initialState: CharacterState = {
  characters: {},
  soulBreaks: [],
  legendMateria: [],
};

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
        draft.soulBreaks = action.payload;
        return;

      case getType(setLegendMateria):
        draft.legendMateria = action.payload;
        return;
    }
  });
}
