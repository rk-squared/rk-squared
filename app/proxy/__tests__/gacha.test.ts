import { convertGachaBanners } from '../gacha';

import * as _ from 'lodash';

import { LangType } from '../../api/apiUrls';

describe('gacha proxy handler', () => {
  describe('gacha/show', () => {
    it('converts relic draws with Realms on Parade', () => {
      const data = require('./data/gacha_show.json');
      const { banners, groups } = convertGachaBanners(LangType.Gl, data.data);

      expect(_.values(banners).length).toEqual(45);

      const ff5BannerItems = _.find(banners, i => i.id === 788)!.bannerItems!;
      expect(ff5BannerItems.length).toEqual(14);
      expect(ff5BannerItems).toEqual([
        22050094,
        21008231,
        22053364,
        21001136,
        21010068,
        21008209,
        22051121,
        22055051,
        21006060,
        21004035,
        22056216,
        22053274,
        21009074,
        22056183,
      ]);

      expect(_.values(groups)).toEqual([
        {
          groupName: 'group4',
          imageUrl:
            'http://ffrk.denagames.com/dff/static/lang/ww/compile/en/image/gacha_series/lineup_image/series_happy_805.png',
          sortOrder: 1903081700,
        },
        {
          groupName: 'archive',
          imageUrl:
            'http://ffrk.denagames.com/dff/static/lang/ww/compile/en/image/gacha_series/lineup_image/book_mission_gacha.png',
          sortOrder: -100,
        },
        {
          groupName: 'realmRelicDraws',
          imageUrl:
            'http://ffrk.denagames.com/dff/static/lang/ww/compile/en/image/gacha_series/lineup_image/series_687.png',
          sortOrder: -99,
        },
      ]);
    });
  });
});
