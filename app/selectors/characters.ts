import { createSelector } from 'reselect';

import * as _ from 'lodash';

import { ExpMap } from '../actions/characters';
import { enlir } from '../data';
import { getRequiredLegendMateriaExp, getRequiredSoulBreakExp } from '../data/enlir';
import { IState } from '../reducers';

const idsToSet = (...ids: Array<number[] | undefined>) =>
  ids ? new Set<number>(_.flatten(_.filter(ids) as number[][])) : undefined;

function makeNeededExpMap(
  owned: Set<number> | undefined,
  expMap: ExpMap | undefined,
  filter: (id: number) => boolean,
  getRequiredExp: (id: number) => number,
) {
  if (!owned || !expMap) {
    return undefined;
  }

  const neededExp: ExpMap = {};
  for (const id of Array.from(owned).filter(filter)) {
    const needed = getRequiredExp(id) - (expMap[id] || 0);
    if (needed) {
      neededExp[id] = needed;
    }
  }
  return neededExp;
}

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

/**
 * Gets *needed* experience (unlike the normal meaning of ExpMap) to master
 * each unmastered legend materia.  This includes legend materia that have not
 * yet been started.
 */
export const getUnmasteredLegendMateria = createSelector<
  IState,
  Set<number> | undefined,
  ExpMap | undefined,
  ExpMap | undefined
>(
  getOwnedLegendMateria,
  ({ characters }: IState) => characters.legendMateriaExp,
  (owned, expMap) =>
    makeNeededExpMap(
      owned,
      expMap,
      id => enlir.legendMateria[id] && enlir.legendMateria[id].relic != null,
      getRequiredLegendMateriaExp,
    ),
);

/**
 * Gets *needed* experience (unlike the normal meaning of ExpMap) to master
 * each unmastered soul break.  This includes soul breaks that have not yet
 * been started.
 */
export const getUnmasteredSoulBreaks = createSelector<
  IState,
  Set<number> | undefined,
  ExpMap | undefined,
  ExpMap | undefined
>(
  getOwnedSoulBreaks,
  ({ characters }: IState) => characters.soulBreakExp,
  (owned, expMap) =>
    makeNeededExpMap(
      owned,
      expMap,
      id =>
        enlir.soulBreaks[id] &&
        enlir.soulBreaks[id].tier !== 'Default' &&
        enlir.soulBreaks[id].tier !== 'Shared',
      getRequiredSoulBreakExp,
    ),
);
