import { watchLoadBanners } from './loadBanners';
import { watchLoadDungeons } from './loadDungeons';
import { notifyNetworkChanges } from './notifyNetworkChanges';

export const allSagas = [watchLoadBanners, watchLoadDungeons, notifyNetworkChanges];
