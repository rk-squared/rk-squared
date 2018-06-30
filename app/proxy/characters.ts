/**
 * @file
 * Support for tracking characters
 */

import { Store } from 'redux';

import * as schemas from '../api/schemas';
import * as charactersSchemas from '../api/schemas/characters';
import { Handler } from './types';

import { IState } from '../reducers';

import { Character, setCharacter, setCharacters } from '../actions/characters';

import * as _ from 'lodash';

// FIXME: What's the best place to log these?  Use the console for now.
// tslint:disable no-console

function convertCharacter(data: charactersSchemas.Buddy): Character {
  return {
    name: data.name,
    id: data.buddy_id,
    uniqueId: data.id,
    level: data.level,
    levelCap: data.level_max,
  };
}

export function convertCharacters(data: schemas.PartyList): { [id: number]: Character } {
  return _.keyBy(data.buddies.map(i => convertCharacter(i)), 'id');
}

const characters: Handler = {
  'party/list'(data: schemas.PartyList, store: Store<IState>) {
    store.dispatch(setCharacters(convertCharacters(data)));
  },

  'grow_egg/use'(data: charactersSchemas.GrowEggUse, store: Store<IState>, query?: any, requestBody?: any) {
    if (typeof(requestBody) !== 'object' || requestBody.exec == null) {
      console.warn(`Unknown POST request for grow_egg/use: ${requestBody}`);
      return;
    }
    const post = requestBody as charactersSchemas.GrowEggUsePost;

    if (!post.exec) {
      return;
    }

    store.dispatch(setCharacter(convertCharacter(data.buddy)));
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

    store.dispatch(setCharacter(convertCharacter(data.buddy)));
  },

  // FIXME: Update characters when winning battles
};

export default characters;
