import * as Redux from 'redux';
import configureStore from 'redux-mock-store';

import { DungeonScoreType } from '../../actions/dungeonScores';
import { WorldCategory } from '../../actions/worlds';
import { IState } from '../../reducers';
import { default as dungeonScoresHandler } from '../dungeonScores';

const neoTormentT280Battles = require('./data/neo_torment_t_280_world_battles.json');
const neoTormentTUnkBattles = require('./data/neo_torment_t_unk_world_battles.json');
const magiciteWorldBattles = require('./data/magicite_world_battles.json');
const magiciteWinBattle = require('./data/magicite_win_battle.json');

describe('dungeonScores proxy handler', () => {
  const mockStore = configureStore<IState>();

  describe('battles', () => {
    it('handles magicite', () => {
      const store = mockStore();

      dungeonScoresHandler.battles(magiciteWorldBattles.data, store as Redux.Store<IState>, {});

      expect(store.getActions()).toEqual([
        {
          payload: {
            dungeonId: 10082101,
            score: {
              time: 19607,
              type: DungeonScoreType.ClearTime,
              won: true,
            },
          },
          type: 'SET_DUNGEON_SCORE',
        },
      ]);
    });

    it('handles mastered Neo Torments', () => {
      const store = mockStore();

      dungeonScoresHandler.battles(neoTormentT280Battles.data, store as Redux.Store<IState>, {});

      expect(store.getActions()).toEqual([
        {
          payload: {
            dungeonId: 15048602,
            score: {
              maxHp: 1000000,
              time: 22683,
              totalDamage: 1000000,
              type: DungeonScoreType.PercentHpOrClearTime,
              won: true,
            },
          },
          type: 'SET_DUNGEON_SCORE',
        },
      ]);
    });

    it('handles percent completed Neo Torments', () => {
      const store = mockStore();

      dungeonScoresHandler.battles(neoTormentTUnkBattles.data, store as Redux.Store<IState>, {});

      expect(store.getActions()).toEqual([
        {
          payload: {
            dungeonId: 15048603,
            score: {
              maxHp: 2000000,
              time: 35355,
              totalDamage: 1432340,
              type: DungeonScoreType.PercentHpOrClearTime,
              won: false,
            },
          },
          type: 'SET_DUNGEON_SCORE',
        },
      ]);
    });
  });

  describe('win_battle', () => {
    it('updates score on winning a magicite battle', () => {
      const dungeonId = +magiciteWinBattle.data.result.dungeon_id;
      // Magicite dungeon IDs happen to correspond to world ID + a 2 digit number.
      const worldId = Math.floor(dungeonId / 100);

      // Hack: Declare enough state for the test to pass, even if it's not all valid...
      // tslint:disable-next-line: no-object-literal-type-assertion
      const initialState = {
        dungeons: {
          byWorld: {
            [worldId]: [dungeonId],
          },
        },
        dungeonScores: {
          scores: {},
        },
        worlds: {
          worlds: {
            [worldId]: {
              category: WorldCategory.Magicite,
            },
          },
        },
      } as IState;

      const store = mockStore(initialState);

      dungeonScoresHandler.win_battle(magiciteWinBattle.data, store as Redux.Store<IState>, {});

      expect(store.getActions()).toEqual([
        {
          type: 'UPDATE_DUNGEON_SCORE',
          payload: {
            dungeonId: 10082302,
            newScore: {
              time: 21033,
              type: 1,
              won: true,
            },
          },
        },
      ]);
    });
  });
});
