import { createSelector } from 'reselect';

import * as _ from 'lodash';

import {
  ExchangeShopSelections,
  RelicDrawBanner,
  RelicDrawGroup,
  RelicDrawProbabilities,
} from '../actions/relicDraws';
import { enlir } from '../data/enlir';
import { IState } from '../reducers';
import { RelicDrawState } from '../reducers/relicDraws';
import { isClosed } from '../utils/timeUtils';
import { getOwnedLegendMateria, getOwnedSoulBreaks } from './characters';

export interface RelicDrawBannerDetails extends RelicDrawBanner {
  totalCount?: number;
  dupeCount?: number;
  selections?: ExchangeShopSelections;
}

export interface RelicDrawGroupDetails extends RelicDrawGroup {
  bannerCount: number;
  closedAt: number;
  canPull: boolean;
  canSelect: boolean;
  canPullOrSelectCount: number;
}

export type RelicDrawBannerOrGroup = RelicDrawBannerDetails | RelicDrawGroupDetails;

export function isGroup(item: RelicDrawBannerOrGroup): item is RelicDrawGroupDetails {
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

function getOneBannerDetails(
  banner: RelicDrawBanner,
  probabilities: RelicDrawProbabilities | undefined,
  allSelections: { [exchangeShopId: number]: ExchangeShopSelections },
  ownedSoulBreaks: Set<number> | undefined,
  ownedLegendMateria: Set<number> | undefined,
): RelicDrawBannerDetails {
  const selections =
    banner.exchangeShopId && allSelections ? allSelections[banner.exchangeShopId] : undefined;

  if (banner.bannerRelics && banner.bannerRelics.length !== 0) {
    return {
      ...banner,
      selections,
      totalCount: banner.bannerRelics.length,
      dupeCount: getDupeCount(banner.bannerRelics, ownedSoulBreaks, ownedLegendMateria),
    };
  } else if (probabilities) {
    const allRelics = _.keys(probabilities.byRelic).map(j => +j);
    return {
      ...banner,
      selections,
      totalCount: allRelics.length,
      dupeCount: getDupeCount(allRelics, ownedSoulBreaks, ownedLegendMateria),
    };
  } else if (selections) {
    return {
      ...banner,
      selections,
    };
  } else {
    return banner;
  }
}

export const getBannerDetails = createSelector<
  IState,
  RelicDrawState,
  Set<number> | undefined,
  Set<number> | undefined,
  { [bannerId: number]: RelicDrawBannerDetails }
>(
  (state: IState) => state.relicDraws,
  getOwnedSoulBreaks,
  getOwnedLegendMateria,
  ({ banners, probabilities, selections }, ownedSoulBreaks, ownedLegendMateria) => {
    return _.mapValues(banners, (banner: RelicDrawBanner) =>
      getOneBannerDetails(
        banner,
        probabilities[banner.id],
        selections,
        ownedSoulBreaks,
        ownedLegendMateria,
      ),
    );
  },
);

export const getBannersAndGroups = createSelector<
  IState,
  RelicDrawState,
  { [bannerId: number]: RelicDrawBannerDetails },
  RelicDrawBannersAndGroups
>(
  (state: IState) => state.relicDraws,
  getBannerDetails,
  ({ banners, groups }, bannerDetails) => {
    const result: { [group: string]: RelicDrawBannerOrGroup[] } = {};

    for (const group of [..._.keys(groups), undefined]) {
      const groupName = '' + group;

      result[groupName] = _.filter(bannerDetails, i => i.group === group);

      // If this is the root (undefined) group, then extend with all child groups.
      if (!group) {
        result[groupName].push(
          ..._.values(groups).map(g => {
            const groupBanners = _.filter(banners, i => i.group === g.groupName);
            return {
              ...g,
              bannerCount: groupBanners.length,
              closedAt: _.max(groupBanners.map(i => i.closedAt))!,
              canPull: _.some(groupBanners, i => i.canPull),
              canSelect: _.some(groupBanners, i => i.canSelect),
              canPullOrSelectCount: _.sumBy(groupBanners, i => +(i.canPull || i.canSelect)),
            };
          }),
        );
      }

      result[groupName] = _.sortBy(result[groupName], i => -i.sortOrder);
    }

    return result;
  },
);

export const getMissingBanners = createSelector<IState, RelicDrawState, number, number[]>(
  (state: IState) => state.relicDraws,
  (state: IState) => state.timeState.currentTime,
  ({ banners, probabilities, selections }, currentTime) => {
    // Start with all open banner IDs.
    const missing = new Set(
      _.keys(banners)
        .filter(i => !isClosed(banners[+i], currentTime))
        .map(i => +i),
    );

    // Remove banner IDs for which we have probabilities and don't need selections.
    const needsSelection = (bannerId: number) =>
      banners[bannerId] &&
      banners[bannerId].exchangeShopId != null &&
      !selections[banners[bannerId].exchangeShopId!];
    _.keys(probabilities)
      .filter(i => !needsSelection(+i))
      .forEach(i => missing.delete(+i));

    return Array.from(missing);
  },
);
