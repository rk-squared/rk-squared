import { createSelector } from 'reselect';

import * as _ from 'lodash';

import { IState } from '../reducers';

const idsToSet = (...ids: Array<number[] | undefined>) =>
  ids ? new Set<number>(_.flatten(_.filter(ids) as number[][])) : undefined;

export const getOwnedLegendMateria = createSelector<
  IState,
  number[] | undefined,
  number[] | undefined,
  Set<number> | undefined
>(
  (state: IState) => state.characters.legendMateria,
  (state: IState) => (state.characters.vault ? state.characters.vault.legendMateria : undefined),
  idsToSet,
);

export const getOwnedSoulBreaks = createSelector<
  IState,
  number[] | undefined,
  number[] | undefined,
  Set<number> | undefined
>(
  (state: IState) => state.characters.soulBreaks,
  (state: IState) => (state.characters.vault ? state.characters.vault.soulBreaks : undefined),
  idsToSet,
);
