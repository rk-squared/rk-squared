import * as _ from 'lodash';
import { IState } from '../index';
import { initialState } from '../prefs';
import { DeepPartial } from 'utility-types';

export function makeTestState(state?: DeepPartial<IState>): IState {
  const result: IState = {
    battle: {
      dropItems: null,
    },
    characters: {
      characters: {},
    },
    dungeonScores: {
      scores: {},
    },
    dungeons: {
      dungeons: {},
      byWorld: {},
    },
    labyrinth: {},
    messages: {
      messages: [],
    },
    options: {},
    prefs: _.cloneDeep(initialState), // complex state - easier to clone the default
    progress: {},
    proxy: {},
    recordMateria: {
      recordMateria: {},
      favorites: undefined,
      inventory: undefined,
      obtained: undefined,
    },
    relicDraws: {
      banners: {},
      groups: {},
      probabilities: {},
      selections: {},
    },
    router: null as any, // omit for test purposes
    session: {},
    timeState: {
      currentTime: 1615259545 * 1000, // March 8, 2021
    },
    worlds: {},
  };
  if (state) {
    _.merge(result, state);
  }
  return result;
}
