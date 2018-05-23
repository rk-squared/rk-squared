/**
 * @file
 * Reducer for tracking proxy status
 */

import { getType } from 'typesafe-actions';

import { ProxyAction, ProxyStatus, updateProxyStatus } from '../actions/proxy';

export { ProxyStatus };

export function proxy(state: ProxyStatus = {}, action: ProxyAction): ProxyStatus {
  switch (action.type) {
    case getType(updateProxyStatus):
      return {
        ...state,
        ...action.payload
      };

    default:
      return state;
  }
}
