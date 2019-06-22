import { getType } from 'typesafe-actions';

import { produce } from 'immer';

import {
  DungeonScore,
  DungeonScoresAction,
  isScoreBetterThan,
  setDungeonScore,
  updateDungeonElementScore,
  updateDungeonScore,
} from '../actions/dungeonScores';
import { EnlirElement } from '../data/enlir';

export interface DungeonScoreState {
  scores: {
    [dungeonId: number]: DungeonScore;
  };
  elementScores?: {
    [dungeonId: number]: { [element in EnlirElement]: DungeonScore };
  };
}

export const initialState: DungeonScoreState = {
  scores: {},
};

export function dungeonScores(
  state: DungeonScoreState = initialState,
  action: DungeonScoresAction,
): DungeonScoreState {
  return produce(state, (draft: DungeonScoreState) => {
    switch (action.type) {
      case getType(setDungeonScore): {
        const { dungeonId, score } = action.payload;
        draft.scores[dungeonId] = score;
        return;
      }

      case getType(updateDungeonScore): {
        const { dungeonId, newScore } = action.payload;
        if (state.scores[dungeonId] && isScoreBetterThan(state.scores[dungeonId], newScore)) {
          return;
        }
        draft.scores[dungeonId] = newScore;
        return;
      }

      case getType(updateDungeonElementScore): {
        const { dungeonId, element, newScore } = action.payload;
        if (
          state.elementScores &&
          state.elementScores[dungeonId][element] &&
          isScoreBetterThan(state.elementScores[dungeonId][element], newScore)
        ) {
          return;
        }
        draft.elementScores = draft.elementScores || {};
        draft.elementScores[dungeonId] = draft.elementScores[dungeonId] || {};
        draft.elementScores[dungeonId][element] = newScore;
        return;
      }
    }
  });
}
