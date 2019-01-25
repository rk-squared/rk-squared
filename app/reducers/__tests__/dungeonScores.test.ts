import { dungeonScores, initialState } from '../dungeonScores';

import { DungeonScoreType, setDungeonScore, updateDungeonScore } from '../../actions/dungeonScores';

describe('dungeonScores reducer', () => {
  it('sets and updates scores', () => {
    const id = 5;
    const initialScore = {
      type: DungeonScoreType.ClearTime,
      won: true,
      time: 34567,
    };
    const worseScore = {
      ...initialScore,
      time: 45678,
    };
    const betterScore = {
      ...initialScore,
      time: 23456,
    };

    let state = initialState;
    expect(state.scores[id]).toBeUndefined();

    state = dungeonScores(state, setDungeonScore(id, initialScore));
    expect(state.scores[id]).toEqual(initialScore);

    state = dungeonScores(state, updateDungeonScore(id, worseScore));
    expect(state.scores[id]).toEqual(initialScore);

    state = dungeonScores(state, updateDungeonScore(id, betterScore));
    expect(state.scores[id]).toEqual(betterScore);
  });
});
