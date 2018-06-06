import { combineReducers, Reducer } from 'redux';

import { routerReducer as routing } from 'react-router-redux';

import { battle, BattleState } from './battle';
import { characters, CharacterState } from './characters';
import { dungeons, DungeonState } from './dungeons';
import { options, Options } from './options';
import { prefs, PrefsState } from './prefs';
import { progress, ProgressState } from './progress';
import { proxy, ProxyStatus } from './proxy';
import { recordMateria, RecordMateriaState } from './recordMateria';
import { session, Session } from './session';
import { worlds, WorldState } from './worlds';

export interface IState {
  battle: BattleState;
  characters: CharacterState;
  dungeons: DungeonState;
  options: Options;
  prefs: PrefsState;
  progress: ProgressState;
  proxy: ProxyStatus;
  recordMateria: RecordMateriaState;
  session: Session;
  worlds: WorldState;
}

// noinspection JSUnusedGlobalSymbols
export const rootReducer = combineReducers<IState>({
  battle,
  characters,
  dungeons,
  options,
  prefs,
  progress,
  proxy,
  recordMateria,
  session,
  worlds,
  routing: routing as Reducer<any>,

  // redux-persist uses _persist.  Pass a dummy reducer to silence warnings.
  _persist: (state: any = null) => state
});

/// State keys to exclude from redux-persist
export const blacklist = ['progress', 'proxy', 'session', 'routing'];
