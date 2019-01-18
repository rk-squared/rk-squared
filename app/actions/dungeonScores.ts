import { createAction } from 'typesafe-actions';

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
