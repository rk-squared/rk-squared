import { applyMiddleware, createStore, Store } from 'redux';

import { routerMiddleware } from 'connected-react-router';
import { createBrowserHistory } from 'history';
import thunk from 'redux-thunk';

const { forwardToMain } = require('electron-redux');

import { createRootReducer, IState } from '../reducers';

const history = createBrowserHistory();
const router = routerMiddleware(history);
const enhancer = applyMiddleware(forwardToMain, thunk, router);

export = {
  history,
  configureStore(initialState?: IState): Store<IState> {
    return initialState == null
      ? createStore(createRootReducer(history), enhancer)
      : createStore(createRootReducer(history), initialState, enhancer);
  },
};
