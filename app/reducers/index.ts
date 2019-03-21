import { Action, combineReducers, Reducer } from 'redux';

import { connectRouter, RouterState } from 'connected-react-router';
import { History } from 'history';

import { battle, BattleState } from './battle';
import { characters, CharacterState } from './characters';
import { dungeons, DungeonState } from './dungeons';
import { dungeonScores, DungeonScoreState } from './dungeonScores';
import { gacha, GachaState } from './gacha';
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
  gacha: GachaState;
  messages: MessagesState;
  options: Options;
  prefs: PrefsState;
  progress: ProgressState;
  proxy: ProxyStatus;
  recordMateria: RecordMateriaState;
  session: Session;
  worlds: WorldState;
  router: RouterState;
}

// Hack: redux-persist uses _persist.  Pass a dummy reducer to silence
// warnings, and add an interface for this to make it type-check.
interface PersistState {
  _persist: (state: any) => any;
}

// noinspection JSUnusedGlobalSymbols
export const createRootReducer: (history?: History) => Reducer<IState, Action> = (
  history?: History,
) =>
  combineReducers<IState & PersistState>({
    battle,
    characters,
    dungeons,
    dungeonScores,
    gacha,
    options,
    messages,
    prefs,
    progress,
    proxy,
    recordMateria,
    session,
    worlds,

    // Avoid requiring a history for the Electron main process's store -
    // routing and browser history don't make much sense there.  (I don't know
    // if this is the right way to handle this, but it seems to work...)
    router: history ? connectRouter(history) : (state: any = null) => state,

    // redux-persist uses _persist - see "PersistState" above
    _persist: (state: any = null) => state,
  });

/// State keys to exclude from redux-persist
export const blacklist = ['messages', 'progress', 'proxy', 'session', 'router'];
