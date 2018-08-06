/**
 * @file
 * Reducer for FFRK session
 */

import { getType } from 'typesafe-actions';

import { Session, SessionAction, updateSession } from '../actions/session';

export { Session };

export function hasSessionState(state: Session): boolean {
  return !!(state.userSession && state.sessionCookie);
}

export function session(state: Session = {}, action: SessionAction): Session {
  switch (action.type) {
    case getType(updateSession):
      return {
        ...state,
        ...action.payload
      };

    /* istanbul ignore next */
    default:
      return state;
  }
}
