import {
  Dungeon,
  getAllPrizes,
  getAvailablePrizes,
  hasAvailablePrizes,
  PrizeItem,
} from '../../actions/dungeons';

export const rewards = (isAnonymous?: boolean) =>
  (isAnonymous ? 'available' : 'unclaimed') + ' rewards';
export const rewardsTitle = (isAnonymous?: boolean) =>
  (isAnonymous ? 'Available' : 'Unclaimed') + ' Rewards';

interface DungeonInfo {
  completed: boolean;
  mastered: boolean;
  hasPrizes: boolean;
  getPrizes(dungeonOrDungeons: Dungeon | Dungeon[]): PrizeItem[];
}

interface DungeonProcessor {
  getInfo(dungeon: Dungeon): DungeonInfo;
}

export const anonymousProcessor: DungeonProcessor = {
  getInfo(dungeon: Dungeon) {
    return {
      hasPrizes: true,
      completed: false,
      mastered: false,
      getPrizes: getAllPrizes,
    };
  },
};

export const standardProcessor: DungeonProcessor = {
  getInfo(dungeon: Dungeon) {
    const hasPrizes = hasAvailablePrizes(dungeon);
    return {
      hasPrizes,
      completed: dungeon.isComplete,
      mastered: dungeon.isMaster && !hasPrizes,
      getPrizes: getAvailablePrizes,
    };
  },
};

export const getProcessor = (isAnonymous?: boolean) =>
  isAnonymous ? anonymousProcessor : standardProcessor;
