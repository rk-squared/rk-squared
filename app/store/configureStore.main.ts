import { applyMiddleware, createStore, Store } from 'redux';
import createSagaMiddleware from 'redux-saga';
import thunk from 'redux-thunk';
const { forwardToRenderer } = require('electron-redux');

import rootReducer, { IState } from '../reducers';

import { watchLoadDungeons } from '../sagas/loadDungeons';

const sagaMiddleware = createSagaMiddleware();

const enhancer = applyMiddleware(thunk, sagaMiddleware, forwardToRenderer);

export function configureStore(initialState: object | void): Store<IState> {
  // FIXME: Fix type
  return createStore(rootReducer, initialState, enhancer) as Store<IState>;
}

export function runSagas() {
  sagaMiddleware.run(watchLoadDungeons);
}
