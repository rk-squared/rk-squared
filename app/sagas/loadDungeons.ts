import axios, { AxiosRequestConfig } from 'axios';
import { call, put, select, takeEvery } from 'redux-saga/effects';
import { getType } from 'typesafe-actions';

import { addWorldDungeons, loadDungeons } from '../actions/dungeons';
import { Session } from '../actions/session';
import * as apiUrls from '../proxy/apiUrls';
import { convertWorldDungeons } from '../proxy/dungeons';
import * as schemas from '../proxy/schemas';
import { IState } from '../reducers';


// FIXME: What's the best place to log these?  Use the console for now.
// tslint:disable no-console

function sessionConfig(session: Session): AxiosRequestConfig {
  return {
    headers: {
      'user-session': session.userSession,
      'cookie': `http_session_sid=${session.sessionCookie}`,
      'accept': '*/*'
    },
  };
}

export function* doLoadDungeons(action: ReturnType<typeof loadDungeons>) {
  const session = yield select((state: IState) => state.session);
  // FIXME: Throw an error if any of session is missing
  for (const worldId of action.payload.worldIds) {
    console.log(`Getting dungeons for world ${worldId}...`);
    const result = yield call(() =>
      axios.get(apiUrls.dungeons(worldId), sessionConfig(session))
      .then(response => {
        // FIXME: Validate data
        return addWorldDungeons(worldId, convertWorldDungeons(response.data as schemas.Dungeons));
      })
      .catch(e => {
        console.error(e);
        return undefined;
      })
    );
    if (result != null) {
      yield put(result);
    }
  }
}

export function* watchLoadDungeons() {
  yield takeEvery(getType(loadDungeons), doLoadDungeons);
}
