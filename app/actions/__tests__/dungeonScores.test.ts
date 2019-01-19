import { DungeonScoreType, formatScore } from '../dungeonScores';

describe('actions/dungeonScores', () => {
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
