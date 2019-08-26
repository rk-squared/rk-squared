import { dungeons, DungeonState } from '../dungeons';

import {
  Dungeon,
  finishWorldDungeons,
  forgetWorldDungeons,
  openDungeonChest,
} from '../../actions/dungeons';

function makeDungeon(id: number, name: string, dungeonChests = 0): Dungeon {
  return {
    name,
    id,

    openedAt: 0,
    closedAt: 0,
    seriesId: 0,

    isUnlocked: true,
    isComplete: false,
    isMaster: false,

    difficulty: 0,
    totalStamina: 1,
    staminaList: [1],

    dungeonChests,

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
      5: makeDungeon(5, 'Record', 2),
    },
    byWorld: {
      100: [1, 2],
      200: [3, 4],
      300: [5],
    },
  };
}

describe('dungeons reducer', () => {
  describe('finishWorldDungeons', () => {
    it('updates completed', () => {
      const state = makeDungeonState();

      const newState = dungeons(state, finishWorldDungeons(100, { isComplete: true }));

      expect(newState.dungeons[1].isComplete).toEqual(true);
      expect(newState.dungeons[2].isComplete).toEqual(true);
      expect(newState.dungeons[1].isMaster).toEqual(false);
      expect(newState.dungeons[2].isMaster).toEqual(false);

      expect(newState.dungeons[3].isComplete).toEqual(false);
      expect(newState.dungeons[4].isComplete).toEqual(false);
    });

    it('updates completed and mastered', () => {
      const state = makeDungeonState();

      const newState = dungeons(
        state,
        finishWorldDungeons(100, { isComplete: true, isMaster: true }),
      );

      expect(newState.dungeons[1].isComplete).toEqual(true);
      expect(newState.dungeons[2].isComplete).toEqual(true);
      expect(newState.dungeons[1].isMaster).toEqual(true);
      expect(newState.dungeons[2].isMaster).toEqual(true);

      expect(newState.dungeons[3].isComplete).toEqual(false);
      expect(newState.dungeons[4].isComplete).toEqual(false);
    });
  });

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

  describe('openDungeonChest', () => {
    it('updates dungeon chest count', () => {
      const state = makeDungeonState();

      const newState = dungeons(state, openDungeonChest(5));

      expect(newState.dungeons[5].dungeonChests).toEqual(1);
    });
  });
});
