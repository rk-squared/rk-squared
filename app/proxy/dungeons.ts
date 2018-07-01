/**
 * @file
 * Support for tracking world and dungeon rewards and completion status
 */

import { Store } from 'redux';

import { addWorldDungeons, updateDungeon } from '../actions/dungeons';
import { unlockWorld, updateWorlds, World, WorldCategory } from '../actions/worlds';
import * as schemas from '../api/schemas';
import * as dungeonsSchemas from '../api/schemas/dungeons';
import * as mainSchemas from '../api/schemas/main';
import { ItemType } from '../data/items';
import { IState } from '../reducers';
import { Handler, StartupHandler } from './types';

import * as _ from 'lodash';

// What's the best place to log these?  Use the console for now.
// tslint:disable no-console

const buttonStyleSort: {[s: string]: number} = {
  NORMAL: 0,
  EXTRA: 1,
  DOOM: 2,
};

/**
 * Gets effective difficulty.  Difficulty 0 mean ???, which sorts after
 * everything else.
 */
const effectiveDifficulty = (difficulty: number) => difficulty === 0 ? Infinity : difficulty;

function sortDungeonsByNode(dungeonData: dungeonsSchemas.Dungeons)
  : [dungeonsSchemas.Dungeon[], dungeonsSchemas.Dungeon[]] {
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
    dungeonList.filter(i => !sortOrder.has(i.id))
  ];
}

function sortDungeonsStandard(dungeonData: dungeonsSchemas.Dungeons, dungeonList: dungeonsSchemas.Dungeon[]) {
  // Normally, type 1 vs. 2 marks classic vs. elite, page 1 vs. page 2, etc.
  // But, for Nightmare, 1 is the actual record, and 2 is the buildup.
  const sortType: ((d: dungeonsSchemas.Dungeon) => number) =
    dungeonData.room_of_abyss_assets
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
    const [ sorted, unsorted ] = sortDungeonsByNode(dungeonData);
    if (unsorted.length) {
      console.error(`Failed to sort ${unsorted.length} node dungeons`);
      console.error(unsorted.map(i => i.name));
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
  for (let i = dungeonsSchemas.MinRewardGrade; i <= dungeonsSchemas.MaxRewardGrade; i++) {
    const grade = i.toString() as dungeonsSchemas.RewardType;
    if (dungeon.prizes[grade]) {
      allPrizes.push(...dungeon.prizes[grade]);
    }
  }

  allPrizes = _.sortBy(allPrizes, 'disp_order');
  const convert = (claimed: boolean) => convertPrizeItems(
    _.filter(allPrizes, i => !!i.is_got_grade_bonus_prize === claimed)
  );
  return {
    claimedGrade: convert(true),
    unclaimedGrade: convert(false)
  };
}

export function convertWorldDungeons(data: dungeonsSchemas.Dungeons) {
  return sortDungeons(data).map(d => ({
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
    }
  }));
}

export function convertWorld(event: mainSchemas.Event, world: mainSchemas.World,
                             textMaster: mainSchemas.TextMaster): World | null {
  let name = world.name;
  let category: WorldCategory | undefined;
  let subcategory: string | undefined;
  let subcategorySortOrder: number | undefined;
  const seriesShortName = textMaster[`sortmodal_short_summary_series_${world.series_id}`];

  if (event.type_name === 'rotation' || event.type_name === 'wday') {
    // For mote ("rotation") and power up ("wday") dungeons, there are only
    // two worlds ("Mode Dungeons" and "Power Up Dungeons"), each with only
    // one dungeon visible at a time.  No need to assign a subcategory.
    category = WorldCategory.PowerUpMote;
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
    name = world.name + ' (' + seriesShortName + ')';
  } else if (event.tag === 'crystal_tower') {
    category = WorldCategory.CrystalTower;
  } else if (world.name.startsWith('Newcomers\' Dungeons - ')) {
    category = WorldCategory.Newcomer;
  } else if (event.tag.match(/^ff.*_reopen_ww\d+/)) {
    category = WorldCategory.Renewal;
    // Type-0, at least, has series_formal_name == ''.
    subcategory = world.series_formal_name || seriesShortName;
    // Use negative series ID so that newest series are listed first,
    // to match FFRK's own API.
    subcategorySortOrder = -world.series_id;
  } else if ((event.type_name === 'challenge' || event.type_name === 'special')) {
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

// noinspection JSUnusedGlobalSymbols
const dungeons: Handler = {
  [StartupHandler]: (data: mainSchemas.Main, store: Store<IState>) => {
    const result: {[id: number]: World} = {};

    const { worlds, events } = data.appInitData;

    const worldsById = _.zipObject(worlds.map(i => i.id), worlds);

    const seenWorlds = new Set<number>();

    let totalUnknown = 0;
    for (const e of events) {
      const world = worldsById[e.world_id];
      if (world == null) {
        console.error(`Unknown world for {e.id}`);
        continue;
      }
      seenWorlds.add(e.world_id);

      const resultWorld = convertWorld(e, world, data.textMaster);

      if (resultWorld == null) {
        console.error(`Unknown: ${e.world_id} (${world.name})`);
        totalUnknown++;
      } else {
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
      console.error(`Found ${totalUnknown} unknown worlds`);
    }
    store.dispatch(updateWorlds(result));

    // FIXME: Track half-price dungeons; exclude dungeons that aren't open
  },

  dungeons(data: dungeonsSchemas.Dungeons, store: Store<IState>, query?: any) {
    if (!query || !query.world_id) {
      console.error('Unrecognized dungeons query');
      return;
    }

    const newDungeons = convertWorldDungeons(data);

    store.dispatch(unlockWorld(query.world_id));
    store.dispatch(addWorldDungeons(query.world_id, newDungeons));

    // FIXME: Track remaining Record Dungeon treasures?
  },

  win_battle(data: schemas.WinBattle, store: Store<IState>) {
    if (data.result.is_dungeon_clear) {
      store.dispatch(updateDungeon(+data.result.dungeon_id, {
        isComplete: true,
        isMaster: data.result.dungeon_rank === 3
      }));
      for (const i of data.result.unlock_dungeons) {
        store.dispatch(updateDungeon(+i.dungeon_id, {
          isUnlocked: true,
        }));
      }
    }
  }
};

export default dungeons;
