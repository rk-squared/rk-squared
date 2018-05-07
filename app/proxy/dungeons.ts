/**
 * @file
 * Support for tracking world and dungeon rewards and completion status
 */

import { Store } from 'redux';

import { addWorldDungeons, updateDungeon } from '../actions/dungeons';
import { updateWorlds, World, WorldCategory } from '../actions/worlds';
import { ItemType } from '../data/items';
import { IState } from '../reducers';
import * as schemas from './schemas';
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

function sortDungeons(dungeonData: schemas.Dungeons) {
  // Normally, type 1 vs. 2 marks classic vs. elite, page 1 vs. page 2, etc.
  // But, for Nightmare, 1 is the actual record, and 2 is the buildup.
  const sortType: ((d: schemas.Dungeon) => number) =
    dungeonData.room_of_abyss_assets
    ? d => -d.type
    : d => d.type;

  return _.sortBy(dungeonData.dungeons, [
    // Sort by page 1 vs. page 2, Classic vs. Elite, whatever
    sortType,
    // Realm dungeons are sorted by progress_map_level.
    'progress_map_level',
    // Then by normal vs. hard vs. DOOM!
    (d: schemas.Dungeon) => buttonStyleSort[d.button_style],
    // Then by difficulty
    (d: schemas.Dungeon) => effectiveDifficulty(d.challenge_level),
    // Use id to disambiguate magicite
    'id',
  ]);
}

function convertPrizeItems(prizes?: schemas.DungeonPrizeItem[]) {
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

export function convertWorldDungeons(data: schemas.Dungeons) {
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
      completion: convertPrizeItems(d.prizes[schemas.RewardType.Completion]),
      firstTime: convertPrizeItems(d.prizes[schemas.RewardType.FirstTime]),
      mastery: convertPrizeItems(d.prizes[schemas.RewardType.Mastery]),
    }
  }));
}

// noinspection JSUnusedGlobalSymbols
const dungeons: Handler = {
  [StartupHandler]: (data: schemas.Main, store: Store<IState>) => {
    const result: {[id: number]: World} = {};

    const { worlds, events } = data.appInitData;

    const worldsById = _.zipObject(worlds.map(i => i.id), worlds);
    const seriesShortName = (id: number) => data.textMaster[`sortmodal_short_summary_series_${id}`];

    const seenWorlds = new Set<number>();

    let totalUnknown = 0;
    for (const e of events) {
      const world = worldsById[e.world_id];
      if (world == null) {
        console.error(`Unknown world for {e.id}`);
        continue;
      }
      seenWorlds.add(e.world_id);

      let name = world.name;
      let category: WorldCategory | undefined;
      let subcategory: string | undefined;
      let subcategorySortOrder: number | undefined;

      // FIXME: Extract into a separate, testable function
      if (e.type_name === 'rotation' || e.type_name === 'wday') {
        // For mote ("rotation") and power up ("wday") dungeons, there are only
        // two worlds ("Mode Dungeons" and "Power Up Dungeons"), each with only
        // one dungeon visible at a time.  No need to assign a subcategory.
        category = WorldCategory.PowerUpMote;
      } else if (e.type_name === 'extreme') {
        category = WorldCategory.Nightmare;
      } else if (e.type_name === 'beast') {
        category = WorldCategory.Magicite;
      } else if (e.type_name === 'suppress') {
        category = WorldCategory.Raid;
      } else if (e.tag === 'full_throttle') {
        category = WorldCategory.JumpStart;
      } else if (e.tag === 'nightmare_dungeon') {
        category = WorldCategory.Torment;
        name = world.name + ` (${seriesShortName(world.series_id)})`;
      } else if (e.tag === 'crystal_tower') {
        category = WorldCategory.CrystalTower;
      } else if (world.name.startsWith('Newcomers\' Dungeons - ')) {
        category = WorldCategory.Newcomer;
      } else if (e.tag.match(/^ff.*_reopen_ww\d+/)) {
        category = WorldCategory.Renewal;
        // Type-0, at least, has series_formal_name == ''.
        subcategory = world.series_formal_name || data.textMaster[`sortmodal_short_summary_series_${world.series_id}`];
        // Use negative series ID so that newest series are listed first,
        // to match FFRK's own API.
        subcategorySortOrder = -world.series_id;
      } else if ((e.type_name === 'challenge' || e.type_name === 'special')) {
        // 'special' was observed with A Heretic Awaits
        if (e.tag !== '') {
          // Fall back / generic - e.g., third_anniversary
          category = WorldCategory.SpecialEvent;
          subcategory = _.startCase(e.tag);
        } else {
          category = WorldCategory.Event;
        }
      } else {
        console.error(`Unknown: ${e.world_id} (${world.name})`);
        totalUnknown++;
        continue;
      }

      result[world.id] = {
        id: world.id,
        name,
        category,
        subcategory,
        subcategorySortOrder,
        openedAt: world.opened_at,
        closedAt: world.closed_at,
        seriesId: world.series_id,
      };
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
        };
      }
    }

    if (totalUnknown) {
      console.error(`Found ${totalUnknown} unknown worlds`);
    }
    store.dispatch(updateWorlds(result));

    // FIXME: Track half-price dungeons
  },

  dungeons(data: schemas.Dungeons, store: Store<IState>, query?: any) {
    if (!query || !query.world_id) {
      console.error('Unrecognized dungeons query');
      return;
    }

    const newDungeons = convertWorldDungeons(data);

    store.dispatch(addWorldDungeons(query.world_id, newDungeons));
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
