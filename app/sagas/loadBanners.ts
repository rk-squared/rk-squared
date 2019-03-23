import { AxiosResponse } from 'axios';
import { put, select, takeEvery } from 'redux-saga/effects';
import { getType } from 'typesafe-actions';

import { setProgress } from '../actions/progress';
import {
  loadBanners,
  setExchangeShopSelections,
  setRelicDrawProbabilities,
} from '../actions/relicDraws';
import { getLang } from '../actions/session';
import * as apiUrls from '../api/apiUrls';
import * as gachaSchemas from '../api/schemas/gacha';
import { convertExchangeShopSelections, convertRelicDrawProbabilities } from '../proxy/relicDraws';
import { IState } from '../reducers';
import { RelicDrawState } from '../reducers/relicDraws';
import { logger } from '../utils/logger';
import { callApi } from './util';

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
    const probabilitiesResult = yield callApi(
      apiUrls.gachaProbability(lang, bannerId),
      session,
      (response: AxiosResponse) => {
        // FIXME: Validate data
        const probabilities = convertRelicDrawProbabilities(
          response.data as gachaSchemas.GachaProbability,
        );
        if (!probabilities) {
          return undefined;
        }

        return setRelicDrawProbabilities(bannerId, probabilities);
      },
    );
    if (probabilitiesResult != null) {
      yield put(probabilitiesResult);
    }

    const { banners, selections } = (yield select(
      (state: IState) => state.relicDraws,
    )) as RelicDrawState;
    if (banners[bannerId]) {
      const exchangeShopId = banners[bannerId].exchangeShopId;
      if (exchangeShopId && !selections[exchangeShopId]) {
        logger.info(`Getting selections for banner ${bannerId} (shop ID ${exchangeShopId})...`);

        const selectionsResult = yield callApi(
          apiUrls.exchangeShopPrizeList(lang, exchangeShopId),
          session,
          (response: AxiosResponse) => {
            // FIXME: Validate data
            const shopSelections = convertExchangeShopSelections(
              response.data as gachaSchemas.ExchangeShopPrizeList,
            );
            return setExchangeShopSelections(exchangeShopId, shopSelections);
          },
        );
        if (selectionsResult != null) {
          yield put(selectionsResult);
        }
      }
    }
  }

  yield put(setProgress(progressKey, undefined));
}

export function* watchLoadBanners() {
  yield takeEvery(getType(loadBanners), doLoadBanners);
}
