/**
 * @file
 * Support for tracking record materia
 */

import { Store } from 'redux';

import * as schemas from '../api/schemas';
import { Handler } from './types';

import { IState } from '../reducers';

import { Order, RecordMateria, setRecordMateria, Step } from '../actions/recordMateria';

function determineOrder(data: schemas.ReleasedRecordMateriaList, result: { [id: number]: RecordMateria }) {
  const maxStep: { [id: number]: number } = {};
  for (const i of data.record_materias) {
    maxStep[i.id] = maxStep[i.id] ? i.step : Math.max(i.step, maxStep[i.id]);
  }

  const standardOrder: Order[] = [ '1', '2', '3' ];
  const abOrder: Order[] = [ '1a', '1b', '2', '3' ];

  for (const { id } of data.record_materias) {
    const thisOrder = maxStep[id] === 4 ? standardOrder : abOrder;
    result[id].order = thisOrder[result[id].step];
  }
}

function determineObtained(data: schemas.ReleasedRecordMateriaList, result: { [id: number]: RecordMateria }) {
  Object.keys(data.achieved_record_materia_map).forEach(i => result[+i].obtained = true);
}

function convertRecordMateriaList(data: schemas.ReleasedRecordMateriaList): { [id: number]: RecordMateria } {
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

  determineOrder(data, result);
  determineObtained(data, result);

  return result;
}

const recordMateria: Handler = {
  get_released_record_materia_list(data: schemas.ReleasedRecordMateriaList, store: Store<IState>) {
    store.dispatch(setRecordMateria(convertRecordMateriaList(data)));
  },

  // FIXME: Update record materia on winning a battle
};

export default recordMateria;
