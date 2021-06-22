import { createAction } from 'typesafe-actions';
import { BattleTips } from '../data/strategy';
import { DisplayPaintingId } from '../api/schemas/labyrinth';

export interface LabyrinthCombat {
  name: string;
  difficulty: number;
  imageUrl?: string; // A full URL
  message: string;
  tips: BattleTips[];
}

export interface LabyrinthPainting {
  id: DisplayPaintingId;
  name: string;
  number: number;
  combat?: LabyrinthCombat;
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
  (paintings: LabyrinthPainting[], remaining: number) => ({
    type: 'SET_LABYRINTH_PAINTINGS',
    payload: { paintings, remaining },
  }),
);

export type LabyrinthAction = ReturnType<
  typeof setLabyrinthChests | typeof clearLabyrinthChests | typeof setLabyrinthPaintings
>;
