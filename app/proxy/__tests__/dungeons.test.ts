import { convertWorld } from '../dungeons';

import { WorldCategory } from '../../actions/worlds';

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

describe('dungeon proxy', () => {
  describe('StartupHandler', () => {
    it('processes Torment dungeons', () => {
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
        background_image_path: '/dff/static/lang/image/event/428_bg.png'
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
        banner_message: ''
      };

      expect(convertWorld(gameEvent, gameWorld, textMaster)).toEqual({
        category: WorldCategory.Torment,
        closedAt: 1531616399,
        id: 109428,
        isUnlocked: true,
        name: 'Herald of Doom (FF IX)',
        openedAt: 1520643600,
        seriesId: 109001,
        subcategory: undefined,
        subcategorySortOrder: undefined,
      });
    });
  });
});
