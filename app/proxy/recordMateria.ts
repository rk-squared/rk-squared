/**
 * @file
 * Support for tracking record materia
 */

import { Store } from 'redux';

import * as schemas from '../api/schemas';
import * as recordMateriaSchemas from '../api/schemas/recordMateria';
import { Handler } from './types';

import { IState } from '../reducers';

import { Order, RecordMateria, setRecordMateria, Step } from '../actions/recordMateria';

interface MateriaIdsByCharacter {
  [characterId: number]: number[];
}

function sortRecordMateriaByCharacter(rawRecordMateria: recordMateriaSchemas.RecordMateria[]): MateriaIdsByCharacter {
  const result: { [characterId: number]: number[] } = [];
  for (const i of rawRecordMateria) {
    result[i.buddy_id] = result[i.buddy_id] || [];
    result[i.buddy_id][i.step - 1] = i.id;
  }
  return result;
}

function determineOrder(data: recordMateriaSchemas.ReleasedRecordMateriaList, byCharacter: MateriaIdsByCharacter,
                        result: { [id: number]: RecordMateria }) {
  const standardOrder: Order[] = [ '1', '2', '3' ];
  const abOrder: Order[] = [ '1a', '1b', '2', '3' ];

  for (const { id, buddy_id } of data.record_materias) {
    const thisOrder = byCharacter[buddy_id].length === 4 ? abOrder : standardOrder;
    result[id].order = thisOrder[result[id].step - 1];
  }
}

function determineObtained(data: schemas.ReleasedRecordMateriaList, byCharacter: MateriaIdsByCharacter,
                           result: { [id: number]: RecordMateria }) {
  Object.keys(data.achieved_record_materia_map).forEach(i => {
    const id = +i;
    result[id].obtained = true;

    // HACK: For characters with 4 RMs, the first RM may not be listed in
    // achieved_record_materia_map.  If any RM is obtained, then we can
    // assume that the previous RMs are obtained.
    for (const j of byCharacter[result[id].characterId]) {
      if (j === id) {
        break;
      }
      result[j].obtained = true;
    }
  });
}

export function convertRecordMateriaList(data: schemas.ReleasedRecordMateriaList): { [id: number]: RecordMateria } {
  const result: { [id: number]: RecordMateria } = {};

  for (const i of data.record_materias) {
    result[i.id] = {
      name: i.name,
      id: i.id,
      description: i.description,
      condition: i.cond_description,
      characterId: i.buddy_id,
      characterName: i.buddy_name,
      seriesId: i.buddy_series_id,
      step: i.step as Step,

      // Placeholders until fully processed
      obtained: false,
      order: '1',
    };
  }

  const byCharacter = sortRecordMateriaByCharacter(data.record_materias);

  determineOrder(data, byCharacter, result);
  determineObtained(data, byCharacter, result);

  return result;
}

const recordMateria: Handler = {
  get_released_record_materia_list(data: schemas.ReleasedRecordMateriaList, store: Store<IState>) {
    store.dispatch(setRecordMateria(convertRecordMateriaList(data)));
  },

  // FIXME: Update record materia on winning a battle
};

export default recordMateria;
