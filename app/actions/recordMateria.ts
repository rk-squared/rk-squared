import { createAction } from 'typesafe-actions';

export type Step = 1 | 2 | 3 | 4;
export type Order = '1' | '1a' | '1b' | '2' | '3';

export enum RecordMateriaStatus {
  LockedLowLevel,       // Locked due to level or level cap too low
  LockedMissingPrereq,  // Locked due to missing prerequisite
  Unlocked,             // Unlocked but not yet collected
  Collected,            // Collected / obtained and in inventory
  Favorite,             // Collected, in inventory, and starred
  Vault,                // Collected and stashed in vault
}

export interface RecordMateria {
  name: string;
  id: number;
  description: string;
  condition: string;
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
