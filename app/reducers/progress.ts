/**
 * @file
 * Tracks progress bars and loading operations
 */

import { getType } from 'typesafe-actions';

import { Progress, ProgressAction, setProgress } from '../actions/progress';

export interface ProgressState {
  [key: string]: Progress;
}

export function progress(state: ProgressState = {}, action: ProgressAction): ProgressState {
  switch (action.type) {
    case getType(setProgress):
      if (action.payload.progress) {
        return {
          ...state,
          [action.payload.key]: action.payload.progress
        };
      } else {
        const result = {
          ...state
        };
        delete result[action.payload.key];
        return result;
      }

    /* istanbul ignore next */
    default:
      return state;
  }
}
