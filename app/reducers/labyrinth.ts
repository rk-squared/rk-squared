import produce from 'immer';
import { getType } from 'typesafe-actions';
import {
  clearLabyrinthCombat,
  clearLabyrinthChests,
  setLabyrinthCombat,
  setLabyrinthChests,
  setLabyrinthPaintings,
  LabyrinthAction,
  LabyrinthPainting,
  LabyrinthCombat,
} from '../actions/labyrinth';

export interface LabyrinthState {
  combat?: LabyrinthCombat;
  chests?: number[];
  paintings?: LabyrinthPainting[];
  remaining?: number;
}

export function labyrinth(state: LabyrinthState = {}, action: LabyrinthAction): LabyrinthState {
  return produce(state, (draft: LabyrinthState) => {
    switch (action.type) {
      case getType(setLabyrinthCombat):
        draft.combat = action.payload;
        return;
      case getType(clearLabyrinthCombat):
        delete draft.combat;
        return;
      case getType(setLabyrinthChests):
        draft.chests = action.payload;
        return;
      case getType(clearLabyrinthChests):
        delete draft.chests;
        return;
      case getType(setLabyrinthPaintings):
        draft.paintings = action.payload.paintings;
        draft.remaining = action.payload.remaining;
        return;
    }
  });
}
