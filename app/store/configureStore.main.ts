import { applyMiddleware, createStore, Store } from 'redux';
import thunk from 'redux-thunk';
const { forwardToRenderer } = require('electron-redux');

import rootReducer, { IState } from '../reducers';

const enhancer = applyMiddleware(thunk, forwardToRenderer);

export function configureStore(initialState: object | void): Store<IState> {
  // FIXME: Fix type
  return createStore(rootReducer, initialState, enhancer) as Store<IState>;
}
