import { getType } from 'typesafe-actions';

import { DungeonScore, DungeonScoresAction, setDungeonScore } from '../actions/dungeonScores';

export interface DungeonScoreState {
  scores: {
    [dungeonId: number]: DungeonScore;
  };
}

const initialState = {
  scores: {},
};

export function dungeonScores(
  state: DungeonScoreState = initialState,
  action: DungeonScoresAction,
): DungeonScoreState {
  switch (action.type) {
    case getType(setDungeonScore): {
      const { dungeonId, score } = action.payload;
      return {
        ...state,
        scores: {
          ...state.scores,
          [dungeonId]: score,
        },
      };
    }
    default:
      return state;
  }
}
