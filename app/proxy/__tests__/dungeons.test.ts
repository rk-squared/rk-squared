import {
  convertGradePrizeItems,
  convertPrizeItems,
  convertWorld,
  default as dungeonsHandler,
  sortDungeons,
} from '../dungeons';

import configureStore from 'redux-mock-store';

import * as _ from 'lodash';

import { WorldCategory } from '../../actions/worlds';
import * as dungeonsSchemas from '../../api/schemas/dungeons';
import { ItemType } from '../../data/items';
import { IState } from '../../reducers';

// noinspection SpellCheckingInspection
const textMaster = {
  sortmodal_short_summary_series_113001: 'FF XIII',
  sortmodal_short_summary_series_106001: 'FF VI',
  sortmodal_short_summary_series_105001: 'FF V',
  sortmodal_short_summary_series_101001: 'FF I',
  sortmodal_short_summary_series_111001: 'FF XI',
  sortmodal_short_summary_series_150001: 'FF T',
  sortmodal_short_summary_series_900072: 'ETC',
  sortmodal_short_summary_series_200001: 'Core',
  sortmodal_short_summary_series_112001: 'FF XII',
  sortmodal_short_summary_series_104001: 'FF IV',
  sortmodal_short_summary_series_103001: 'FF III',
  sortmodal_short_summary_series_170001: 'KH',
  sortmodal_short_summary_series_108001: 'FF VIII',
  sortmodal_short_summary_series_114001: 'FF XIV',
  sortmodal_short_summary_series_109001: 'FF IX',
  sortmodal_short_summary_series_102001: 'FF II',
  sortmodal_short_summary_series_115001: 'FF XV',
  sortmodal_short_summary_series_190001: 'Beyond',
  sortmodal_short_summary_series_107001: 'FF VII',
  sortmodal_short_summary_series_110001: 'FF X',
  sortmodal_short_summary_series_160001: 'Type-0',
};

describe('dungeons proxy handler', () => {
  describe('StartupHandler', () => {
    it('processes old Torment dungeons', () => {
      const gameEvent = {
        world_id: 109428,
        battle_list_bg_type: 2,
        type_name: 'challenge',
        has_intro_movie: false,
        ex_opened_at: 1510189200,
        order_weight: 7,
        image_path: '/dff/static/lang/image/event/428.png',
        type: 2,
        id: 428,
        tag: 'nightmare_dungeon',
        background_image_path: '/dff/static/lang/image/event/428_bg.png',
      };
      const gameWorld = {
        has_brave_series_buddies: false,
        closed_at: 1531616399,
        bgm: 'bgm_25_030',
        dungeon_status_summary: {},
        door_image_path: '/dff/static/lang/image/world/109428_door.png',
        dungeon_term_list: null,
        series_formal_name: 'FINAL FANTASY IX',
        id: 109428,
        name: 'Herald of Doom',
        has_new_dungeon: false,
        series_id: 109001,
        opened_at: 1520643600,
        kept_out_at: 1531357199,
        is_unlocked: true,
        image_path: '/dff/static/lang/image/world/109428.png',
        type: 2,
        banner_message: '',
      };

      expect(convertWorld(gameEvent, gameWorld, textMaster)).toEqual({
        category: WorldCategory.Torment,
        closedAt: 1531616399,
        id: 109428,
        isUnlocked: true,
        name: 'Herald of Doom (FF IX)',
        openedAt: 1520643600,
        seriesId: 109001,
        subcategory: 'Classic Torments',
        subcategorySortOrder: undefined,
      });
    });

    it('processes new Torment dungeons', () => {
      const gameEvent = {
        world_id: 150486,
        battle_list_bg_type: 2,
        type_name: 'challenge',
        has_intro_movie: false,
        ex_opened_at: 0,
        order_weight: 575,
        image_path: '/dff/static/lang/image/event/486.png',
        type: 2,
        id: 486,
        tag: 'regular_nightmare_dungeon',
        background_image_path: '/dff/static/lang/image/event/486_bg.png',
      };
      const gameWorld = {
        has_brave_series_buddies: false,
        closed_at: 2145938400,
        bgm: 'bgm_25_069',
        dungeon_status_summary: {},
        door_image_path: '/dff/static/lang/image/world/150486_door.png',
        dungeon_term_list: null,
        series_formal_name: 'FINAL FANTASY TACTICS',
        id: 150486,
        name: 'Tyranny of the Impure', // misspelled in the original
        has_new_dungeon: true,
        series_id: 150001,
        opened_at: 1531357200,
        kept_out_at: 2145938400,
        is_unlocked: true,
        image_path: '/dff/static/lang/image/world/150486.png',
        type: 2,
        banner_message: '',
      };

      expect(convertWorld(gameEvent, gameWorld, textMaster)).toEqual({
        category: WorldCategory.Torment,
        closedAt: 2145938400,
        id: 150486,
        isUnlocked: true,
        name: 'Tyranny of the Impure (FF T)',
        openedAt: 1531357200,
        seriesId: 150001,
        subcategory: undefined,
        subcategorySortOrder: undefined,
      });
    });

    it('processes Record Dungeons', () => {
      const gameEvent = {
        world_id: 401001,
        battle_list_bg_type: 1,
        type_name: 'original_scenario',
        has_intro_movie: false,
        ex_opened_at: 0,
        order_weight: 3000,
        image_path: '/dff/static/lang/image/event/11001.png',
        type: 11,
        id: 11001,
        tag: '',
        background_image_path: '/dff/static/lang/image/event/11001_bg.png',
      };
      const gameWorld = {
        has_brave_series_buddies: false,
        closed_at: 2177420399,
        bgm: 'bgm_30_002',
        dungeon_status_summary: {},
        door_image_path: '/dff/static/lang/image/world/401001_door.png',
        dungeon_term_list: null,
        series_formal_name: '',
        id: 401001,
        name: 'Untrodden Paths',
        has_new_dungeon: true,
        series_id: 1,
        opened_at: 1527667200,
        kept_out_at: 2177420399,
        is_unlocked: true,
        image_path: '/dff/static/lang/image/world/401001.png',
        type: 2,
        banner_message: '',
      };

      expect(convertWorld(gameEvent, gameWorld, textMaster)).toEqual({
        category: WorldCategory.Record,
        closedAt: 2177420399,
        id: 401001,
        isUnlocked: true,
        name: 'Untrodden Paths',
        openedAt: 1527667200,
        seriesId: 1,
        subcategory: undefined,
        subcategorySortOrder: undefined,
      });
    });
  });

  describe('dungeons handler', () => {
    it('sorts Record Dungeons', () => {
      const data = require('./data/untrodden_paths_dungeons.json');
      const sortedDungeonNames = sortDungeons(data).map(i => i.name);
      // noinspection SpellCheckingInspection
      expect(sortedDungeonNames).toEqual([
        'Midgar Sector 1',
        'Mako Reactor No. 1',
        'Mako Reactor No. 1 Assault',
        'Midgar Sector 8',
        'Narshe',
        'North Mines',
        'West Mines 1',
        'West Mines 2',
        'Figaro Castle',
        'Mobliz 1',
        'Mobliz 2',
        'Purge Train',
        'The Hanging Edge 1',
        'The Hanging Edge 2',
        'Airship',
        'Mist Cave',
        'Sparring with Kain',
        'Kaipo',
        'Underground Waterway 1',
        'Underground Waterway 2',
        'Underground Waterway 3',
        "Antlion's Den 1",
        "Antlion's Den 2",
        'The Antlion',
      ]);
    });

    it('handles damage-based grade prizes', () => {
      const data = require('./data/damage_race_dungeons.json');
      const prizes = convertGradePrizeItems(data.dungeons[2]);
      expect(prizes.claimedGrade.map(i => i.name)).toEqual([
        'Bravery Mote (4★)',
        'Spirit Mote (4★)',
        'Dexterity Mote (4★)',
        'Wisdom Mote (4★)',
        'Memory Crystal III Lode',
        'Memory Crystal II Lode',
      ]);
      expect(prizes.unclaimedGrade.map(i => i.name)).toEqual(['Vitality Mote (4★)']);
    });

    it('handles Neo Torment grade prizes', () => {
      const data = require('./data/neo_torment_dungeons.json');

      const prizes = convertGradePrizeItems(data.dungeons[2]);

      const totalCount = (name: string) =>
        _.sum(prizes.unclaimedGrade.filter(i => i.name === name).map(i => i.amount));
      expect(totalCount('Record Rubies')).toEqual(160);
      expect(totalCount('Power Crystal')).toEqual(10);
    });

    it('unlocks Power Up dungeons', () => {
      const data = require('./data/power_up_world_dungeons.json');
      const powerUpWorld = {
        category: 9,
        closedAt: 2145938400,
        id: 13014,
        isUnlocked: true,
        name: 'Power Up Dungeons',
        openedAt: 1553086800,
        seriesId: 300001,
      };

      const mockStore = configureStore<IState>();
      const initialState: Partial<IState> = {
        worlds: { worlds: { [powerUpWorld.id]: powerUpWorld } },
      };
      const store = mockStore(initialState as IState);

      dungeonsHandler['dungeons'](data.data, store, { query: { world_id: powerUpWorld.id } });
      const action = store.getActions().find(i => i.type === 'ADD_WORLD_DUNGEONS');
      expect(action.payload.dungeons[0].isUnlocked).toEqual(true);
      expect(store.getActions()).toMatchSnapshot();
    });

    it('handles Feast Ticket', () => {
      const data = require('./data/feast_record_dungeons.json').data as dungeonsSchemas.Dungeons;
      const prizes = convertPrizeItems(
        data.dungeons[1].prizes[dungeonsSchemas.RewardType.FirstTime],
      );
      expect(prizes[0]).toEqual({ amount: 1, id: 96003851, name: 'Feast Ticket', type: ItemType.Common });
      expect(prizes).toMatchSnapshot();
    });
  });

  describe('battle gimmick handler', () => {
    it('handles Record Dungeon chests', () => {
      const data = require('./data/progress_battle_list_gimmick.json');

      const mockStore = configureStore<IState>();
      const store = mockStore();

      dungeonsHandler['progress_battle_list_gimmick'](data.data, store, {});

      expect(store.getActions()).toEqual([
        {
          type: 'OPEN_DUNGEON_CHEST',
          payload: {
            dungeonId: 40100225,
          },
        },
      ]);
    });
  });
});
