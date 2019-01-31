import { Store } from 'redux';
import { UrlWithStringQuery } from 'url';

import { IState } from '../reducers';

const StartupHandler = Symbol();
export { StartupHandler };

export interface HandlerRequest {
  query?: any;
  body?: any;
  url?: UrlWithStringQuery;
}
export type HandlerFunction = (
  data: {},
  store: Store<IState>,
  request: HandlerRequest,
) => {} | void;
export interface Handler {
  [endpoint: string]: HandlerFunction;
}
