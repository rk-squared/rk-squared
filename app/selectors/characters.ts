import { createSelector } from 'reselect';

import { IState } from '../reducers';

const idsToSet = (ids: number[] | undefined) => (ids ? new Set<number>(ids) : undefined);

export const getOwnedLegendMateria = createSelector<
  IState,
  number[] | undefined,
  Set<number> | undefined
>(
  (state: IState) => state.characters.legendMateria,
  idsToSet,
);

export const getOwnedSoulBreaks = createSelector<
  IState,
  number[] | undefined,
  Set<number> | undefined
>(
  (state: IState) => state.characters.soulBreaks,
  idsToSet,
);
