import { createSelector } from 'reselect';

import * as _ from 'lodash';

import {
  ExchangeShopSelections,
  RelicDrawBanner,
  RelicDrawGroup,
  RelicDrawProbabilities,
} from '../actions/relicDraws';
import { enlir } from '../data/enlir';
import { RelicProbability } from '../data/probabilities';
import { IState } from '../reducers';
import { RelicDrawState } from '../reducers/relicDraws';
import { difference } from '../utils/setUtils';
import { isClosed } from '../utils/timeUtils';
import { getOwnedLegendMateria, getOwnedSoulBreaks } from './characters';

export interface RelicDrawBannerDetails extends RelicDrawBanner {
  /**
   * Value to show for the total number of relics for this banner.  For most
   * banners, this is the number of featured relics.  May be missing for
   * banners that don't have featured relics and for which we haven't loaded
   * detailed probabilities.
   */
  totalCount?: number;

  /**
   * Number of duplicate relics on this banner.
   */
  dupeCount?: number;

  selections?: ExchangeShopSelections;
}

export interface RelicDrawGroupDetails extends RelicDrawGroup {
  bannerCount: number;
  openedAt: number;
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
  currentTime: number,
): RelicDrawBannerDetails {
  const selections =
    banner.exchangeShopId && allSelections ? allSelections[banner.exchangeShopId] : undefined;
  const closed = isClosed(banner, currentTime);

  const result = {
    ...banner,
    canPull: banner.canPull && !closed,
    canSelect: banner.canSelect && !closed,
  };
  if (banner.bannerRelics && banner.bannerRelics.length !== 0) {
    return {
      ...result,
      selections,
      totalCount: banner.bannerRelics.length,
      dupeCount: getDupeCount(banner.bannerRelics, ownedSoulBreaks, ownedLegendMateria),
    };
  } else if (probabilities) {
    const allRelics = _.keys(probabilities.byRelic).map(j => +j);
    return {
      ...result,
      selections,
      totalCount: allRelics.length,
      dupeCount: getDupeCount(allRelics, ownedSoulBreaks, ownedLegendMateria),
    };
  } else if (selections) {
    return {
      ...result,
      selections,
    };
  } else {
    return result;
  }
}

export const getBannerDetails = createSelector<
  IState,
  RelicDrawState,
  Set<number> | undefined,
  Set<number> | undefined,
  number,
  { [bannerId: number]: RelicDrawBannerDetails }
>(
  (state: IState) => state.relicDraws,
  getOwnedSoulBreaks,
  getOwnedLegendMateria,
  (state: IState) => state.timeState.currentTime,
  ({ banners, probabilities, selections }, ownedSoulBreaks, ownedLegendMateria, currentTime) => {
    return _.mapValues(banners, (banner: RelicDrawBanner) =>
      getOneBannerDetails(
        banner,
        probabilities[banner.id],
        selections,
        ownedSoulBreaks,
        ownedLegendMateria,
        currentTime,
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
              openedAt: _.min(groupBanners.map(i => i.openedAt))!,
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
    // Checking selections != null is to accommodate in-development stores that
    // lacked `selections`.
    const needsSelection = (bannerId: number) =>
      banners[bannerId] &&
      banners[bannerId].exchangeShopId != null &&
      selections != null &&
      !selections[banners[bannerId].exchangeShopId!];
    _.keys(probabilities)
      .filter(i => !needsSelection(+i))
      .forEach(i => missing.delete(+i));

    return Array.from(missing);
  },
);

export const getNewExchangeShopSelections = createSelector<
  IState,
  RelicDrawState,
  number,
  Set<number>
>(
  (state: IState) => state.relicDraws,
  (state: IState) => state.timeState.currentTime,
  ({ banners, selections }, currentTime) => {
    const openShopIds = new Set<number>(
      _.values(banners)
        .filter(i => !isClosed(i, currentTime) && i.exchangeShopId)
        .map(i => i.exchangeShopId!),
    );

    function getSelections(wantOpen: boolean): Set<number> {
      return new Set<number>(
        _.flatten(
          _.filter(selections, (items, id) => openShopIds.has(+id) === wantOpen).map(items =>
            _.flatten(items),
          ),
        ),
      );
    }

    const closedSelections = getSelections(false);
    const openSelections = getSelections(true);

    return difference(openSelections, closedSelections);
  },
);

export const getRelicProbabilities = createSelector<
  IState,
  { bannerId: number },
  RelicDrawProbabilities,
  RelicProbability[]
>(
  (state: IState, props: { bannerId: number }) => state.relicDraws.probabilities[props.bannerId],
  (probabilities: RelicDrawProbabilities) => {
    return _.toPairs(probabilities.byRelic).map(([relicId, probability]) => ({
      relicId: +relicId,
      probability,
      rarity: enlir.relics[relicId].rarity,
    }));
  },
);
