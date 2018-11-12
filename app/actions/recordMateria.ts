import { createAction } from 'typesafe-actions';

import { SeriesId } from '../data/series';
import { Character } from './characters';

import * as _ from 'lodash';

export type Step = 1 | 2 | 3 | 4;
export type Order = '1' | '1a' | '1b' | '2' | '3';

export enum RecordMateriaStatus {
  Unknown,              // Unknown materia, or unobtained for unknown reason (missing character info)
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

export function getStatus(
  recordMateria: RecordMateria,
  character: Character | undefined,
  prereqs: RecordMateria[],
  isInInventory: boolean | undefined,
  isFavorite: boolean | undefined,
): { status: RecordMateriaStatus, statusDescription: string } {
  let missingPrereq: RecordMateria | undefined;
  if (recordMateria.obtained) {
    if (!isInInventory) {
      return {
        status: RecordMateriaStatus.Vault,
        statusDescription: 'Vault',
      };
    } else if (isFavorite) {
      return {
        status: RecordMateriaStatus.Favorite,
        statusDescription: 'Favorite',
      };
    } else {
      return {
        status: RecordMateriaStatus.Collected,
        statusDescription: 'Collected',
      };
    }
  } else if (!character) {
    return {
      status: RecordMateriaStatus.Unknown,
      statusDescription: 'Unknown',
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
  characters: { [id: number]: Character },
  inventory?: { [id: number]: boolean },
  favorites?: { [id: number]: boolean },
): { [id: number]: RecordMateriaDetail } {
  return _.mapValues(recordMateria, i => {
    const isInInventory = inventory == null ? true : inventory[i.id];
    const isFavorite = favorites == null ? false : favorites[i.id];
    return {
      ...i,
      ...getStatus(i, characters[i.characterId], getPrereqs(i, recordMateria), isInInventory, isFavorite)
    };
  });
}

/// Sets the master list of all record materia
export const setRecordMateria = createAction('SET_RECORD_MATERIA',
  (recordMateria: { [id: number]: RecordMateria }) => ({
    type: 'SET_RECORD_MATERIA',
    payload: {
      recordMateria
    }
  })
);

/// Obtained one or more record materia (for example, from winning a battle)
export const obtainRecordMateria = createAction('OBTAIN_RECORD_MATERIA',
  (id: number | number[], updateInventory = true) => ({
    type: 'OBTAIN_RECORD_MATERIA',
    payload: {
      id,
      updateInventory
    }
  })
);

/// Sets the list of record materia currently in inventory and record materia favorites
export const setRecordMateriaInventory = createAction('SET_RECORD_MATERIA_INVENTORY',
  (inventory: number[], favorites: number[], warehouse: number[]) => ({
    type: 'SET_RECORD_MATERIA_INVENTORY',
    payload: {
      inventory,
      favorites,
      warehouse,
    }
  })
);

/// Updates a single record materia's inventory and favorite status
export const updateRecordMateriaInventory = createAction('UPDATE_RECORD_MATERIA_INVENTORY',
  (id: number, { inventory, favorite }: { inventory?: boolean, favorite?: boolean }) => ({
    type: 'UPDATE_RECORD_MATERIA_INVENTORY',
    payload: {
      id,
      inventory,
      favorite
    }
  })
);

export type RecordMateriaAction = ReturnType<
  typeof obtainRecordMateria |
  typeof setRecordMateria |
  typeof setRecordMateriaInventory |
  typeof updateRecordMateriaInventory
>;
