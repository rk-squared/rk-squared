import { createAction } from 'typesafe-actions';

export interface Character {
  name: string;
  id: number;
  uniqueId: number;
  level: number;
  levelCap: number;
}

export const setCharacters = createAction('SET_CHARACTERS',
  (characters: { [id: number]: Character }) => ({
    type: 'SET_CHARACTERS',
    payload: {
      characters
    }
  })
);

export const setCharacter = createAction('SET_CHARACTER',
  (character: Character) => ({
    type: 'SET_CHARACTER',
    payload: character
  })
);

export type CharacterAction = ReturnType<typeof setCharacter | typeof setCharacters>;
