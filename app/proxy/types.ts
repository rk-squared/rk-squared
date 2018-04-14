import { Store } from 'redux';

import { IState } from '../reducers';

export type HandlerFunction = (data: {}, store: Store<IState>) => {} | void;
export interface Handler {
  [endpoint: string]: HandlerFunction;
}
