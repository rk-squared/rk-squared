import { getType } from 'typesafe-actions';

import { Character, CharacterAction, setCharacter, setCharacters, updateCharacter } from '../actions/characters';

const u = require('updeep');

export interface CharacterState {
  characters: {
    [id: number]: Character;
  };
}

const initialState = {
  characters: {}
};

export function characters(state: CharacterState = initialState, action: CharacterAction): CharacterState {
  switch (action.type) {
    case getType(setCharacter):
      return {
        ...state,
        characters: {
          ...state.characters,
          [action.payload.id]: action.payload,
        }
      };

    case getType(setCharacters):
      return {
        ...state,
        characters: action.payload.characters
      };

    case getType(updateCharacter):
      return u.update({ characters: { [action.payload.id]: action.payload.character } }, state);

    default:
      return state;
  }
}
