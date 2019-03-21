/**
 * @file
 * Support for tracking relic banners (gacha banners)
 */
import { Store } from 'redux';

import * as _ from 'lodash';

import {
  RelicDrawBanner,
  RelicDrawGroup,
  RelicDrawProbabilities,
  setRelicDrawBanners,
  setRelicDrawGroups,
  setRelicDrawProbabilities,
} from '../actions/relicDraws';
import { LangType } from '../api/apiUrls';
import * as gachaSchemas from '../api/schemas/gacha';
import { relativeUrl } from '../data/urls';
import { IState } from '../reducers';
import { logger } from '../utils/logger';
import { getRequestLang, Handler, HandlerRequest } from './common';

interface RelicDrawBannerResults {
  banners: RelicDrawBanner[];
  groups: {
    [groupName: string]: RelicDrawGroup;
  };
}

export function convertBanner(
  lang: LangType,
  gacha: gachaSchemas.GachaSeriesList,
  group?: string,
): RelicDrawBanner {
  return {
    id: gacha.series_id,
    openedAt: gacha.opened_at,
    closedAt: gacha.closed_at,
    sortOrder: gacha.priority,

    canPull: _.some(gacha.box_list, i =>
      _.some(
        i.entry_point_list,
        j => j.term_limit_num === 0 || j.purchased_count < j.term_limit_num,
      ),
    ),
    canSelect:
      gacha.total_executable_num > 0 &&
      gacha.user_exchange_shop_exchanged_num < gacha.total_executable_num,

    bannerRelics: _.map(gacha.banner_list, 'item_id').filter(i => i !== 0),

    exchangeShopId: +gacha.exchange_shop_id || undefined,
    imageUrl: relativeUrl(lang, gacha.line_up_image_path),
    group,
  };
}

export function convertRelicDrawBanners(
  lang: LangType,
  { gacha_group, series_list }: gachaSchemas.GachaShow,
): RelicDrawBannerResults {
  const result: RelicDrawBannerResults = {
    banners: [],
    groups: {},
  };
  const sortedSeries = _.keyBy(series_list, 'series_id');

  const processed = new Set<number>();

  function process(series: gachaSchemas.GachaSeriesList, group?: string) {
    if (!processed.has(series.series_id)) {
      result.banners.push(convertBanner(lang, series, group));
      processed.add(series.series_id);
    }
  }

  for (const group of gacha_group) {
    const thisGroup: RelicDrawGroup = {
      groupName: 'group' + group.id,
      imageUrl: relativeUrl(lang, group.line_up_image_path),
      sortOrder: group.priority,
    };
    result.groups[thisGroup.groupName] = thisGroup;
    group.content_series_ids
      .map(i => sortedSeries[i])
      .filter(i => i != null)
      .forEach(i => process(i, thisGroup.groupName));
  }

  const archiveSeries = series_list.filter(i => i.is_book_gacha);
  if (archiveSeries.length) {
    const thisGroup: RelicDrawGroup = {
      groupName: 'archive',
      imageUrl: relativeUrl(
        lang,
        '/dff/static/lang/image/gacha_series/lineup_image/book_mission_gacha.png',
      ),
      sortOrder: -100,
    };
    result.groups[thisGroup.groupName] = thisGroup;
    archiveSeries.forEach(i => process(i, thisGroup.groupName));
  }

  // These IDs can be extracted from app.js's REGULAR_SERIES_GACHA constants
  const realmRelicDrawId = 687;
  const seriesCount = 17;
  const realmRelicDraws = series_list.filter(
    i => i.series_id >= realmRelicDrawId && i.series_id < realmRelicDrawId + seriesCount,
  );
  if (realmRelicDraws.length) {
    const thisGroup: RelicDrawGroup = {
      groupName: 'realmRelicDraws',
      imageUrl: relativeUrl(
        lang,
        '/dff/static/lang/image/gacha_series/lineup_image/series_687.png',
      ),
      sortOrder: -99,
    };
    result.groups[thisGroup.groupName] = thisGroup;
    realmRelicDraws.forEach(i => process(i, thisGroup.groupName));
  }

  series_list.filter(i => i.priority !== 0).forEach(i => process(i));

  return result;
}

export function convertRelicDrawProbabilities(
  data: gachaSchemas.GachaProbability,
): RelicDrawProbabilities | null {
  const entryPointIds = _.keys(data).filter(i => i.match(/^\d+$/));
  if (entryPointIds.length === 0) {
    logger.error('Failed to find entry point ID for gacha/probability');
    return null;
  } else if (entryPointIds.length > 1) {
    logger.warn(`Unexpected entry point IDs for gacha/probability: got ${entryPointIds.length}`);
  }
  const entryPointId = +entryPointIds[0];
  const { prob_by_rarity, equipments } = data[entryPointId];

  return {
    byRarity: _.mapValues(prob_by_rarity, parseFloat),
    byRelic: _.fromPairs(
      equipments.filter(i => i.rarity >= 5).map(i => [i.id, parseFloat(i.probability)]),
    ),
  };
}

const gachaHandler: Handler = {
  'gacha/show'(data: gachaSchemas.GachaShow, store: Store<IState>, request: HandlerRequest) {
    const { banners, groups } = convertRelicDrawBanners(getRequestLang(request), data);
    store.dispatch(setRelicDrawBanners(banners));
    store.dispatch(setRelicDrawGroups(_.values(groups)));
  },

  'gacha/probability'(
    data: gachaSchemas.GachaProbability,
    store: Store<IState>,
    { query }: HandlerRequest,
  ) {
    if (!query || !query.series_id) {
      logger.error('Unrecognized gacha/probability query');
      return;
    }

    const probabilities = convertRelicDrawProbabilities(data);
    if (!probabilities) {
      return;
    }
    store.dispatch(setRelicDrawProbabilities(query.series_id, probabilities));
  },
};

export default gachaHandler;
