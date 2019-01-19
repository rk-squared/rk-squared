import { createAction } from 'typesafe-actions';

import { sprintf } from 'sprintf-js';

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
