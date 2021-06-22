import produce from 'immer';
import { getType } from 'typesafe-actions';
import {
  clearLabyrinthChests,
  setLabyrinthChests,
  setLabyrinthPaintings,
  LabyrinthAction,
  LabyrinthPainting,
} from '../actions/labyrinth';

export interface LabyrinthState {
  chests?: number[];
  paintings?: LabyrinthPainting[];
  remaining?: number;
}

export function labyrinth(state: LabyrinthState = {}, action: LabyrinthAction): LabyrinthState {
  return produce(state, (draft: LabyrinthState) => {
    switch (action.type) {
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
