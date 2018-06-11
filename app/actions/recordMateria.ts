import { createAction } from 'typesafe-actions';

import { SeriesId } from '../data/series';
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

export interface RecordMateria {
  name: string;
  id: number;
  description: string;
  condition: string;
  characterId: number;
  characterName: string;
  seriesId: SeriesId;
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
  statusDescription: string;
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

function levelNeeded(orderOrRecordMateria: Order | RecordMateria) {
  const order = typeof(orderOrRecordMateria) === 'object' ? orderOrRecordMateria.order : orderOrRecordMateria;
  switch (order) {
    case '1':
    case '1a':
    case '1b':
      return 50;
    case '2':
      return 65;
    case '3':
      return 99;
  }
}

export function getStatus(recordMateria: RecordMateria, character: Character | undefined,
                          prereqs: RecordMateria[]): { status: RecordMateriaStatus, statusDescription: string } {
  let missingPrereq: RecordMateria | undefined;
  if (recordMateria.obtained) {
    return {
      status: RecordMateriaStatus.Collected,
      statusDescription: 'Collected',
    };
  } else if (!character) {
    return {
      status: RecordMateriaStatus.Unobtained,
      statusDescription: 'Unobtained',
    };
  } else if (isLowLevel(recordMateria, character)) {
    return {
      status: RecordMateriaStatus.LockedLowLevel,
      statusDescription: `Low level (${character.level}/${levelNeeded(recordMateria)})`,
    };
  } else if ((missingPrereq = _.find(prereqs, i => !i.obtained)) != null) {
    return {
      status: RecordMateriaStatus.LockedMissingPrereq,
      statusDescription: `Missing RM ${missingPrereq.order}`
    };
  } else {
    return {
      status: RecordMateriaStatus.Unlocked,
      statusDescription: 'Unlocked'
    };
  }
}

export function getPrereqs(recordMateria: RecordMateria, allRecordMateria: { [id: number]: RecordMateria }) {
  return _.map(recordMateria.prereqs, i => allRecordMateria[i]);
}

export function getRecordMateriaDetail(
  recordMateria: { [id: number]: RecordMateria },
  characters: { [id: number]: Character }
): { [id: number]: RecordMateriaDetail } {
  return _.mapValues(recordMateria, i => ({
    ...i,
    ...getStatus(i, characters[i.characterId], getPrereqs(i, recordMateria))
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
