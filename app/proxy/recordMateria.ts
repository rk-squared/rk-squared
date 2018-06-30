/**
 * @file
 * Support for tracking record materia
 */

import { Store } from 'redux';

import * as schemas from '../api/schemas';
import * as charactersSchemas from '../api/schemas/characters';
import * as recordMateriaSchemas from '../api/schemas/recordMateria';
import { Handler } from './types';

import { IState } from '../reducers';

import {
  obtainRecordMateria,
  Order,
  RecordMateria,
  setRecordMateria,
  setRecordMateriaInventory,
  Step,
  updateRecordMateriaInventory
} from '../actions/recordMateria';
import { SeriesId } from '../data/series';

import * as _ from 'lodash';

// FIXME: What's the best place to log these?  Use the console for now.
// tslint:disable no-console

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
    result[id].prereqs = byCharacter[buddy_id].slice(0, result[id].step - 1);
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
      seriesId: i.buddy_series_id as SeriesId,
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

// noinspection JSUnusedGlobalSymbols
const recordMateria: Handler = {
  'get_released_record_materia_list'(data: schemas.ReleasedRecordMateriaList, store: Store<IState>) {
    store.dispatch(setRecordMateria(convertRecordMateriaList(data)));
  },

  'party/list'(data: schemas.PartyList, store: Store<IState>) {
    store.dispatch(setRecordMateriaInventory(
      _.map(data.record_materias, i => i.id),
      _.map(_.filter(data.record_materias, i => i.is_favorite), i => i.id),
    ));
  },

  'set_favorite_record_materia'(data: recordMateriaSchemas.SetFavoriteRecordMateria, store: Store<IState>,
                                query?: any, requestBody?: any) {
    if (typeof(requestBody) !== 'object' || !requestBody.id_to_flag) {
      console.warn(`Unknown POST request for set_favorite_record_materia: ${requestBody}`);
      return;
    }
    const post = requestBody as recordMateriaSchemas.SetFavoriteRecordMateriaPost;
    _.forEach(post.id_to_flag, (value, id) => {
      store.dispatch(updateRecordMateriaInventory(+id, { favorite: !!value }));
    });
  },

  'win_battle'(data: schemas.WinBattle, store: Store<IState>) {
    const obtainedIds = _.map(
      _.filter(data.result.prize_master, i => i.type_name === 'RECORD_MATERIA'),
        i => +i.item_id
    );
    store.dispatch(obtainRecordMateria(obtainedIds));
  },

  'warehouse/store_record_materias'(data: schemas.WarehouseStoreRecordMaterias, store: Store<IState>,
                                    query?: any, requestBody?: any) {
    if (typeof(requestBody) !== 'object' || !requestBody.ids) {
      console.warn(`Unknown POST request for warehouse/store_record_materias: ${requestBody}`);
      return;
    }
    const post = requestBody as schemas.WarehouseStoreRecordMateriasPost;
    _.forEach(post.ids, id => {
      store.dispatch(updateRecordMateriaInventory(id, { inventory: false }));
    });
  },

  'warehouse/bring_record_materias'(data: schemas.WarehouseBringRecordMaterias, store: Store<IState>,
                                    query?: any, requestBody?: any) {
    if (typeof(requestBody) !== 'object' || !requestBody.ids) {
      console.warn(`Unknown POST request for warehouse/bring_record_materias: ${requestBody}`);
      return;
    }
    const post = requestBody as schemas.WarehouseBringRecordMateriasPost;
    _.forEach(post.ids, id => {
      store.dispatch(updateRecordMateriaInventory(id, { inventory: true }));
    });
  },

  'buddy/evolve'(data: charactersSchemas.BuddyEvolve, store: Store<IState>, query?: any, requestBody?: any) {
    if (typeof(requestBody) !== 'object' || requestBody.exec == null) {
      console.warn(`Unknown POST request for buddy/evolve: ${requestBody}`);
      return;
    }
    const post = requestBody as charactersSchemas.BuddyEvolvePost;

    if (!post.exec) {
      return;
    }

    const execData = data as charactersSchemas.BuddyEvolveExec;
    if (execData.record_materia) {
      store.dispatch(updateRecordMateriaInventory(execData.record_materia.id, { inventory: true }));
    }
  },
};

export default recordMateria;
