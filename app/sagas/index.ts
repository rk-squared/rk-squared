import { watchLoadDungeons } from './loadDungeons';
import { notifyNetworkChanges } from './notifyNetworkChanges';

export const allSagas = [watchLoadDungeons, notifyNetworkChanges];
