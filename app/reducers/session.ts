/**
 * @file
 * Reducer for FFRK session
 */

import { getType } from 'typesafe-actions';

import { Session, SessionAction, updateSession } from '../actions/session';

export { Session };

export default function session(state: Session = {}, action: SessionAction): Session {
  switch (action.type) {
    case getType(updateSession):
      return {
        ...state,
        ...action.payload
      };

    default:
      return state;
  }
}
