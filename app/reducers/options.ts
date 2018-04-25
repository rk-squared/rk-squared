/**
 * @file
 * Reducer for options affecting FFRK
 */

import { getType } from 'typesafe-actions';

import { defaultOptions, Options, setOption } from '../actions/options';

export { Options };

// FIXME: Types for actions
export default function options(state: Options = defaultOptions, action: any): Options {
  switch (action.type) {
    case getType(setOption):
      return {
        ...state,
        ...action.payload
      };

    default:
      return state;
  }
}
