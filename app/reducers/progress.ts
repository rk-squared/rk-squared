/**
 * @file
 * Tracks progress bars and loading operations
 */

import { getType } from 'typesafe-actions';

import { Progress, setProgress } from '../actions/progress';

export interface ProgressState {
  [key: string]: Progress;
}

// FIXME: Types for actions
export default function progress(state: ProgressState = {}, action: any): ProgressState {
  switch (action.type) {
    case getType(setProgress):
      return {
        ...state,
        [action.payload.key]: action.payload.progress
      };

    default:
      return state;
  }
}
