import {
  DungeonScoreType,
  estimateScore,
  formatEstimatedScore,
  formatScore,
} from '../dungeonScores';

import { ItemType } from '../../data/items';
import { Dungeon } from '../dungeons';
import { World } from '../worlds';

const fftDUnknownTormentDungeon: Dungeon = {
  name: 'Tyranny of the Impure, Part 3',
  id: 15048603,
  seriesId: 150001,
  difficulty: 0,
  openedAt: 1531357200,
  closedAt: 2145938400,
  isUnlocked: true,
  isComplete: true,
  isMaster: false,
  totalStamina: 1,
  staminaList: [1],
  prizes: {
    completion: [
      {
        id: 92000000,
        name: 'Gil',
        amount: 1500,
        type: ItemType.Common,
      },
    ],
    firstTime: [
      {
        id: 95001080,
        name: 'Record Rubies',
        amount: 20,
        type: ItemType.Common,
      },
      {
        id: 92000000,
        name: 'Gil',
        amount: 200000,
        type: ItemType.Common,
      },
      {
        id: 91000000,
        name: 'Mythril',
        amount: 1,
        type: ItemType.Common,
      },
    ],
    mastery: [
      {
        id: 40000066,
        name: 'Power Crystal',
        amount: 8,
        type: ItemType.Orb,
      },
      {
        id: 40000060,
        name: 'Major Holy Orb',
        amount: 10,
        type: ItemType.Orb,
      },
      {
        id: 92000000,
        name: 'Gil',
        amount: 200000,
        type: ItemType.Common,
      },
    ],
    claimedGrade: [
      {
        id: 95001080,
        name: 'Record Rubies',
        amount: 10,
        type: ItemType.Common,
      },
      {
        id: 130100300,
        name: 'Spirit Mote (5★)',
        amount: 20,
        type: ItemType.Mote,
      },
      {
        id: 40000073,
        name: 'Ice Crystal',
        amount: 4,
        type: ItemType.Orb,
      },
      {
        id: 95001080,
        name: 'Record Rubies',
        amount: 10,
        type: ItemType.Common,
      },
      {
        id: 130100300,
        name: 'Spirit Mote (5★)',
        amount: 20,
        type: ItemType.Mote,
      },
      {
        id: 40000072,
        name: 'Fire Crystal',
        amount: 4,
        type: ItemType.Orb,
      },
      {
        id: 95001080,
        name: 'Record Rubies',
        amount: 20,
        type: ItemType.Common,
      },
      {
        id: 130100300,
        name: 'Spirit Mote (5★)',
        amount: 25,
        type: ItemType.Mote,
      },
    ],
    unclaimedGrade: [
      {
        id: 95001080,
        name: 'Record Rubies',
        amount: 40,
        type: ItemType.Common,
      },
      {
        id: 130100300,
        name: 'Spirit Mote (5★)',
        amount: 25,
        type: ItemType.Mote,
      },
      {
        id: 95001080,
        name: 'Record Rubies',
        amount: 40,
        type: ItemType.Common,
      },
      {
        id: 92000000,
        name: 'Gil',
        amount: 200000,
        type: ItemType.Common,
      },
      {
        id: 95001080,
        name: 'Record Rubies',
        amount: 40,
        type: ItemType.Common,
      },
      {
        id: 92000000,
        name: 'Gil',
        amount: 200000,
        type: ItemType.Common,
      },
      {
        id: 95001080,
        name: 'Record Rubies',
        amount: 40,
        type: ItemType.Common,
      },
      {
        id: 130100300,
        name: 'Spirit Mote (5★)',
        amount: 25,
        type: ItemType.Mote,
      },
      {
        id: 95001080,
        name: 'Record Rubies',
        amount: 40,
        type: ItemType.Common,
      },
      {
        id: 40000078,
        name: 'Dark Crystal',
        amount: 4,
        type: ItemType.Orb,
      },
      {
        id: 130100300,
        name: 'Spirit Mote (5★)',
        amount: 25,
        type: ItemType.Mote,
      },
      {
        id: 95001080,
        name: 'Record Rubies',
        amount: 10,
        type: ItemType.Common,
      },
      {
        id: 130100300,
        name: 'Spirit Mote (5★)',
        amount: 20,
        type: ItemType.Mote,
      },
      {
        id: 40000075,
        name: 'Earth Crystal',
        amount: 4,
        type: ItemType.Orb,
      },
      {
        id: 95001080,
        name: 'Record Rubies',
        amount: 10,
        type: ItemType.Common,
      },
      {
        id: 40000074,
        name: 'Lightning Crystal',
        amount: 4,
        type: ItemType.Orb,
      },
      {
        id: 130100300,
        name: 'Spirit Mote (5★)',
        amount: 20,
        type: ItemType.Mote,
      },
    ],
  },
};
const fftTormentWorld: World = {
  id: 150486,
  name: 'Tyranny of the Impure (FF T)',
  category: 3,
  openedAt: 1531357200,
  closedAt: 2145938400,
  seriesId: 150001,
  isUnlocked: true,
};
const ff8D280TormentDungeon: Dungeon = {
  name: 'Putrid Malice, Part 2',
  id: 10830602,
  seriesId: 108001,
  difficulty: 280,
  openedAt: 1536800400,
  closedAt: 2145945599,
  isUnlocked: true,
  isComplete: true,
  isMaster: true,
  totalStamina: 1,
  staminaList: [1],
  prizes: {
    completion: [
      {
        id: 92000000,
        name: 'Gil',
        amount: 1500,
        type: ItemType.Common,
      },
    ],
    firstTime: [
      {
        id: 25096005,
        name: 'Dark Matter (5★)',
        amount: 3,
        type: ItemType.DarkMatter,
      },
      {
        id: 92000000,
        name: 'Gil',
        amount: 150000,
        type: ItemType.Common,
      },
      {
        id: 91000000,
        name: 'Mythril',
        amount: 1,
        type: ItemType.Common,
      },
    ],
    mastery: [
      {
        id: 92000000,
        name: 'Gil',
        amount: 150000,
        type: ItemType.Common,
      },
      {
        id: 40000075,
        name: 'Earth Crystal',
        amount: 4,
        type: ItemType.Orb,
      },
      {
        id: 40000040,
        name: 'Major Ice Orb',
        amount: 10,
        type: ItemType.Orb,
      },
    ],
    claimedGrade: [
      {
        id: 130400300,
        name: 'Wisdom Mote (5★)',
        amount: 30,
        type: ItemType.Mote,
      },
      {
        id: 92000000,
        name: 'Gil',
        amount: 150000,
        type: ItemType.Common,
      },
      {
        id: 130400300,
        name: 'Wisdom Mote (5★)',
        amount: 30,
        type: ItemType.Mote,
      },
      {
        id: 92000000,
        name: 'Gil',
        amount: 150000,
        type: ItemType.Common,
      },
      {
        id: 95001080,
        name: 'Record Rubies',
        amount: 30,
        type: ItemType.Common,
      },
      {
        id: 130400300,
        name: 'Wisdom Mote (5★)',
        amount: 20,
        type: ItemType.Mote,
      },
      {
        id: 95001080,
        name: 'Record Rubies',
        amount: 30,
        type: ItemType.Common,
      },
      {
        id: 40000072,
        name: 'Fire Crystal',
        amount: 2,
        type: ItemType.Orb,
      },
      {
        id: 130400300,
        name: 'Wisdom Mote (5★)',
        amount: 10,
        type: ItemType.Mote,
      },
      {
        id: 95001080,
        name: 'Record Rubies',
        amount: 10,
        type: ItemType.Common,
      },
      {
        id: 40000072,
        name: 'Fire Crystal',
        amount: 2,
        type: ItemType.Orb,
      },
      {
        id: 130400300,
        name: 'Wisdom Mote (5★)',
        amount: 10,
        type: ItemType.Mote,
      },
      {
        id: 95001080,
        name: 'Record Rubies',
        amount: 10,
        type: ItemType.Common,
      },
      {
        id: 40000072,
        name: 'Fire Crystal',
        amount: 2,
        type: ItemType.Orb,
      },
      {
        id: 130400300,
        name: 'Wisdom Mote (5★)',
        amount: 10,
        type: ItemType.Mote,
      },
      {
        id: 95001080,
        name: 'Record Rubies',
        amount: 10,
        type: ItemType.Common,
      },
      {
        id: 40000072,
        name: 'Fire Crystal',
        amount: 2,
        type: ItemType.Orb,
      },
      {
        id: 130400300,
        name: 'Wisdom Mote (5★)',
        amount: 10,
        type: ItemType.Mote,
      },
      {
        id: 95001080,
        name: 'Record Rubies',
        amount: 10,
        type: ItemType.Common,
      },
      {
        id: 40000072,
        name: 'Fire Crystal',
        amount: 2,
        type: ItemType.Orb,
      },
      {
        id: 130400300,
        name: 'Wisdom Mote (5★)',
        amount: 20,
        type: ItemType.Mote,
      },
      {
        id: 95001080,
        name: 'Record Rubies',
        amount: 30,
        type: ItemType.Common,
      },
    ],
    unclaimedGrade: [
      {
        id: 95001080,
        name: 'Record Rubies',
        amount: 30,
        type: ItemType.Common,
      },
    ],
  },
};
const ff8TormentWorld: World = {
  id: 108306,
  name: 'Putrid Malice (FF VIII)',
  category: 3,
  openedAt: 1536800400,
  closedAt: 2145945599,
  seriesId: 108001,
  isUnlocked: true,
};

describe('actions/dungeonScores', () => {
  describe('estimateScore', () => {
    it('estimates an incomplete Torment', () => {
      const estimatedScore = estimateScore(fftDUnknownTormentDungeon, fftTormentWorld);

      expect(estimatedScore).toEqual({
        type: DungeonScoreType.PERCENT_HP_OR_CLEAR_TIME,
        maxHp: 2000000,
        totalDamage: 1400000,
        won: false,
      });

      if (!estimatedScore) {
        return;
      }

      expect(formatEstimatedScore(estimatedScore)).toEqual('≥70%');
    });

    it('estimates a completed Torment', () => {
      const estimatedScore = estimateScore(ff8D280TormentDungeon, ff8TormentWorld);

      expect(estimatedScore).toEqual({
        type: DungeonScoreType.PERCENT_HP_OR_CLEAR_TIME,
        time: 40000,
        maxHp: 1000000,
        totalDamage: 1000000,
        won: true,
      });

      if (!estimatedScore) {
        return;
      }

      expect(formatEstimatedScore(estimatedScore)).toEqual('≤40.00');
    });
  });

  describe('formatScore', () => {
    it('shows HP percent for incomplete Torments', () => {
      const score = {
        type: DungeonScoreType.PERCENT_HP_OR_CLEAR_TIME,
        maxHp: 2000000,
        time: 35355,
        totalDamage: 1432340,
        won: false,
      };
      expect(formatScore(score)).toEqual('71%');
    });

    it('shows time for completed Torments', () => {
      const score = {
        type: DungeonScoreType.PERCENT_HP_OR_CLEAR_TIME,
        maxHp: 1000000,
        time: 22683,
        totalDamage: 1000000,
        won: true,
      };
      expect(formatScore(score)).toEqual('22.68');
    });

    it('handles damage races like Bomb Brigade', () => {
      const score = {
        type: DungeonScoreType.TOTAL_DAMAGE,
        totalDamage: 460895,
        won: true,
      };
      expect(formatScore(score)).toEqual('460,895 HP');
    });

    it('handles slow magicite wins', () => {
      const score = {
        type: DungeonScoreType.CLEAR_TIME,
        time: 60 * 1000 + 2345,
        won: true,
      };
      expect(formatScore(score)).toEqual('1:02.34');
    });
  });
});
