import { IState } from '../../reducers';
import { default as charactersHandler } from '../characters';

import * as Redux from 'redux';
import configureStore from 'redux-mock-store';
import * as url from 'url';

const growEggUseData = require('./data/grow_egg_use.json');
const growEggUsePost = {
  user_buddy_id: 47884939,
  grow_egg_id_2_num: {
    70000001: 5,
    70000002: 3,
    70000003: 4,
    70000004: 4,
    70000005: 2
  },
  is_recommend_used: 1,
  current_exp: 379325,
  exec: 1
};
const winBattleData = require('./data/challenge_win_battle.json');
const buddyEvolve50 = require('./data/buddy_evolve_50.json');
const buddyEvolve50Preview = require('./data/buddy_evolve_50_preview.json');
const recordDungeonPartyList = require('./data/record_dungeon_party_list.json');

describe('characters proxy handler', () => {
  describe('party/list', () => {
    it('does nothing for Record Dungeons', () => {
      const mockStore = configureStore<IState>();
      const store = mockStore();

      charactersHandler['party/list'](
        recordDungeonPartyList, store as Redux.Store<IState>,
        { url: url.parse(recordDungeonPartyList.url) }
      );

      expect(store.getActions()).toEqual([]);
    });
  });

  describe('win_battle', () => {
    it('updates characters', () => {
      const mockStore = configureStore<IState>();
      const store = mockStore();

      charactersHandler['win_battle'](winBattleData, store as Redux.Store<IState>, { body: growEggUsePost });

      expect(store.getActions()).toEqual([{
        type: 'UPDATE_CHARACTER',
        payload: {
          id: 10600900,
          character: {
            level: 83,
          },
        }
      }]);
    });
  });

  describe('grow_egg/use', () => {
    it ('updates characters', () => {
      const mockStore = configureStore<IState>();
      const store = mockStore();

      charactersHandler['grow_egg/use'](growEggUseData, store as Redux.Store<IState>, { body: growEggUsePost });

      expect(store.getActions()).toEqual([{
        type: 'SET_CHARACTER',
        payload: {
          id: 10200200,
          level: 50,
          levelCap: 50,
          name: 'Maria',
          uniqueId: 47884939,
        }
      }]);
    });
  });

  describe('buddy/evolve', () => {
    it('updates characters', () => {
      const mockStore = configureStore<IState>();
      const store = mockStore();

      charactersHandler['buddy/evolve'](
        buddyEvolve50.data, store as Redux.Store<IState>, { body: buddyEvolve50.requestBody }
      );

      expect(store.getActions()).toEqual([{
        type: 'SET_CHARACTER',
        payload: {
          id: 10200200,
          level: 50,
          levelCap: 65,
          name: 'Maria',
          uniqueId: 47884939,
        }
      }]);
    });

    it('does nothing on previews', () => {
      const mockStore = configureStore<IState>();
      const store = mockStore();

      charactersHandler['buddy/evolve'](
        buddyEvolve50Preview.data, store as Redux.Store<IState>, { body: buddyEvolve50Preview.requestBody }
      );

      expect(store.getActions()).toEqual([]);
    });
  });
});
