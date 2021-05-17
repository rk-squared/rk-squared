import { createSelector } from 'reselect';

import * as _ from 'lodash';

import { enlir } from '../data';
import { IState } from '../reducers';

const idsToSet = (ids: number[]) => new Set<number>(ids);

export const getOwnedLegendMateria = createSelector<
  IState,
  number[] | undefined,
  Set<number> | undefined
>(({ characters }: IState) => characters.legendMateria, idsToSet);

export const getOwnedSoulBreaks = createSelector<
  IState,
  number[] | undefined,
  Set<number> | undefined
>(({ characters }: IState) => characters.soulBreaks, idsToSet);

// Limit breaks and soul breaks share the same ID space and are tracked in the
// same FFRK JSON structures.
export const getOwnedLimitBreaks = getOwnedSoulBreaks;

export const getOwnedRelics = createSelector<
  IState,
  Set<number> | undefined,
  Set<number> | undefined,
  Set<number> | undefined
>(
  getOwnedLegendMateria,
  getOwnedSoulBreaks,
  (legendMateria: Set<number> | undefined, soulBreaks: Set<number> | undefined) => {
    if (!legendMateria || !soulBreaks) {
      return undefined;
    }

    const result = new Set<number>();

    _.forEach(enlir.relicSoulBreaks, (sb, relicId) => {
      if (soulBreaks.has(sb.id)) {
        result.add(+relicId);
      }
    });
    _.forEach(enlir.relicLegendMateria, (lm, relicId) => {
      if (legendMateria.has(lm.id)) {
        result.add(+relicId);
      }
    });

    return result;
  },
);
