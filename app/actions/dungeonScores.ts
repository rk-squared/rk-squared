import { sprintf } from 'sprintf-js';
import { createAction } from 'typesafe-actions';

import { Dungeon } from './dungeons';
import { World, WorldCategory } from './worlds';

import * as _ from 'lodash';

export enum DungeonScoreType {
  CLEAR_TIME = 1,
  PERCENT_HP_OR_CLEAR_TIME = 2,
  TOTAL_DAMAGE = 3,
}

export interface DungeonScore {
  type: DungeonScoreType;
  time?: number;
  totalDamage?: number;
  maxHp?: number;
  won: boolean;
}

/**
 * Estimates a dungeon score by looking at its completion status.
 *
 * For Torment dungeons in particular, we can look at grade prizes and estimate
 * a score based on that.
 */
export function estimateScore(dungeon: Dungeon, world: World): DungeonScore | null {
  if (world.category !== WorldCategory.Torment) {
    return null;
  }

  if (!dungeon.prizes.claimedGrade || !dungeon.prizes.unclaimedGrade) {
    return null;
  }
  const claimed = dungeon.prizes.claimedGrade.length;
  const unclaimed = dungeon.prizes.unclaimedGrade.length;

  // Count the number of prizes claimed vs. expected, and use that to estimate
  // completion status.
  //
  // Hack: We hard-code the number of prizes expected.  (FFRK doesn't provide a
  // machine-readable list of prizes.  We didn't want to parse the string
  // descriptions that it does provide, and we haven't necessarily saved them
  // and don't want to make the user re-scan dungeons to get them.)
  //
  // Prizes: 1 or 2 (D???) for sub 30, 2 each for sub 40 and 50, 1 or 2 (D???) for 1 minute
  // 2 (D240) or 3 for victory, 3 each for 90%, 80%, 70%, 60%, 2 for 50%
  const timePrizes = [[30, 1], [40, 2], [50, 2], [60, 1]];
  const percentPrizes = [[100, 3], [90, 3], [80, 3], [70, 3], [60, 3], [50, 2]];
  if (dungeon.difficulty === 240) {
    percentPrizes[0][1]--;
  }
  if (dungeon.difficulty === 0) {
    timePrizes[0][1]++;
    timePrizes[timePrizes.length - 1][1]++;
  }

  // Safety check for unexpected rewards
  const totalPrizeCount = _.sum(timePrizes.map(i => i[1])) + _.sum(percentPrizes.map(i => i[1]));
  if (totalPrizeCount !== claimed + unclaimed) {
    return null;
  }

  // These numbers don't apply to every torment, but they're close enough.
  const maxHpByDifficulty: { [difficulty: number]: number } = {
    240: 6e5,
    280: 1e6,
    0: 2e6,
  };
  const maxHp = maxHpByDifficulty[dungeon.difficulty] || maxHpByDifficulty[0];

  let totalSeen = 0;
  for (const [time, count] of timePrizes) {
    if (totalSeen === unclaimed) {
      return {
        type: DungeonScoreType.PERCENT_HP_OR_CLEAR_TIME,
        won: true,
        time: time * 1000,
        maxHp,
        totalDamage: maxHp,
      };
    }
    totalSeen += count;
  }
  for (const [percent, count] of percentPrizes) {
    if (totalSeen === unclaimed) {
      return {
        type: DungeonScoreType.PERCENT_HP_OR_CLEAR_TIME,
        won: false,
        maxHp,
        totalDamage: (maxHp * percent) / 100,
      };
    }
    totalSeen += count;
  }

  return null;
}

export function isSub30(score: DungeonScore): boolean {
  // FFRK shows hundredths of seconds but manipulates milliseconds, and I
  // *think* it truncates down to hundredth...
  return score.won && score.time != null && score.time < 30 * 1000 + 10;
}

function formatTime(time?: number): string {
  if (time == null) {
    return '';
  }
  const hundredths = Math.floor((time % 1000) / 10);
  const seconds = Math.floor((time / 1000) % 60);
  const minutes = Math.floor(time / 1000 / 60);
  if (minutes) {
    return sprintf('%i:%02i.%02i', minutes, seconds, hundredths);
  } else {
    return sprintf('%02i.%02i', seconds, hundredths);
  }
}

function formatDamage(totalDamage?: number): string {
  return totalDamage == null ? '' : `${totalDamage.toLocaleString()} HP`;
}

function formatPercent(totalDamage?: number, maxHp?: number): string {
  if (totalDamage == null || !maxHp) {
    return '';
  } else {
    return Math.floor((totalDamage / maxHp) * 100) + '%';
  }
}

export function formatScore(score: DungeonScore): string {
  switch (score.type) {
    case DungeonScoreType.CLEAR_TIME:
      return formatTime(score.time);

    case DungeonScoreType.TOTAL_DAMAGE:
      return formatDamage(score.totalDamage);

    case DungeonScoreType.PERCENT_HP_OR_CLEAR_TIME:
      return score.won ? formatTime(score.time) : formatPercent(score.totalDamage, score.maxHp);
  }
}

export function formatEstimatedScore(score: DungeonScore): string {
  const maybe = (op: string, result: string) => (result ? op + result : result);
  switch (score.type) {
    case DungeonScoreType.CLEAR_TIME:
      return maybe('≤', formatTime(score.time));

    case DungeonScoreType.TOTAL_DAMAGE:
      return maybe('≥', formatTime(score.totalDamage));

    case DungeonScoreType.PERCENT_HP_OR_CLEAR_TIME: {
      return score.won
        ? maybe('≤', formatTime(score.time))
        : maybe('≥', formatPercent(score.totalDamage, score.maxHp));
    }
  }
}

export function shouldUseEstimatedScore(
  score: DungeonScore | undefined,
  estimatedScore: DungeonScore | undefined,
): boolean {
  if (!estimatedScore) {
    return false;
  } else if (!score) {
    return true;
  } else if (estimatedScore.type !== score.type) {
    return false;
  }

  type Op<T> = (a: T, b: T) => boolean;
  const isEstimatedBetter = (f: Op<number>, a: number | undefined, b: number | undefined) => {
    if (b == null) {
      return false;
    } else if (a == null) {
      return true;
    } else {
      return a !== b && !f(a, b);
    }
  };

  switch (score.type) {
    case DungeonScoreType.CLEAR_TIME:
      return isEstimatedBetter(_.lt, score.time, estimatedScore.time);
    case DungeonScoreType.TOTAL_DAMAGE:
      return isEstimatedBetter(_.gt, score.totalDamage, estimatedScore.totalDamage);
    case DungeonScoreType.PERCENT_HP_OR_CLEAR_TIME:
      if (score.won && !estimatedScore.won) {
        return false;
      } else if (score.won) {
        return isEstimatedBetter(_.lt, score.time, estimatedScore.time);
      } else {
        return isEstimatedBetter(_.gt, score.totalDamage, estimatedScore.totalDamage);
      }
  }
}

export const setDungeonScore = createAction(
  'SET_DUNGEON_SCORE',
  (dungeonId: number, score: DungeonScore) => ({
    type: 'SET_DUNGEON_SCORE',
    payload: {
      dungeonId,
      score,
    },
  }),
);

export type DungeonScoresAction = ReturnType<typeof setDungeonScore>;
