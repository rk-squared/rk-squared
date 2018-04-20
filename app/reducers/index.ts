import { combineReducers, Reducer } from 'redux';

import { routerReducer as routing } from 'react-router-redux';

// tslint:disable ordered-imports
import { default as battle, BattleState } from './battle';
import { default as options, Options } from './options';
import { default as worlds, WorldState } from './worlds';

const rootReducer = combineReducers({
  battle,
  options,
  worlds,
  routing: routing as Reducer<any>
});

export interface IState {
  battle: BattleState;
  options: Options;
  worlds: WorldState;
}

export default rootReducer;
