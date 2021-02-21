import { createSelector } from 'reselect';
import { getOrganizedChains, OrganizedChains } from '../data/chains';
import { IState } from '../reducers';
import { getAllExchangeShopSelections } from './relicDraws';

export const selectOrganizedSoulBreaks = createSelector<IState, Set<number>, OrganizedChains>(
  getAllExchangeShopSelections,
  getOrganizedChains,
);
