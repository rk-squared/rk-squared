import { sprintf } from 'sprintf-js';
import { createAction } from 'typesafe-actions';

import { Difficulty, Dungeon } from './dungeons';
import { World, WorldCategory } from './worlds';

import * as _ from 'lodash';
import { EnlirElement } from '../data/enlir';

export enum DungeonScoreType {
  ClearTime = 1,
  PercentHpOrClearTime = 2,
  TotalDamage = 3,
}

export interface DungeonScore {
  type: DungeonScoreType;
  time?: number;
  totalDamage?: number;
  maxHp?: number;
  won: boolean;
}

type PrizeList = Array<[number, number]>;

function estimateScoreFromPrizeList(
  maxHp: number,
  timePrizes: PrizeList,
  percentPrizes: PrizeList,
  unclaimed: number,
) {
  let totalSeen = 0;
  for (const [time, count] of timePrizes) {
    if (totalSeen === unclaimed) {
      return {
        type: DungeonScoreType.PercentHpOrClearTime,
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
        type: DungeonScoreType.PercentHpOrClearTime,
        won: false,
        maxHp,
        totalDamage: (maxHp * percent) / 100,
      };
    }
    totalSeen += count;
  }

  return null;
}

/**
 * Estimates a dungeon score by looking at its completion status.
 *
 * For Torment dungeons in particular, we can look at grade prizes and estimate
 * a score based on that.
 */
function estimateTormentScore(dungeon: Dungeon, world: World): DungeonScore | null {
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
  // Prizes: 1 or 2 (D???) for sub 30, 2 each for sub 40 and 50, 1 or 2 (D???)
  // for 1 minute. Initial rewards were for 50% HP or above: 2 (D240) or 3 for
  // victory, 3 each for 90%, 80%, 70%, 60%, 2 for 50%. An update added rewards
  // for 10% HP or above: 3 each for 40%, 30%, 20%, 10%.
  const timePrizes: PrizeList = [[30, 1], [40, 2], [50, 2], [60, 1]];
  const percentPrizes50: PrizeList = [[100, 3], [90, 3], [80, 3], [70, 3], [60, 3], [50, 2]];
  const percentPrizes10: PrizeList = [[40, 3], [30, 3], [20, 3], [10, 3]];
  if (dungeon.difficulty === Difficulty.Torment1) {
    percentPrizes50[0][1]--;
  }
  if (dungeon.difficulty === 0 || dungeon.difficulty === Difficulty.Torment3) {
    timePrizes[0][1]++;
    timePrizes[timePrizes.length - 1][1]++;
  }

  // Check whether we're using the old or new prize list, and do a sanity check
  // for unexpected prizes.
  const prizeCount = (prizes: PrizeList) => _.sum(prizes.map(i => i[1]));
  const totalPrizeCount50 = prizeCount(timePrizes) + prizeCount(percentPrizes50);
  const totalPrizeCount10 = totalPrizeCount50 + prizeCount(percentPrizes10);
  let percentPrizes: PrizeList;
  if (totalPrizeCount50 === claimed + unclaimed) {
    percentPrizes = percentPrizes50;
  } else if (totalPrizeCount10 === claimed + unclaimed) {
    percentPrizes = [...percentPrizes50, ...percentPrizes10];
  } else {
    return null;
  }

  // These numbers don't apply to every torment, but they're close enough.
  const maxHpByDifficulty: { [difficulty: number]: number } = {
    [Difficulty.Torment1]: 6e5,
    [Difficulty.Torment2]: 1e6,
    [Difficulty.Torment3]: 1e6,
    0: 2e6,
  };
  const maxHp = maxHpByDifficulty[dungeon.difficulty] || maxHpByDifficulty[0];

  return estimateScoreFromPrizeList(maxHp, timePrizes, percentPrizes, unclaimed);
}

/**
 * Similar to estimateTormentScore - estimate the completion of a Dreambreaker
 * dungeon by looking at grade prizes.
 *
 * We could consolidate with estimateTormentScore (especially if we remove that
 * function's logic for old torment data).
 */
function estimateDreambreakerScore(dungeon: Dungeon, world: World): DungeonScore | null {
  if (world.category !== WorldCategory.Dreambreaker) {
    return null;
  }

  if (!dungeon.prizes.claimedGrade || !dungeon.prizes.unclaimedGrade) {
    return null;
  }
  const claimed = dungeon.prizes.claimedGrade.length;
  const unclaimed = dungeon.prizes.unclaimedGrade.length;

  // Count the number of prizes claimed vs. expected, and use that to estimate
  // completion status.  Hard-code the number of prizes, as we do for
  // estimateTormentScore.
  const timePrizes: PrizeList = [[30, 3], [40, 3], [50, 3], [60, 3]];
  const percentPrizes: PrizeList = [
    [100, 6],
    [90, 3],
    [80, 4],
    [70, 3],
    [60, 4],
    [50, 3],
    [40, 4],
    [30, 3],
    [20, 4],
    [10, 3],
  ];

  // Do a sanity check for unexpected prizes.
  const prizeCount = (prizes: PrizeList) => _.sum(prizes.map(i => i[1]));
  const totalPrizeCount = prizeCount(timePrizes) + prizeCount(percentPrizes);
  if (totalPrizeCount !== claimed + unclaimed) {
    return null;
  }

  // Ultima Weapon (FF7) has more.
  const maxHp = 4.5e6;

  return estimateScoreFromPrizeList(maxHp, timePrizes, percentPrizes, unclaimed);
}

export function estimateScore(dungeon: Dungeon, world: World): DungeonScore | null {
  return estimateTormentScore(dungeon, world) || estimateDreambreakerScore(dungeon, world);
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
    case DungeonScoreType.ClearTime:
      return formatTime(score.time);

    case DungeonScoreType.TotalDamage:
      return formatDamage(score.totalDamage);

    case DungeonScoreType.PercentHpOrClearTime:
      return score.won ? formatTime(score.time) : formatPercent(score.totalDamage, score.maxHp);
  }
}

export function formatEstimatedScore(score: DungeonScore): string {
  const maybe = (op: string, result: string) => (result ? op + result : result);
  switch (score.type) {
    case DungeonScoreType.ClearTime:
      return maybe('≤', formatTime(score.time));

    case DungeonScoreType.TotalDamage:
      return maybe('≥', formatTime(score.totalDamage));

    case DungeonScoreType.PercentHpOrClearTime: {
      return score.won
        ? maybe('≤', formatTime(score.time))
        : maybe('≥', formatPercent(score.totalDamage, score.maxHp));
    }
  }
}

export function compareScore(scoreA: DungeonScore, scoreB: DungeonScore): number {
  if (scoreA.type !== scoreB.type) {
    // Arguably a precondition violation...
    return 0;
  }

  // Returns 1, 0, or -1, if f indicates that a is better, equal to, or worse than b.
  type Op<T> = (a: T, b: T) => boolean;
  const compare = (
    f: Op<number>,
    a: number | undefined,
    b: number | undefined,
    precision?: number,
  ): number => {
    if (b == null) {
      return 1;
    } else if (a == null) {
      return -1;
    }
    if (precision) {
      a -= a % precision;
      b -= b % precision;
    }
    if (a === b) {
      return 0;
    } else {
      return f(a, b) ? 1 : -1;
    }
  };

  switch (scoreA.type) {
    case DungeonScoreType.ClearTime:
      return compare(_.lt, scoreA.time, scoreB.time);
    case DungeonScoreType.TotalDamage:
      return compare(_.gt, scoreA.totalDamage, scoreB.totalDamage);
    case DungeonScoreType.PercentHpOrClearTime:
      if (scoreA.won && !scoreB.won) {
        return 1;
      } else if (scoreA.won) {
        return compare(_.lt, scoreA.time, scoreB.time, 10);
      } else {
        return compare(_.gt, scoreA.totalDamage, scoreB.totalDamage);
      }
  }
}

export function isScoreBetterThan(scoreA: DungeonScore, scoreB: DungeonScore): boolean {
  return compareScore(scoreA, scoreB) > 0;
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
  } else {
    return isScoreBetterThan(estimatedScore, score);
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

export const updateDungeonScore = createAction(
  'UPDATE_DUNGEON_SCORE',
  (dungeonId: number, newScore: DungeonScore) => ({
    type: 'UPDATE_DUNGEON_SCORE',
    payload: {
      dungeonId,
      newScore,
    },
  }),
);

export const updateDungeonElementScore = createAction(
  'UPDATE_DUNGEON_ELEMENT_SCORE',
  (dungeonId: number, element: EnlirElement, newScore: DungeonScore) => ({
    type: 'UPDATE_DUNGEON_ELEMENT_SCORE',
    payload: {
      dungeonId,
      element,
      newScore,
    },
  }),
);

export type DungeonScoresAction = ReturnType<
  typeof setDungeonScore | typeof updateDungeonScore | typeof updateDungeonElementScore
>;
