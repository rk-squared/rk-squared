import { createAction } from 'typesafe-actions';

export const setCurrentTime = createAction('SET_CURRENT_TIME', (currentTime: number) => ({
  type: 'SET_CURRENT_TIME',
  payload: currentTime,
}));

export type TimeStateAction = ReturnType<typeof setCurrentTime>;
