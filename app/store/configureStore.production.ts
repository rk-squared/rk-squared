import { applyMiddleware, createStore, Store } from 'redux';

import { createBrowserHistory } from 'history';
import { routerMiddleware } from 'react-router-redux';
import thunk from 'redux-thunk';

const { forwardToMain } = require('electron-redux');

import { IState, rootReducer } from '../reducers';

const history = createBrowserHistory();
const router = routerMiddleware(history);
const enhancer = applyMiddleware(forwardToMain, thunk, router);

export = {
  history,
  configureStore(initialState?: IState): Store<IState> {
    return initialState == null
      ? createStore(rootReducer, enhancer)
      : createStore(rootReducer, initialState, enhancer);
  }
};
