import axios, { AxiosRequestConfig } from 'axios';
import { call, put, select, takeEvery } from 'redux-saga/effects';
import { getType } from 'typesafe-actions';

import { addWorldDungeons, loadDungeons } from '../actions/dungeons';
import { setProgress } from '../actions/progress';
import { Session } from '../actions/session';
import * as apiUrls from '../api/apiUrls';
import * as schemas from '../api/schemas';
import { convertWorldDungeons } from '../proxy/dungeons';
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

  yield put(setProgress('dungeons', {current: 0, max: action.payload.worldIds.length}));

  for (let i = 0; i < action.payload.worldIds.length; i++) {
    const worldId = action.payload.worldIds[i];
    yield put(setProgress('dungeons', {current: i, max: action.payload.worldIds.length}));
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

  yield put(setProgress('dungeons', undefined));
}

export function* watchLoadDungeons() {
  yield takeEvery(getType(loadDungeons), doLoadDungeons);
}
