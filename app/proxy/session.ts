/**
 * @file
 * Support for tracking the user's game session.
 */

import * as cookie from 'cookie';
import * as http from 'http';

import { Store } from 'redux';

import { updateSession } from '../actions/session';
import * as schemas from '../api/schemas';
import { IState } from '../reducers';

/**
 * Session handler.  Unlike other proxy handlers, this needs access to the HTTP
 * headers, so we treat it specially.
 */
export function sessionHandler(
  data: {},
  req: http.IncomingMessage,
  res: http.ServerResponse,
  store: Store<IState>,
) {
  const reqUrl = req.url as string;
  const resHeaders = res.getHeaders();

  const userId = resHeaders['x-gunya-user-id']
    ? (resHeaders['x-gunya-user-id'] as any).toString()
    : undefined;

  const cookies = typeof req.headers.cookie === 'string' ? cookie.parse(req.headers.cookie) : {};
  const sessionCookie = cookies['http_session_sid'];

  let userSession: string | undefined;
  if (reqUrl.endsWith('/update_user_session')) {
    userSession = (data as schemas.UpdateUserSession).user_session_key;
  } else if (
    req.headers['user-session'] &&
    typeof req.headers['user-session'] === 'string' &&
    req.headers['user-session'] !== 'UNDEFINED_IN_API_JS'
  ) {
    userSession = req.headers['user-session'] as string;
  }

  store.dispatch(updateSession({ userId, userSession, sessionCookie }));
}
