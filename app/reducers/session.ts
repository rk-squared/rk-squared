/**
 * @file
 * Reducer for FFRK session
 */

import { getType } from 'typesafe-actions';

import { Session, updateSession } from '../actions/session';

export { Session };

// FIXME: Types for actions
export default function session(state: Session = {}, action: any): Session {
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
