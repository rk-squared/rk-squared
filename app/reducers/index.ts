import { Action, combineReducers, Reducer } from 'redux';

import { routerReducer as routing, RouterState } from 'react-router-redux';

import { battle, BattleState } from './battle';
import { characters, CharacterState } from './characters';
import { dungeons, DungeonState } from './dungeons';
import { dungeonScores, DungeonScoreState } from './dungeonScores';
import { messages, MessagesState } from './messages';
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
  dungeonScores: DungeonScoreState;
  messages: MessagesState;
  options: Options;
  prefs: PrefsState;
  progress: ProgressState;
  proxy: ProxyStatus;
  recordMateria: RecordMateriaState;
  session: Session;
  worlds: WorldState;
  routing: RouterState;
}

// Hack: redux-persist uses _persist.  Pass a dummy reducer to silence
// warnings, and add an interface for this to make it type-check.
interface PersistState {
  _persist: (state: any) => any;
}

// noinspection JSUnusedGlobalSymbols
export const rootReducer: Reducer<IState, Action> = combineReducers<IState & PersistState>({
  battle,
  characters,
  dungeons,
  dungeonScores,
  options,
  messages,
  prefs,
  progress,
  proxy,
  recordMateria,
  session,
  worlds,
  routing,

  // redux-persist uses _persist - see "PersistState" above
  _persist: (state: any = null) => state,
});

/// State keys to exclude from redux-persist
export const blacklist = ['messages', 'progress', 'proxy', 'session', 'routing'];
