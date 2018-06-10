import { createAction } from 'typesafe-actions';
import { Character } from './characters';

import * as _ from 'lodash';

export type Step = 1 | 2 | 3 | 4;
export type Order = '1' | '1a' | '1b' | '2' | '3';

export enum RecordMateriaStatus {
  Unobtained,           // Unobtained (unknown reason)
  LockedLowLevel,       // Locked due to level or level cap too low
  LockedMissingPrereq,  // Locked due to missing prerequisite
  Unlocked,             // Unlocked but not yet collected
  Collected,            // Collected / obtained and in inventory
  Favorite,             // Collected, in inventory, and starred
  Vault,                // Collected and stashed in vault
}

export const statusDescription = {
  [RecordMateriaStatus.Unobtained]: 'Unobtained',
  [RecordMateriaStatus.LockedLowLevel]: 'Low level',
  [RecordMateriaStatus.LockedMissingPrereq]: 'Missing prev.',
  [RecordMateriaStatus.Unlocked]: 'Unlocked',
  [RecordMateriaStatus.Collected]: 'Collected',
  [RecordMateriaStatus.Favorite]: 'Favorite',
  [RecordMateriaStatus.Vault]: 'Vault',
};

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
  prereqs?: number[];  // IDs of prerequisite record materia
}

/**
 * Record materia, including calculated values
 */
export interface RecordMateriaDetail extends RecordMateria {
  status: RecordMateriaStatus;
}

function isLowLevel(recordMateria: RecordMateria, character: Character) {
  switch (recordMateria.order) {
    case '1':
    case '1a':
    case '1b':
      return character.levelCap <= 50;
    case '2':
      return character.levelCap <= 65;
    case '3':
      return character.level < 99;
  }
}

export function getStatus(recordMateria: RecordMateria, character: Character | undefined,
                          allRecordMateria: { [id: number]: RecordMateria }) {
  if (recordMateria.obtained) {
    return RecordMateriaStatus.Collected;
  } else if (!character) {
    return RecordMateriaStatus.Unobtained;
  } else if (isLowLevel(recordMateria, character)) {
    return RecordMateriaStatus.LockedLowLevel;
  } else if (_.find(recordMateria.prereqs, i => !allRecordMateria[i].obtained)) {
    return RecordMateriaStatus.LockedMissingPrereq;
  } else {
    return RecordMateriaStatus.Unlocked;
  }
}

export function getRecordMateriaDetail(
  recordMateria: { [id: number]: RecordMateria },
  characters: { [id: number]: Character }
): { [id: number]: RecordMateriaDetail } {
  return _.mapValues(recordMateria, i => ({
    ...i,
    status: getStatus(i, characters[i.characterId], recordMateria)
  }));
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
