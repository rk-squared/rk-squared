import { Store } from 'redux';
import { UrlWithStringQuery } from 'url';

import { LangType } from '../api/apiUrls';
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

export function getRequestLang(request: HandlerRequest): LangType {
  return request.url && request.url.hostname && request.url.hostname.endsWith('.jp')
    ? LangType.Jp
    : LangType.Gl;
}
