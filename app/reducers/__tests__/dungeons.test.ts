import { dungeons, DungeonState } from '../dungeons';

import { Dungeon, forgetWorldDungeons } from '../../actions/dungeons';

function makeDungeon(id: number, name: string, isComplete = false, isMaster = false): Dungeon {
  return {
    name,
    id,

    openedAt: 0,
    closedAt: 0,
    seriesId: 0,

    isUnlocked: true,
    isComplete: isComplete || false,
    isMaster: isMaster || false,

    difficulty: 0,
    totalStamina: 1,
    staminaList: [1],

    prizes: {
      completion: [],
      firstTime: [],
      mastery: [],
    },
  };
}

function makeDungeonState(): DungeonState {
  return {
    dungeons: {
      1: makeDungeon(1, 'One'),
      2: makeDungeon(2, 'Two'),
      3: makeDungeon(3, 'Alpha'),
      4: makeDungeon(4, 'Beta'),
    },
    byWorld: {
      100: [1, 2],
      200: [3, 4],
    }
  };
}

describe('dungeons reducer', () => {
  describe('forgetWorldDungeons', () => {
    it('forgets loaded dungeons', () => {
      const state = makeDungeonState();

      const newState = dungeons(state, forgetWorldDungeons(100));

      expect(newState.dungeons[1]).toBeUndefined();
      expect(newState.dungeons[2]).toBeUndefined();
      expect(newState.dungeons[3].name).toEqual('Alpha');
      expect(newState.dungeons[4].name).toEqual('Beta');

      expect(newState.byWorld[100]).toBeUndefined();
      expect(newState.byWorld[200]).toEqual([3, 4]);
    });

    it('ignores unknown dungeons', () => {
      const state = makeDungeonState();

      const newState = dungeons(state, forgetWorldDungeons(9999));

      expect(newState.dungeons[1].name).toEqual('One');
      expect(newState.dungeons[2].name).toEqual('Two');
      expect(newState.dungeons[3].name).toEqual('Alpha');
      expect(newState.dungeons[4].name).toEqual('Beta');

      expect(newState.byWorld[100]).toEqual([1, 2]);
      expect(newState.byWorld[200]).toEqual([3, 4]);
    });
  });
});
