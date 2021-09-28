import { createAction } from 'typesafe-actions';
import { BattleTips } from '../data/strategy';
import { DisplayPaintingId } from '../api/schemas/labyrinth';

export interface LabyrinthCombat {
  name: string;
  difficulty: number;
  imageUrl?: string; // A full URL
  message: string;
  tips: BattleTips[];
  dungeonId: number;
}

export interface LabyrinthPainting {
  id: DisplayPaintingId;
  name: string;
  number: number;
  combat?: LabyrinthCombat;
}

export interface LabyrinthParty {
  no: number;
  buddies: [string];
}

export const setLabyrinthCombat = createAction(
  'SET_LABYRINTH_COMBAT',
  (combat: LabyrinthCombat) => ({
    type: 'SET_LABYRINTH_COMBAT',
    payload: combat,
  }),
);

export const clearLabyrinthCombat = createAction('CLEAR_LABYRINTH_COMBAT', () => ({
  type: 'CLEAR_LABYRINTH_COMBAT',
}));

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

export const setLabyrinthParties = createAction(
  'SET_LABYRINTH_PARTIES',
  (parties: LabyrinthParty[]) => ({
    type: 'SET_LABYRINTH_PARTIES',
    payload: parties,
  }),
);

export const setLabyrinthPartyFatigues = createAction(
  'SET_LABYRINTH_PARTY_FATIGUES',
  (fatigues: Record<string, number>) => ({
    type: 'SET_LABYRINTH_PARTY_FATIGUES',
    payload: fatigues,
  }),
);

export const clearLabyrinthPartyFatigues = createAction('CLEAR_LABYRINTH_PARTY_FATIGUES', () => ({
  type: 'CLEAR_LABYRINTH_PARTY_FATIGUES',
}));

export const setLabyrinthDungeon = createAction(
  'SET_LABYRINTH_DUNGEON',
  (dungeonId: number) => ({
    type: 'SET_LABYRINTH_DUNGEON',
    payload: dungeonId,
  }),
);

export type LabyrinthAction = ReturnType<
  | typeof setLabyrinthCombat
  | typeof clearLabyrinthCombat
  | typeof setLabyrinthChests
  | typeof clearLabyrinthChests
  | typeof setLabyrinthPaintings
  | typeof setLabyrinthParties
  | typeof setLabyrinthDungeon
  | typeof setLabyrinthPartyFatigues
  | typeof clearLabyrinthPartyFatigues
>;
