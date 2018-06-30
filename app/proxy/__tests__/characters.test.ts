import { IState } from '../../reducers';
import { default as charactersHandler } from '../characters';

import * as Redux from 'redux';
import configureStore from 'redux-mock-store';

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

describe('characters proxy handler', () => {
  describe('grow_egg/use', () => {
    it ('updates characters', () => {
      const mockStore = configureStore<IState>();
      const store = mockStore();

      charactersHandler['grow_egg/use'](growEggUseData, store as Redux.Store<IState>, undefined, growEggUsePost);

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
});
