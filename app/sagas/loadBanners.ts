import axios from 'axios';
import { call, put, select, takeEvery } from 'redux-saga/effects';
import { getType } from 'typesafe-actions';

import { showDanger } from '../actions/messages';
import { setProgress } from '../actions/progress';
import { loadBanners, setRelicDrawProbabilities } from '../actions/relicDraws';
import { getLang } from '../actions/session';
import * as apiUrls from '../api/apiUrls';
import * as gachaSchemas from '../api/schemas/gacha';
import { convertRelicDrawProbabilities } from '../proxy/relicDraws';
import { IState } from '../reducers';
import { logger } from '../utils/logger';
import { sessionConfig } from './util';

export const progressKey = 'banners';

export function* doLoadBanners(action: ReturnType<typeof loadBanners>) {
  const allBannerIds = action.payload.bannerIds;
  const session = yield select((state: IState) => state.session);
  // FIXME: Throw an error if any of session is missing
  const lang = getLang(session);

  yield put(setProgress(progressKey, { current: 0, max: allBannerIds.length }));

  for (let i = 0; i < allBannerIds.length; i++) {
    const bannerId = allBannerIds[i];
    yield put(setProgress(progressKey, { current: i, max: allBannerIds.length }));
    logger.info(`Getting relic probabilities for banner ${bannerId}...`);

    const result = yield call(() =>
      axios
        .get(apiUrls.gachaProbability(lang, bannerId), sessionConfig(session))
        .then(response => {
          // FIXME: Validate data
          const probabilities = convertRelicDrawProbabilities(
            response.data as gachaSchemas.GachaProbability,
          );
          if (!probabilities) {
            return undefined;
          }

          return setRelicDrawProbabilities(bannerId, probabilities);
        })
        .catch(e => {
          logger.error(e);
          return showDanger(e.message);
        }),
    );
    if (result != null) {
      yield put(result);
    }
  }

  yield put(setProgress(progressKey, undefined));
}

export function* watchLoadBanners() {
  yield takeEvery(getType(loadBanners), doLoadBanners);
}
