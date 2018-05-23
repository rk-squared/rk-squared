import { createAction } from 'typesafe-actions';

export type Step = 1 | 2 | 3 | 4;
export type Order = '1' | '1a' | '1b' | '2' | '3';

export interface RecordMateria {
  name: string;
  id: number;
  description: string;
  condition: string,
  characterId: number;
  characterName: string;
  seriesId: number;
  obtained: boolean;
  step: Step;
  order: Order;
}

export const setRecordMateria = createAction('SET_RECORD_MATERIA',
  (recordMateria: { [id: number]: RecordMateria }) => ({
    type: 'SET_RECORD_MATERIA',
    payload: {
      recordMateria
    }
  })
);

export type RecordMateriaAction = ReturnType<typeof setRecordMateria>;
