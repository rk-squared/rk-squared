/**
 * @file
 * Support for tracking characters
 */

import { Store } from 'redux';

import * as schemas from '../api/schemas';
import { Handler } from './types';

import { IState } from '../reducers';

import { Character, setCharacters } from '../actions/characters';

export function convertCharacters(data: schemas.PartyList): { [id: number]: Character } {
  const result: { [id: number]: Character } = {};

  for (const i of data.buddies) {
    result[i.buddy_id] = {
      name: i.name,
      id: i.buddy_id,
      uniqueId: i.id,
      level: i.level,
      levelCap: i.level_max,
    };
  }

  return result;
}

const characters: Handler = {
  'party/list'(data: schemas.PartyList, store: Store<IState>) {
    store.dispatch(setCharacters(convertCharacters(data)));
  },
};

export default characters;
