import { applyMiddleware, createStore } from 'redux';

import { createBrowserHistory } from 'history';
import { routerMiddleware } from 'react-router-redux';
import thunk from 'redux-thunk';

const { forwardToMain } = require('electron-redux');

import rootReducer from '../reducers';

const history = createBrowserHistory();
const router = routerMiddleware(history);
const enhancer = applyMiddleware(forwardToMain, thunk, router);

export = {
  history,
  configureStore(initialState: object | void) {
    return createStore(rootReducer, initialState, enhancer);
  }
};
