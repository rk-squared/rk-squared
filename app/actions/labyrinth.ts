import { createAction } from 'typesafe-actions';
import { BattleTips } from '../data/strategy';

export interface LabyrinthPainting {
  id: number;
  name: string;
  combat?: {
    name: string;
    message: string;
    tips: BattleTips[];
  };
}

export const setLabyrinthChests = createAction('SET_LABYRINTH_CHESTS', (chests: number[]) => ({
  type: 'SET_LABYRINTH_CHESTS',
  payload: chests,
}));

export const clearLabyrinthChests = createAction('CLEAR_LABYRINTH_CHESTS', () => ({
  type: 'CLEAR_LABYRINTH_CHESTS',
}));

export const setLabyrinthPaintings = createAction(
  'SET_LABYRINTH_PAINTINGS',
  (paintings: LabyrinthPainting[]) => ({
    type: 'SET_LABYRINTH_PAINTINGS',
    payload: paintings,
  }),
);

export type LabyrinthAction = ReturnType<
  typeof setLabyrinthChests | typeof clearLabyrinthChests | typeof setLabyrinthPaintings
>;
