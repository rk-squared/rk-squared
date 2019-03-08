/**
 * @file
 * Support for tracking world and dungeon rewards and completion status
 */

import { Dispatch, Store } from 'redux';

import * as _ from 'lodash';

import {
  addWorldDungeons,
  Dungeon,
  finishWorldDungeons,
  forgetWorldDungeons,
  openDungeonChest,
  updateDungeon,
} from '../actions/dungeons';
import { unlockWorld, updateWorlds, World, WorldCategory } from '../actions/worlds';
import { LangType } from '../api/apiUrls';
import * as schemas from '../api/schemas';
import * as dungeonsSchemas from '../api/schemas/dungeons';
import * as mainSchemas from '../api/schemas/main';
import { enlir } from '../data';
import { ItemType } from '../data/items';
import { itemImage } from '../data/urls';
import { IState } from '../reducers';
import { DungeonState } from '../reducers/dungeons';
import { logger } from '../utils/logger';
import { Handler, HandlerRequest, StartupHandler } from './common';

const buttonStyleSort: { [s: string]: number } = {
  NORMAL: 0,
  EXTRA: 1,
  DOOM: 2,
};

/**
 * Gets effective difficulty.  Difficulty 0 mean ???, which sorts after
 * everything else.
 */
const effectiveDifficulty = (difficulty: number) => (difficulty === 0 ? Infinity : difficulty);

/**
 * Sorts record dungeons using the dungeon node map.  Returns a list of sorted
 * dungeons, followed by a list of dungeons that couldn't be sorted.  (That
 * should never happen.)
 */
function sortDungeonsByNode(
  dungeonData: dungeonsSchemas.Dungeons,
): [dungeonsSchemas.Dungeon[], dungeonsSchemas.Dungeon[]] {
  const dungeonList = dungeonData.dungeons;
  const nodes = _.keyBy(dungeonData.dungeon_list_nodes, 'id');

  // Map dungeon IDs to zero-based sort orders
  const sortOrder = new Map<number, number>();
  let nextSortOrder = 0;

  // Breadth-first search
  const seen = new Map<number, boolean>();
  const toProcess: number[] = [];

  const root = _.find(nodes, node => node.type === dungeonsSchemas.NodeType.Start);
  if (root == null) {
    return [[], dungeonList];
  }

  seen.set(root.id, true);
  toProcess.push(root.id);

  while (toProcess.length) {
    const subtreeRoot = nodes[toProcess.shift() as number];

    // Process sort order
    if (subtreeRoot.dungeon_id) {
      sortOrder.set(subtreeRoot.dungeon_id, nextSortOrder);
      nextSortOrder++;
    }

    // BFS logic
    seen.set(subtreeRoot.id, true);

    const pathInfo = subtreeRoot.path_info;
    if (pathInfo != null) {
      const nextIds = _.sortBy(Object.keys(pathInfo).map(i => +i), i => +pathInfo[i]);
      for (const id of nextIds) {
        if (!seen.has(id)) {
          toProcess.push(id);
        }
      }
    }
  }

  return [
    _.sortBy(dungeonList.filter(i => sortOrder.has(i.id)), i => sortOrder.get(i.id)),
    dungeonList.filter(i => !sortOrder.has(i.id)),
  ];
}

function sortDungeonsStandard(
  dungeonData: dungeonsSchemas.Dungeons,
  dungeonList: dungeonsSchemas.Dungeon[],
) {
  // Normally, type 1 vs. 2 marks classic vs. elite, page 1 vs. page 2, etc.
  // But, for Nightmare, 1 is the actual record, and 2 is the buildup.
  const sortType: (d: dungeonsSchemas.Dungeon) => number = dungeonData.room_of_abyss_assets
    ? d => -d.type
    : d => d.type;

  return _.sortBy(dungeonList, [
    // Sort by page 1 vs. page 2, Classic vs. Elite, whatever
    sortType,
    // Realm dungeons are sorted by progress_map_level.
    'progress_map_level',
    // Then by normal vs. hard vs. DOOM!
    (d: dungeonsSchemas.Dungeon) => buttonStyleSort[d.button_style],
    // Then by difficulty
    (d: dungeonsSchemas.Dungeon) => effectiveDifficulty(d.challenge_level),
    // Use id to disambiguate magicite
    'id',
  ]);
}

export function sortDungeons(dungeonData: dungeonsSchemas.Dungeons) {
  if (dungeonData.dungeon_list_nodes) {
    const [sorted, unsorted] = sortDungeonsByNode(dungeonData);
    if (unsorted.length) {
      logger.error(`Failed to sort ${unsorted.length} node dungeons`);
      logger.error(unsorted.map(i => i.name));
    }
    return sorted.concat(sortDungeonsStandard(dungeonData, unsorted));
  } else {
    return sortDungeonsStandard(dungeonData, dungeonData.dungeons);
  }
}

export function convertPrizeItems(prizes?: dungeonsSchemas.DungeonPrizeItem[]) {
  if (!prizes) {
    return [];
  } else {
    return prizes.map(i => ({
      id: i.id,
      name: i.name,
      amount: i.num,
      // FIXME: cleanly convert item type
      type: i.type_name.toLowerCase() as ItemType,
    }));
  }
}

export function convertGradePrizeItems(dungeon: dungeonsSchemas.Dungeon) {
  let allPrizes: dungeonsSchemas.DungeonPrizeItem[] = [];
  for (let i = dungeonsSchemas.MinRewardGrade; ; i++) {
    const grade = i.toString() as dungeonsSchemas.RewardType;
    if (!dungeon.prizes[grade]) {
      break;
    }
    allPrizes.push(...dungeon.prizes[grade]);
  }

  allPrizes = _.sortBy(allPrizes, 'disp_order');
  const convert = (claimed: boolean) =>
    convertPrizeItems(_.filter(allPrizes, i => !!i.is_got_grade_bonus_prize === claimed));
  return {
    claimedGrade: convert(true),
    unclaimedGrade: convert(false),
  };
}

export function addRecordDungeonChests(dungeons: Dungeon[], nodes: dungeonsSchemas.DungeonNode[]) {
  const dungeonObject = _.keyBy(dungeons, 'id');
  for (const i of nodes) {
    if (i.remaining_treasure_num) {
      if (!dungeonObject[i.dungeon_id]) {
        logger.warn(`Saw dungeon chests for unknown dungeon ${i.dungeon_id}`);
      } else {
        dungeonObject[i.dungeon_id].dungeonChests = i.remaining_treasure_num;
      }
    }
  }
}

export function convertWorldDungeons(data: dungeonsSchemas.Dungeons): Dungeon[] {
  const dungeons = sortDungeons(data).map(d => ({
    name: d.name,
    id: d.id,
    seriesId: d.series_id,
    difficulty: d.challenge_level,
    openedAt: d.opened_at,
    closedAt: d.closed_at,
    isUnlocked: d.is_unlocked,
    isComplete: d.is_clear,
    isMaster: d.is_master,
    totalStamina: d.total_stamina,
    staminaList: d.stamina_list,
    prizes: {
      completion: convertPrizeItems(d.prizes[dungeonsSchemas.RewardType.Completion]),
      firstTime: convertPrizeItems(d.prizes[dungeonsSchemas.RewardType.FirstTime]),
      mastery: convertPrizeItems(d.prizes[dungeonsSchemas.RewardType.Mastery]),
      ...convertGradePrizeItems(d),
    },
  }));

  if (data.dungeon_list_nodes) {
    addRecordDungeonChests(dungeons, data.dungeon_list_nodes);
  }

  return dungeons;
}

export function convertWorld(
  event: mainSchemas.Event,
  world: mainSchemas.World,
  textMaster: mainSchemas.TextMaster,
): World | null {
  let name = world.name;
  let category: WorldCategory | undefined;
  let subcategory: string | undefined;
  let subcategorySortOrder: number | undefined;
  const seriesShortName = textMaster[`sortmodal_short_summary_series_${world.series_id}`];

  if (event.type_name === 'rotation' || event.type_name === 'wday') {
    // For mote ("rotation") and power up ("wday") dungeons, there are only
    // two worlds ("Mote Dungeons" and "Power Up Dungeons"), each with only
    // one dungeon visible at a time.  No need to assign a subcategory.
    category = WorldCategory.PowerUpMote;
  } else if (event.type_name === 'fragment') {
    // Full open "fragment" (mote) dungeons - JP only as of January 2019.
    // Put them in their own subcategory for now; we may improve this later.
    category = WorldCategory.PowerUpMote;
    subcategory = 'Mote Dungeons';
  } else if (event.type_name === 'extreme') {
    category = WorldCategory.Nightmare;
  } else if (event.type_name === 'beast') {
    category = WorldCategory.Magicite;
  } else if (event.type_name === 'suppress') {
    category = WorldCategory.Raid;
  } else if (event.type_name === 'original_scenario') {
    category = WorldCategory.Record;
  } else if (event.tag === 'full_throttle') {
    category = WorldCategory.JumpStart;
  } else if (event.tag === 'nightmare_dungeon') {
    category = WorldCategory.Torment;
    subcategory = 'Classic Torments';
    name = world.name + ' (' + seriesShortName + ')';
  } else if (event.tag === 'regular_nightmare_dungeon') {
    category = WorldCategory.Torment;
    name = world.name + ' (' + seriesShortName + ')';
  } else if (event.tag === 'crystal_tower') {
    category = WorldCategory.CrystalTower;
  } else if (world.name.startsWith("Newcomers' Dungeons - ")) {
    category = WorldCategory.Newcomer;
  } else if (event.tag.match(/^ff.*_reopen_ww\d+/)) {
    category = WorldCategory.Renewal;
    // Type-0, at least, has series_formal_name == ''.
    subcategory = world.series_formal_name || seriesShortName;
    // Use negative series ID so that newest series are listed first,
    // to match FFRK's own API.
    subcategorySortOrder = -world.series_id;
  } else if (event.type_name === 'challenge' || event.type_name === 'special') {
    // 'special' was observed with A Heretic Awaits
    if (event.tag !== '') {
      // Fall back / generic - e.g., third_anniversary
      category = WorldCategory.SpecialEvent;
      subcategory = _.startCase(event.tag);
    } else {
      category = WorldCategory.Event;
    }
  } else {
    return null;
  }

  return {
    id: world.id,
    name,
    category,
    subcategory,
    subcategorySortOrder,
    openedAt: world.opened_at,
    closedAt: world.closed_at,
    seriesId: world.series_id,
    isUnlocked: world.is_unlocked,
  };
}

function checkForWorldIcon(world: World) {
  switch (world.category) {
    case WorldCategory.Nightmare: {
      const ability = enlir.abilitiesByName[world.name.replace(' Record', '')];
      if (ability) {
        world.iconUrl = itemImage(LangType.Gl, ability.id, ItemType.Ability);
      }
      break;
    }

    case WorldCategory.Magicite: {
      world.localIcon = world.name.toLowerCase() + 'Element';
      break;
    }
  }
}

function convertWorlds(
  worlds: mainSchemas.World[],
  events: mainSchemas.Event[],
  textMaster: mainSchemas.TextMaster,
): { [id: number]: World } {
  const result: { [id: number]: World } = {};

  const worldsById = _.zipObject(worlds.map(i => i.id), worlds);

  const seenWorlds = new Set<number>();

  let totalUnknown = 0;
  for (const e of events) {
    const world = worldsById[e.world_id];
    if (world == null) {
      logger.error(`Unknown world for {e.id}`);
      continue;
    }
    seenWorlds.add(e.world_id);

    const resultWorld = convertWorld(e, world, textMaster);

    if (resultWorld == null) {
      logger.error(`Unknown: ${e.world_id} (${world.name})`);
      totalUnknown++;
    } else {
      checkForWorldIcon(resultWorld);
      result[world.id] = resultWorld;
    }
  }

  for (const w of worlds) {
    if (!seenWorlds.has(w.id)) {
      result[w.id] = {
        id: w.id,
        name: w.name,
        category: WorldCategory.Realm,
        openedAt: w.opened_at,
        closedAt: w.closed_at,
        seriesId: w.series_id,
        isUnlocked: w.is_unlocked,
      };
    }
  }

  if (totalUnknown) {
    logger.error(`Found ${totalUnknown} unknown worlds`);
  }

  return result;
}

/**
 * Checks the status summary counts for Realm worlds against the last loaded
 * dungeon lists for each world to update them if needed.
 */
function checkForUpdatedRealmDungeons(
  worlds: mainSchemas.World[],
  dungeons: DungeonState,
  dispatch: Dispatch,
  now: number = Date.now(),
) {
  const describe = (
    description: string,
    summary: { master_count: number; clear_count: number } | undefined,
  ) => (summary ? ` ${description} ${summary.master_count}/${summary.clear_count}/x,` : '');

  for (const w of _.sortBy(worlds, 'id')) {
    const summary1 = (w.dungeon_status_summary || {})[1];
    const summary2 = (w.dungeon_status_summary || {})[2];
    if (!summary1 || !summary2 || !w.dungeon_term_list || w.dungeon_term_list.length === 0) {
      continue;
    }

    const newLength = w.dungeon_term_list.filter(i => +i.opened_at < now / 1000).length;
    logger.debug(
      `World ${w.name}:` +
        describe('normal', summary1) +
        describe('elite', summary2) +
        ` ${w.dungeon_term_list.length} total, ${newLength} current`,
    );

    if (!dungeons.byWorld[w.id]) {
      continue;
    }

    const newCompleted = summary1.clear_count + summary2.clear_count;
    const newMastered = summary1.master_count + summary2.master_count;

    const worldDungeons = dungeons.byWorld[w.id].map(i => dungeons.dungeons[i]);
    const oldLength = worldDungeons.length;
    const oldCompleted = _.sumBy(worldDungeons, i => +i.isComplete);
    const oldMastered = _.sumBy(worldDungeons, i => +i.isMaster);
    logger.debug(
      `  loaded ${worldDungeons.length}, completed ${oldCompleted}, mastered ${oldMastered}`,
    );

    if (oldLength > newLength) {
      logger.warn(`Unexpected world / dungeon results for ${w.id}: ${oldLength} vs. ${newLength}`);
      dispatch(forgetWorldDungeons(w.id));
    } else if (newLength > oldLength) {
      logger.debug(`  New dungeons have been released for ${w.id}`);
      dispatch(forgetWorldDungeons(w.id));
    } else {
      const isNewComplete = newCompleted === newLength && newCompleted > oldCompleted;
      const isNewMaster = newMastered === newLength && newMastered > oldMastered;
      if (isNewComplete || isNewMaster) {
        // Note: This log message simplifies isNewComplete vs. isNewMaster, but it should suffice.
        logger.debug(
          `  ${w.id} was ${isNewMaster ? 'mastered' : 'completed'} without our knowledge`,
        );
        dispatch(finishWorldDungeons(w.id, { isComplete: isNewComplete, isMaster: isNewMaster }));
      }
      // TODO? Could do even more here - e.g., if all of summary1 is completed, mark all non-elite as complete
    }
  }
}

/**
 * Checks Record worlds to see if any are listing new dungeons.
 */
function checkForUpdatedRecordDungeons(
  worlds: mainSchemas.World[],
  newWorlds: { [id: number]: World },
  dungeons: DungeonState,
  dispatch: Dispatch,
) {
  for (const w of _.sortBy(worlds, 'id')) {
    if (
      !newWorlds[w.id] ||
      newWorlds[w.id].category !== WorldCategory.Record ||
      !dungeons.byWorld[w.id]
    ) {
      continue;
    }

    const worldDungeons = dungeons.byWorld[w.id].map(i => dungeons.dungeons[i]);
    const oldLength = worldDungeons.length;
    const oldCompleted = _.sumBy(worldDungeons, i => +i.isComplete);

    if (oldLength === oldCompleted && w.has_new_dungeon) {
      logger.debug(`World ${w.name} has new dungeons (was at ${oldCompleted}/${oldLength})`);
      dispatch(forgetWorldDungeons(w.id));
    }
  }
}

function handleWinBattle(data: schemas.WinBattle, store: Store<IState>) {
  if (data.result.is_dungeon_clear) {
    store.dispatch(
      updateDungeon(+data.result.dungeon_id, {
        isComplete: true,
        isMaster: data.result.dungeon_rank === 3,
      }),
    );
    for (const i of data.result.unlock_dungeons) {
      store.dispatch(
        updateDungeon(+i.dungeon_id, {
          isUnlocked: true,
        }),
      );
    }
  }
}

// noinspection JSUnusedGlobalSymbols
const dungeonsHandler: Handler = {
  [StartupHandler]: (data: mainSchemas.Main, store: Store<IState>) => {
    const { worlds, events } = data.appInitData;

    const newWorlds = convertWorlds(worlds, events, data.textMaster);
    store.dispatch(updateWorlds(newWorlds));

    checkForUpdatedRealmDungeons(worlds, store.getState().dungeons, store.dispatch);
    checkForUpdatedRecordDungeons(worlds, newWorlds, store.getState().dungeons, store.dispatch);
    // FIXME: Track half-price dungeons
  },

  dungeons(data: dungeonsSchemas.Dungeons, store: Store<IState>, { query }: HandlerRequest) {
    if (!query || !query.world_id) {
      logger.error('Unrecognized dungeons query');
      return;
    }

    const newDungeons = convertWorldDungeons(data);

    store.dispatch(unlockWorld(query.world_id));
    store.dispatch(addWorldDungeons(query.world_id, newDungeons));
  },

  win_battle: handleWinBattle,
  battle_win: handleWinBattle,
  'battle/win': handleWinBattle,

  progress_battle_list_gimmick(
    data: dungeonsSchemas.ProgressBattleListGimmick,
    store: Store<IState>,
  ) {
    if (data.gimmick_effect.effect && data.gimmick_effect.effect.prize_master) {
      store.dispatch(openDungeonChest(data.user.dungeon_id));
    }
  },
};

export default dungeonsHandler;
