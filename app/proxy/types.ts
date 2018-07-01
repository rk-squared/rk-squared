import { Store } from 'redux';

import { IState } from '../reducers';

const StartupHandler = Symbol();
export { StartupHandler };

export type HandlerFunction = (data: {}, store: Store<IState>, query?: any, requestBody?: any) => {} | void;
export interface Handler {
  [endpoint: string]: HandlerFunction;
}
