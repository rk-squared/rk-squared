import { Handler, StartupHandler } from './types';

import { updateWorlds, World, WorldCategory } from '../actions/worlds';
import * as schemas from './schemas';

import * as _ from 'lodash';
import { IState } from '../reducers';
import { Store } from 'redux';

// What's the best place to log these?  Use the console for now.
// tslint:disable no-console

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

      if (e.type_name === 'rotation') {
        // Only one daily dungeon is visible at a time.
        category = WorldCategory.PowerUpMote;
        subcategory = 'Motes';
        subcategorySortOrder = 1;
      } else if (e.type_name === 'wday') {
        category = WorldCategory.PowerUpMote;
        subcategory = 'Power Up Dungeons';
        subcategorySortOrder = 0;
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
        subcategory = world.series_formal_name;
        subcategorySortOrder = world.series_id;
      } else if ((e.type_name === 'challenge' || e.type_name === 'special')) {
        // 'special' was observed with A Heretic Awaits
        if (e.tag !== '') {
          // Fall back / generic - e.g., third_anniversary
          category = WorldCategory.SpecialEvent;
          subcategory = _.startCase(e.tag);
        } else {
          // Sort by open time and close time?
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

    // FIXME: Exclude dungeons not yet opened?

    if (totalUnknown) {
      console.error(`Found ${totalUnknown} unknown worlds`);
    }
    store.dispatch(updateWorlds(result));
  }
};

export default dungeons;
