import { getType } from 'typesafe-actions';

import { defaultOptions, Options, setOption } from '../actions/options';

export { Options };

// FIXME: Types for actions
export default function battle(state: Options = defaultOptions, action: any): Options {
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