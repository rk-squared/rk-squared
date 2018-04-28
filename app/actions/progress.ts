import { createAction } from 'typesafe-actions';

export interface Progress {
  current: number;
  max: number;
}

export const setProgress = createAction('SET_PROGRESS', (key: string, progress?: Progress) => ({
  type: 'SET_PROGRESS',
  payload: {
    key,
    progress
  }
}));

export type ProgressAction = ReturnType<typeof setProgress>;
