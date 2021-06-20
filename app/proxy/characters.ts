/**
 * @file
 * Support for tracking characters
 */

import { Store } from 'redux';

import * as _ from 'lodash';

import {
  addLegendMateria,
  addSoulBreak,
  Character,
  setCharacter,
  setCharacters,
  updateCharacter,
} from '../actions/characters';
import * as schemas from '../api/schemas';
import * as charactersSchemas from '../api/schemas/characters';
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
  return _.keyBy(
    data.buddies.map((i) => convertCharacter(i)),
    'id',
  );
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
  }
}

const charactersHandler: Handler = {
  'party/list'(data: schemas.PartyList, store: Store<IState>, request: HandlerRequest) {
    if (
      schemas.isRecordDungeonPartyList(request.url) ||
      schemas.isLabyrinthPartyList(request.url)
    ) {
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

    // We could get the "?part=1&split=3" parameters out of the request to know
    // when we have a complete list of soul breaks and legend materia, but it's
    // easier to let setSoulBreaks / setLegendMateria always append (never
    // remove) so that incomplete lists won't be a problem.  See these actions'
    // handling within the characters.ts reducer.
    store.dispatch(addSoulBreak(data.soul_strikes.map((i) => i.id)));
    store.dispatch(addLegendMateria(data.legend_materias.map((i) => i.id)));
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
