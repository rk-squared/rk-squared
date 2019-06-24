import { getType } from 'typesafe-actions';

import { setCurrentTime, TimeStateAction } from '../actions/timeState';

export interface TimeState {
  /**
   * System time, as a JavaScript timestamp (milliseconds since the epoch).
   * This is only sporadically updated (currently once an hour) to reduce
   * excessive React / Redux / reselect updates.
   */
  currentTime: number;
}

const initialState: TimeState = {
  currentTime: Date.now(),
};

export function timeState(state: TimeState = initialState, action: TimeStateAction): TimeState {
  switch (action.type) {
    case getType(setCurrentTime):
      return {
        ...state,
        currentTime: action.payload,
      };

    /* istanbul ignore next */
    default:
      return state;
  }
}
