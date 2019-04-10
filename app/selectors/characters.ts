import { createSelector } from 'reselect';

import * as _ from 'lodash';

import { ExpMap } from '../actions/characters';
import { enlir } from '../data';
import { getEstimatedRequiredSoulBreakExp, getRequiredLegendMateriaExp } from '../data/enlir';
import { IState } from '../reducers';

const idsToSet = (...ids: Array<number[] | undefined>) =>
  ids ? new Set<number>(_.flatten(_.filter(ids) as number[][])) : undefined;

function makeNeededExpMap(
  owned: Set<number> | undefined,
  expMap: ExpMap | undefined,
  requiredExpMap: ExpMap | undefined,
  filter: (id: number) => boolean,
  getRequiredExp: (id: number) => number,
) {
  if (!owned || !expMap) {
    return undefined;
  }

  const neededExp: ExpMap = {};
  for (const id of Array.from(owned).filter(filter)) {
    const required = requiredExpMap && requiredExpMap[id] ? requiredExpMap[id] : getRequiredExp(id);
    const needed = required - (expMap[id] || 0);
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
 * Gets experience still needed to master each unmastered legend materia.  This
 * includes legend materia that have not yet been started.
 */
export const getUnmasteredLegendMateria = createSelector<
  IState,
  Set<number> | undefined,
  ExpMap | undefined,
  ExpMap | undefined,
  ExpMap | undefined
>(
  getOwnedLegendMateria,
  ({ characters }: IState) => characters.legendMateriaExp,
  ({ characters }: IState) => characters.legendMateriaExpRequired,
  (owned, expMap, expMapRequired) =>
    makeNeededExpMap(
      owned,
      expMap,
      expMapRequired,
      id => enlir.legendMateria[id] && enlir.legendMateria[id].relic != null,
      getRequiredLegendMateriaExp,
    ),
);

/**
 * Gets experience still needed to master each unmastered soul break.  This
 * includes soul breaks that have not yet been started.
 */
export const getUnmasteredSoulBreaks = createSelector<
  IState,
  Set<number> | undefined,
  ExpMap | undefined,
  ExpMap | undefined,
  ExpMap | undefined
>(
  getOwnedSoulBreaks,
  ({ characters }: IState) => characters.soulBreakExp,
  ({ characters }: IState) => characters.soulBreakExpRequired,
  (owned, expMap, expMapRequired) =>
    makeNeededExpMap(
      owned,
      expMap,
      expMapRequired,
      id =>
        enlir.soulBreaks[id] &&
        enlir.soulBreaks[id].tier !== 'Default' &&
        enlir.soulBreaks[id].tier !== 'Shared',
      getEstimatedRequiredSoulBreakExp,
    ),
);
