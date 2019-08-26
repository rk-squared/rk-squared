/**
 * @file
 * Reducer for options affecting FFRK
 */

import { getType } from 'typesafe-actions';

import { defaultOptions, Options, OptionsAction, setOption } from '../actions/options';

export { Options };

export function options(state: Options = defaultOptions, action: OptionsAction): Options {
  switch (action.type) {
    case getType(setOption):
      return {
        ...state,
        ...action.payload,
      };

    /* istanbul ignore next */
    default:
      return state;
  }
}
