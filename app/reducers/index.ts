import { combineReducers, Reducer } from 'redux';
import { routerReducer as routing } from 'react-router-redux';

import { default as battle, BattleState } from './battle';

const rootReducer = combineReducers({
  battle,
  routing: routing as Reducer<any>
});

export interface IState {
  battle: BattleState;
}

export default rootReducer;
