import { combineReducers, Reducer } from 'redux';

import { routerReducer as routing } from 'react-router-redux';

// tslint:disable ordered-imports
import { default as battle, BattleState } from './battle';
import { default as dungeons, DungeonState } from './dungeons';
import { default as options, Options } from './options';
import { default as prefs, PrefsState } from './prefs';
import { default as worlds, WorldState } from './worlds';

const rootReducer = combineReducers({
  battle,
  dungeons,
  options,
  prefs,
  worlds,
  routing: routing as Reducer<any>
});

export interface IState {
  battle: BattleState;
  dungeons: DungeonState;
  options: Options;
  prefs: PrefsState;
  worlds: WorldState;
}

export default rootReducer;
