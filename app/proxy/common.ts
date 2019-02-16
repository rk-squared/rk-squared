/**
 * @file
 * Common types and helper functions shared by proxy handlers
 */

import { Store } from 'redux';
import { Url, URL, UrlWithStringQuery } from 'url';

import { LangType } from '../api/apiUrls';
import { IState } from '../reducers';

// We'd like to make this a Symbol(), but TypeScript doesn't support using
// symbols as indexes: https://github.com/Microsoft/TypeScript/issues/24587
const StartupHandler = '__STARTUP';

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

export function isUrlJp(url: URL | Url): boolean {
  return !!url.hostname && url.hostname.endsWith('.jp');
}

export function getRequestLang(request: HandlerRequest): LangType {
  return request.url && isUrlJp(request.url) ? LangType.Jp : LangType.Gl;
}
