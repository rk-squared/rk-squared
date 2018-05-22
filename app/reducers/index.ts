import { combineReducers, Reducer } from 'redux';

import { routerReducer as routing } from 'react-router-redux';

// tslint:disable ordered-imports
import { default as battle, BattleState } from './battle';
import { default as dungeons, DungeonState } from './dungeons';
import { default as options, Options } from './options';
import { default as prefs, PrefsState } from './prefs';
import { default as progress, ProgressState } from './progress';
import { default as proxy, ProxyStatus } from './proxy';
import { default as session, Session } from './session';
import { default as worlds, WorldState } from './worlds';

export interface IState {
  battle: BattleState;
  dungeons: DungeonState;
  options: Options;
  prefs: PrefsState;
  progress: ProgressState;
  proxy: ProxyStatus;
  session: Session;
  worlds: WorldState;
}

// noinspection JSUnusedGlobalSymbols
export const rootReducer = combineReducers<IState>({
  battle,
  dungeons,
  options,
  prefs,
  progress,
  proxy,
  session,
  worlds,
  routing: routing as Reducer<any>,

  // redux-persist uses _persist.  Pass a dummy reducer to silence warnings.
  _persist: (state: any = null) => state
});

/// State keys to exclude from redux-persist
export const blacklist = ['progress', 'proxy', 'session', 'routing'];
