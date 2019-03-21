import { createSelector } from 'reselect';

import * as _ from 'lodash';

import { RelicDrawBanner, RelicDrawGroup } from '../actions/relicDraws';
import { enlir } from '../data/enlir';
import { IState } from '../reducers';
import { RelicDrawState } from '../reducers/relicDraws';
import { getOwnedLegendMateria, getOwnedSoulBreaks } from './characters';

export interface RelicDrawBannerDetails extends RelicDrawBanner {
  totalCount?: number;
  dupeCount?: number;
}

export type RelicDrawBannerOrGroup = RelicDrawBannerDetails | RelicDrawGroup;

export function isGroup(item: RelicDrawBannerOrGroup): item is RelicDrawGroup {
  return 'groupName' in item;
}

function getDupeCount(
  relicIds: number[],
  ownedSoulBreaks: Set<number> | undefined,
  ownedLegendMateria: Set<number> | undefined,
): number | undefined {
  if (!ownedSoulBreaks || !ownedLegendMateria) {
    return undefined;
  }

  return (
    _.filter(
      relicIds,
      i => enlir.relicSoulBreaks[i] && ownedSoulBreaks.has(enlir.relicSoulBreaks[i].id),
    ).length +
    _.filter(
      relicIds,
      i => enlir.relicLegendMateria[i] && ownedLegendMateria.has(enlir.relicLegendMateria[i].id),
    ).length
  );
}

export interface RelicDrawBannersAndGroups {
  // Indexed by group name - 'undefined' if no group
  [group: string]: RelicDrawBannerOrGroup[];
}

export const getBannersAndGroups = createSelector<
  IState,
  RelicDrawState,
  Set<number> | undefined,
  Set<number> | undefined,
  RelicDrawBannersAndGroups
>(
  (state: IState) => state.relicDraws,
  getOwnedSoulBreaks,
  getOwnedLegendMateria,
  ({ banners, groups, probabilities }, ownedSoulBreaks, ownedLegendMateria) => {
    const result: { [group: string]: RelicDrawBannerOrGroup[] } = {};

    for (const group of _.map(banners, i => i.group)) {
      const groupName = '' + group;

      const bannerDetails: RelicDrawBannerDetails[] = _.filter(banners, i => i.group === group).map(
        i => {
          if (i.bannerRelics) {
            return {
              ...i,
              totalCount: i.bannerRelics.length,
              dupeCount: getDupeCount(i.bannerRelics, ownedSoulBreaks, ownedLegendMateria),
            };
          } else if (probabilities[i.id]) {
            const allRelics = _.keys(probabilities[i.id].byRelic).map(j => +j);
            return {
              ...i,
              totalCount: allRelics.length,
              dupeCount: getDupeCount(allRelics, ownedSoulBreaks, ownedLegendMateria),
            };
          } else {
            return i;
          }
        },
      );

      result[groupName] = bannerDetails;
      if (!group) {
        result[groupName].push(..._.values(groups));
      }

      result[groupName] = _.sortBy(result[groupName], i => -i.sortOrder);
    }

    return result;
  },
);
