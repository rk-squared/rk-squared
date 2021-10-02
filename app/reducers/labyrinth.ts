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
  setLabyrinthDungeon,
  LabyrinthParty,
  setLabyrinthPartyFatigues,
  setLabyrinthParties,
  clearLabyrinthPartyFatigues,
} from '../actions/labyrinth';
export interface LabyrinthState {
  combat?: LabyrinthCombat;
  chests?: number[];
  paintings?: LabyrinthPainting[];
  remaining?: number;
  floor?: number;
  parties?: LabyrinthParty[];
  fatigues?: Record<string, number>;
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
        draft.floor = action.payload.floor;
        return;
      case getType(setLabyrinthDungeon):
        {
          const painting = draft.paintings?.find(p => p.combat?.dungeonId === action.payload);
          draft.combat = painting && painting.combat;
        }
        return;
      case getType(setLabyrinthParties):
        draft.parties = action.payload;
        return;
      case getType(setLabyrinthPartyFatigues):
        draft.fatigues = action.payload;
        return;
      case getType(clearLabyrinthPartyFatigues):
        delete draft.fatigues;
        return;
    }
  });
}
