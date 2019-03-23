import axios, { AxiosRequestConfig, AxiosResponse } from 'axios';
import { call, CallEffect } from 'redux-saga/effects';

import { showDanger } from '../actions/messages';
import { Session } from '../actions/session';
import { logger } from '../utils/logger';

export function sessionConfig(session: Session): AxiosRequestConfig {
  return {
    headers: {
      'user-session': session.userSession,
      cookie: `http_session_sid=${session.sessionCookie}`,
      accept: '*/*',
    },
  };
}

export function callApi(
  url: string,
  session: Session,
  callback: (response: AxiosResponse) => any,
): CallEffect {
  return call(() =>
    axios
      .get(url, sessionConfig(session))
      .then(callback)
      .catch(e => {
        logger.error(e);
        return showDanger(e.message);
      }),
  );
}
