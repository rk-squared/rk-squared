import axios, { AxiosRequestConfig, AxiosResponse } from 'axios';
import { call, CallEffect } from 'redux-saga/effects';

import * as _ from 'lodash';

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
  const config = sessionConfig(session);

  // Log an equivalent HTTPie command to facilitate debugging - but only in
  // development builds, because logging session keys could violate privacy.
  if (process.env.NODE_ENV === 'development') {
    logger.debug(
      'http ' + url + ' ' + _.map(config.headers, (value, key) => `${key}:'${value}'`).join(' '),
    );
  }

  return call(() =>
    axios
      .get(url, config)
      .then(callback)
      .catch(e => {
        logger.error(e);
        return showDanger(e.message);
      }),
  );
}
