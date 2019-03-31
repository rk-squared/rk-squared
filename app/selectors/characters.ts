import { createSelector } from 'reselect';

import * as _ from 'lodash';

import { enlir } from '../data';
import { IState } from '../reducers';
import { difference } from '../utils/setUtils';

const idsToSet = (...ids: Array<number[] | undefined>) =>
  ids ? new Set<number>(_.flatten(_.filter(ids) as number[][])) : undefined;

const filteredSetDifferenceToIds = (
  setA: Set<number> | undefined,
  setB: Set<number> | undefined,
  filter: (id: number) => boolean,
) => (setA && setB ? Array.from(difference(setA, setB)).filter(filter) : undefined);

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

export const getMasteredLegendMateria = createSelector<
  IState,
  number[] | undefined,
  Set<number> | undefined
>(
  ({ characters }: IState) => (characters.mastered || {}).legendMateria,
  idsToSet,
);

export const getMasteredSoulBreaks = createSelector<
  IState,
  number[] | undefined,
  Set<number> | undefined
>(
  ({ characters }: IState) => (characters.mastered || {}).soulBreaks,
  idsToSet,
);

export const getUnmasteredLegendMateria = createSelector<
  IState,
  Set<number> | undefined,
  Set<number> | undefined,
  number[] | undefined
>(
  getOwnedLegendMateria,
  getMasteredLegendMateria,
  (owned, mastered) =>
    filteredSetDifferenceToIds(
      owned,
      mastered,
      id => enlir.legendMateria[id] && enlir.legendMateria[id].relic != null,
    ),
);

export const getUnmasteredSoulBreaks = createSelector<
  IState,
  Set<number> | undefined,
  Set<number> | undefined,
  number[] | undefined
>(
  getOwnedSoulBreaks,
  getMasteredSoulBreaks,
  (owned, mastered) =>
    filteredSetDifferenceToIds(
      owned,
      mastered,
      id =>
        enlir.soulBreaks[id] &&
        enlir.soulBreaks[id].tier !== 'Default' &&
        enlir.soulBreaks[id].tier !== 'Shared',
    ),
);
