import { watchLoadBanners } from './loadBanners';
import { watchLoadDungeons } from './loadDungeons';
import { notifyNetworkChanges } from './notifyNetworkChanges';
import { updateCurrentTime } from './updateCurrentTime';

export const allSagas = [
  watchLoadBanners,
  watchLoadDungeons,
  notifyNetworkChanges,
  updateCurrentTime,
];
