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
  ({ characters }: IState) => characters.legendMateria,
  ({ characters }: IState) => (characters.vault || {}).legendMateria,
  idsToSet,
);

export const getOwnedSoulBreaks = createSelector<
  IState,
  number[] | undefined,
  number[] | undefined,
  Set<number> | undefined
>(
  ({ characters }: IState) => characters.soulBreaks,
  ({ characters }: IState) => (characters.vault || {}).soulBreaks,
  idsToSet,
);
