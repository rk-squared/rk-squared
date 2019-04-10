/**
 * @file
 * Support for tracking characters
 */

import { Store } from 'redux';

import * as _ from 'lodash';

import {
  Character,
  ExpMap,
  InventoryType,
  setCharacter,
  setCharacters,
  setLegendMateria,
  setLegendMateriaExp,
  setLegendMateriaExpRequired,
  setSoulBreakExp,
  setSoulBreakExpRequired,
  setSoulBreaks,
  updateCharacter,
  updateLegendMateriaExp,
  updateSoulBreakExp,
} from '../actions/characters';
import * as schemas from '../api/schemas';
import * as charactersSchemas from '../api/schemas/characters';
import * as warehouseSchemas from '../api/schemas/warehouse';
import { IState } from '../reducers';
import { logger } from '../utils/logger';
import { Handler, HandlerRequest } from './common';

function convertCharacter(data: charactersSchemas.Buddy): Character {
  return {
    name: data.name,
    id: data.buddy_id,
    uniqueId: data.id,
    level: data.level,
    levelCap: data.level_max,
  };
}

export function convertCharacters(
  data: schemas.PartyList | schemas.PartyListBuddy,
): { [id: number]: Character } {
  return _.keyBy(data.buddies.map(i => convertCharacter(i)), 'id');
}

function handleWinBattle(data: schemas.WinBattle, store: Store<IState>) {
  for (const buddy of data.result.buddy) {
    if (+buddy.exp.current_level !== +buddy.exp.previous_level) {
      store.dispatch(
        updateCharacter(+buddy.buddy_id, {
          level: +buddy.exp.current_level,
        }),
      );
    }

    const soulBreakExpUpdate = buddy.soul_strike_exps
      .filter(i => +i.previous_exp !== +i.new_exp)
      .map(i => [+i.soul_strike_id, +i.new_exp]);
    if (soulBreakExpUpdate.length) {
      store.dispatch(updateSoulBreakExp(_.fromPairs(soulBreakExpUpdate)));
    }
    const legendMateriaExpUpdate = buddy.legend_materia_exps
      .filter(i => +i.previous_exp !== +i.new_exp)
      .map(i => [+i.legend_materia_id, +i.new_exp]);
    if (legendMateriaExpUpdate.length) {
      store.dispatch(updateLegendMateriaExp(_.fromPairs(legendMateriaExpUpdate)));
    }
  }
}

function getExpMap(
  buddies: charactersSchemas.Buddy[],
  getCharacterExpMap: (buddy: charactersSchemas.Buddy) => { [id: string]: string },
): ExpMap {
  return _.fromPairs(
    _.flatten(
      _.map(buddies.map(getCharacterExpMap), (expMap: { [id: string]: string }) =>
        _.map(expMap, (exp: string, id: string) => [+id, +exp]),
      ),
    ),
  );
}

function getExpRequired<T extends { id: number; required_exp: number }>(items: T[]): ExpMap {
  return _.fromPairs(items.map(i => [i.id, i.required_exp]));
}

const charactersHandler: Handler = {
  'party/list'(data: schemas.PartyList, store: Store<IState>, request: HandlerRequest) {
    if (schemas.isRecordDungeonPartyList(request.url)) {
      return;
    }
    store.dispatch(setCharacters(convertCharacters(data)));
  },

  'party/list_buddy'(data: schemas.PartyListBuddy, store: Store<IState>, request: HandlerRequest) {
    // As of February 2019, party/list_buddy isn't used for record dungeons,
    // but we'll be paranoid and check anyway.
    if (schemas.isRecordDungeonPartyList(request.url)) {
      return;
    }

    store.dispatch(setCharacters(convertCharacters(data)));

    store.dispatch(setSoulBreakExp(getExpMap(data.buddies, buddy => buddy.soul_strike_exp_map)));
    store.dispatch(
      setLegendMateriaExp(getExpMap(data.buddies, buddy => buddy.legend_materia_exp_map)),
    );

    store.dispatch(setSoulBreaks(data.soul_strikes.map(i => i.id)));
    store.dispatch(setLegendMateria(data.legend_materias.map(i => i.id)));

    store.dispatch(setSoulBreakExpRequired(getExpRequired(data.soul_strikes)));
    store.dispatch(setLegendMateriaExpRequired(getExpRequired(data.legend_materias)));
  },

  'warehouse/get_equipment_list'(
    data: warehouseSchemas.WarehouseGetEquipmentList,
    store: Store<IState>,
  ) {
    store.dispatch(setSoulBreaks(data.soul_strikes.map(i => i.id), InventoryType.VAULT));
    store.dispatch(setLegendMateria(data.legend_materias.map(i => i.id), InventoryType.VAULT));

    store.dispatch(setSoulBreakExpRequired(getExpRequired(data.soul_strikes)));
    store.dispatch(setLegendMateriaExpRequired(getExpRequired(data.legend_materias)));
  },

  win_battle: handleWinBattle,
  battle_win: handleWinBattle,
  'battle/win': handleWinBattle,

  'grow_egg/use'(
    data: charactersSchemas.GrowEggUse,
    store: Store<IState>,
    request: HandlerRequest,
  ) {
    if (typeof request.body !== 'object' || request.body.exec == null) {
      logger.warn(`Unknown POST request for grow_egg/use: ${request.body}`);
      return;
    }
    const post = request.body as charactersSchemas.GrowEggUsePost;

    if (!post.exec) {
      return;
    }

    store.dispatch(setCharacter(convertCharacter(data.buddy)));
  },

  'buddy/evolve'(
    data: charactersSchemas.BuddyEvolve,
    store: Store<IState>,
    request: HandlerRequest,
  ) {
    if (typeof request.body !== 'object' || request.body.exec == null) {
      logger.warn(`Unknown POST request for buddy/evolve: ${request.body}`);
      return;
    }
    const post = request.body as charactersSchemas.BuddyEvolvePost;

    if (!post.exec) {
      return;
    }

    store.dispatch(setCharacter(convertCharacter(data.buddy)));
  },
};

export default charactersHandler;
