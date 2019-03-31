import { characters, CharacterState } from '../characters';

import { addSoulBreak } from '../../actions/characters';

describe('characters reducer', () => {
  describe('addSoulBreak', () => {
    it('adds new soul break IDs', () => {
      const initialState: CharacterState = {
        characters: {},
        soulBreaks: [123],
      };

      const state = characters(initialState, addSoulBreak(456));
      expect(state.soulBreaks).toEqual([123, 456]);
      // Verify that object identity is correctly handled.
      expect(state.characters === initialState.characters).toEqual(true);
      expect(state.soulBreaks === initialState.soulBreaks).toEqual(false);
    });

    it('handles duplicate soul break IDs', () => {
      const initialState: CharacterState = {
        characters: {},
        soulBreaks: [123],
      };

      const state = characters(initialState, addSoulBreak([4, 5, 123]));
      expect(state.soulBreaks).toEqual([123, 4, 5]);
    });
  });
});
