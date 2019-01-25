import { getType } from 'typesafe-actions';

import {
  DungeonScore,
  DungeonScoresAction,
  isScoreBetterThan,
  setDungeonScore,
  updateDungeonScore,
} from '../actions/dungeonScores';

export interface DungeonScoreState {
  scores: {
    [dungeonId: number]: DungeonScore;
  };
}

export const initialState: DungeonScoreState = {
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

    case getType(updateDungeonScore): {
      const { dungeonId, newScore } = action.payload;
      if (state.scores[dungeonId] && isScoreBetterThan(state.scores[dungeonId], newScore)) {
        return state;
      }
      return {
        ...state,
        scores: {
          ...state.scores,
          [dungeonId]: newScore,
        },
      };
    }

    /* istanbul ignore next */
    default:
      return state;
  }
}
