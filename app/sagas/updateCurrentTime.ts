import { call, put, select } from 'redux-saga/effects';

import { setCurrentTime } from '../actions/timeState';
import { IState } from '../reducers';
import { logger } from '../utils/logger';

// Based on https://github.com/jaysoo/example-redux-saga/blob/master/src/timer/saga.js

const wait = (milliseconds: number) =>
  new Promise<void>(resolve => {
    setTimeout(() => resolve(), milliseconds);
  });

const interval = 1000 * 60;
const resolution = 1000 * 60 * 15;
// Include a small delay, to help avoid any chance of triggering too early.
const delay = 3000;

const roundToResolution = (time: number) => time - (time % resolution);
const formatTime = (time: number) => new Date(time).toISOString();

export function* updateCurrentTime() {
  let lastTime = yield select((state: IState) => state.timeState.currentTime);

  lastTime = roundToResolution(lastTime);
  logger.debug(`Starting timer at ${formatTime(lastTime)}`);

  while (true) {
    const nextTime = lastTime + resolution;
    yield call(wait, Math.min(interval, nextTime - Date.now() + delay));

    const newTime = Date.now();
    if (newTime < lastTime || newTime - lastTime > resolution) {
      yield put(setCurrentTime(newTime));
      lastTime = roundToResolution(newTime);
      logger.debug(`Update timer to ${formatTime(lastTime)}`);
    }
  }
}
