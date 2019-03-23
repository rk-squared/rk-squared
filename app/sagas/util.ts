import { AxiosRequestConfig } from 'axios';

import { Session } from '../actions/session';

export function sessionConfig(session: Session): AxiosRequestConfig {
  return {
    headers: {
      'user-session': session.userSession,
      cookie: `http_session_sid=${session.sessionCookie}`,
      accept: '*/*',
    },
  };
}
