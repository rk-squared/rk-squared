/**
 * @file
 * Support for tracking relic banners (gacha banners)
 */
import { Store } from 'redux';

import * as _ from 'lodash';
import * as striptags from 'striptags';

import { addLegendMateria, addSoulBreak } from '../actions/characters';
import {
  closeBannersExcept,
  expireOldRelicDrawBanners,
  RelicDrawBanner,
  RelicDrawGroup,
  RelicDrawProbabilities,
  setExchangeShopSelections,
  setRelicDrawBannersAndGroups,
  setRelicDrawProbabilities,
  wantRelic,
} from '../actions/relicDraws';
import { LangType } from '../api/apiUrls';
import * as gachaSchemas from '../api/schemas/gacha';
import { ItemId } from '../data/items';
import { parseNumberString } from '../data/mrP/util';
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

function parseRiseMessage(riseMessage: string) {
  riseMessage = striptags(riseMessage);
  // FIXME: Parse non-English rise messages
  const m =
    riseMessage.match(
      /([A-Z]\w+) (\d+)★ or higher (?:relic is|relics are) guaranteed to drop in each Rare Relic Draw/,
    ) ||
    riseMessage.match(/This relic draw has (\w+) guaranteed (\d+)★ relics?/) ||
    riseMessage.match(/Guaranteed (\w+) (\d+)★ or Higher Relics in Rare Relic Draw x11/i);
  if (m) {
    const guaranteedCount = parseNumberString(m[1]) || undefined;
    return {
      guaranteedCount,
      guaranteedRarity: +m[2],
    };
  }
  return {
    guaranteedCount: undefined,
    guaranteedRarity: undefined,
  };
}

export function convertBanner(
  lang: LangType,
  gacha: gachaSchemas.GachaSeriesList,
  group?: string,
): RelicDrawBanner {
  const entryPoints = _.flatten(gacha.box_list.map(i => i.entry_point_list));
  const { guaranteedRarity, guaranteedCount } = parseRiseMessage(gacha.rise_message);
  return {
    id: gacha.series_id,
    openedAt: gacha.opened_at,
    closedAt: gacha.closed_at,
    sortOrder: gacha.priority,

    canPull: _.some(
      entryPoints,
      // Original attempt: Partially successful, but it doesn't handle cases
      // like the Realms on Parade / Luck of the Realms where a single pull
      // is permitted but can be of several payment types.
      // i => i.term_limit_num === 0 || i.purchased_count < i.term_limit_num,
      i => i.executable_num > 0,
    ),
    canSelect:
      // Original attempt: But total_executable_num actually refers to pulls.
      // gacha.total_executable_num > 0 &&
      // gacha.user_exchange_shop_exchanged_num < gacha.total_executable_num,
      gacha.exchange_shop_id != null &&
      gacha.exchange_shop_id !== 0 &&
      gacha.user_exchange_shop_exchanged_num === 0,
    pullLimit: gacha.total_executable_num || undefined,

    bannerRelics: _.sortBy(gacha.banner_list, 'disp_order')
      .map(i => i.item_id)
      .filter(i => i !== 0),

    exchangeShopId: +gacha.exchange_shop_id || undefined,
    imageUrl: relativeUrl(lang, gacha.line_up_image_path),
    group,

    cost: {
      drawCount: _.max(entryPoints.map(i => i.lot_num)),
      mythrilCost: _.max(
        _.filter(entryPoints, i => i.pay_id === ItemId.Mythril).map(i => i.pay_cost),
      ),
      guaranteedCount,
      guaranteedRarity,
    },
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
    logger.warn(
      `Unexpected entry point IDs for gacha/probability: got ${entryPointIds.join(', ')}`,
    );
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

export function convertExchangeShopSelections(
  data: gachaSchemas.ExchangeShopPrizeList,
): number[][] {
  return _.sortBy(data.exchange_shop.prizes, ['group_id', 'disp_order', 'id']).map(i =>
    i.item_package.items.map(j => j.item_id),
  );
}

const gachaHandler: Handler = {
  'gacha/show'(data: gachaSchemas.GachaShow, store: Store<IState>, request: HandlerRequest) {
    const { banners, groups } = convertRelicDrawBanners(getRequestLang(request), data);
    store.dispatch(setRelicDrawBannersAndGroups(banners, _.values(groups)));

    const state = store.getState();

    const currentBannerIds = banners.map(i => i.id);
    store.dispatch(closeBannersExcept(state.timeState.currentTime, currentBannerIds));

    store.dispatch(
      expireOldRelicDrawBanners(
        state.timeState.currentTime,
        state.options.maxOldRelicDrawBannerAgeInDays,
      ),
    );
  },

  'gacha/probability'(
    data: gachaSchemas.GachaProbability,
    store: Store<IState>,
    { query }: HandlerRequest,
  ) {
    if (!query || !query.series_id) {
      logger.error(`Unrecognized gacha/probability query: got ${query}`);
      return;
    }

    const probabilities = convertRelicDrawProbabilities(data);
    if (!probabilities) {
      return;
    }
    store.dispatch(setRelicDrawProbabilities(query.series_id, probabilities));
  },

  'exchange_shop/prize_list'(
    data: gachaSchemas.ExchangeShopPrizeList,
    store: Store<IState>,
    { query }: HandlerRequest,
  ) {
    if (!query || !query.shop_id) {
      logger.error(`Unrecognized exchange_shop/prize_list query: got ${query}`);
      return;
    }
    if (query.group_id) {
      // Only seeing one group of the dream selection - skip processing
      return;
    }

    const selections = convertExchangeShopSelections(data);
    store.dispatch(setExchangeShopSelections(query.shop_id, selections));
  },

  'gacha/execute'(data: gachaSchemas.GachaExecute, store: Store<IState>) {
    const soulBreakIds = data.soul_strikes.map(i => +i.id);
    const legendMateriaIds = data.legend_materias.map(i => +i.id);
    if (soulBreakIds.length) {
      store.dispatch(addSoulBreak(soulBreakIds));
    }
    if (legendMateriaIds.length) {
      store.dispatch(addLegendMateria(legendMateriaIds));
    }

    // If we just pulled a relic, it's safe to assume we no longer care about
    // it.
    store.dispatch(wantRelic(data.items.map(i => i.equipment_id), false));
  },
};

export default gachaHandler;
