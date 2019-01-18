import * as Redux from 'redux';
import configureStore from 'redux-mock-store';

import { DungeonScoreType } from '../../actions/dungeonScores';
import { IState } from '../../reducers';
import { default as dungeonScoresHandler } from '../dungeonScores';

const neoTormentT280Battles = require('./data/neo_torment_t_280_world_battles.json');
const neoTormentTUnkBattles = require('./data/neo_torment_t_unk_world_battles.json');
const magiciteWorldBattles = require('./data/magicite_world_battles.json');

describe('dungeonScores proxy handler', () => {
  describe('battles', () => {
    const mockStore = configureStore<IState>();
    let store: ReturnType<typeof mockStore>;
    beforeEach(() => {
      store = mockStore();
    });

    it('handles magicite', () => {
      dungeonScoresHandler.battles(magiciteWorldBattles.data, store as Redux.Store<IState>, {});

      expect(store.getActions()).toEqual([
        {
          payload: {
            dungeonId: 10082101,
            score: {
              time: 19607,
              type: DungeonScoreType.CLEAR_TIME,
              won: true,
            },
          },
          type: 'SET_DUNGEON_SCORE',
        },
      ]);
    });

    it('handles mastered Neo Torments', () => {
      dungeonScoresHandler.battles(neoTormentT280Battles.data, store as Redux.Store<IState>, {});

      expect(store.getActions()).toEqual([
        {
          payload: {
            dungeonId: 15048602,
            score: {
              maxHp: 1000000,
              time: 22683,
              totalDamage: 1000000,
              type: DungeonScoreType.PERCENT_HP_OR_CLEAR_TIME,
              won: true,
            },
          },
          type: 'SET_DUNGEON_SCORE',
        },
      ]);
    });

    it('handles percent completed Neo Torments', () => {
      dungeonScoresHandler.battles(neoTormentTUnkBattles.data, store as Redux.Store<IState>, {});

      expect(store.getActions()).toEqual([
        {
          payload: {
            dungeonId: 15048603,
            score: {
              maxHp: 2000000,
              time: 35355,
              totalDamage: 1432340,
              type: DungeonScoreType.PERCENT_HP_OR_CLEAR_TIME,
              won: false,
            },
          },
          type: 'SET_DUNGEON_SCORE',
        },
      ]);
    });
  });
});
