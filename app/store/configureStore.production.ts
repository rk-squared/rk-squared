import { applyMiddleware, createStore, Store, StoreEnhancer } from 'redux';

import { routerMiddleware } from 'connected-react-router';
import { createBrowserHistory } from 'history';
import thunk from 'redux-thunk';

import { createRootReducer, IState } from '../reducers';

const history = createBrowserHistory();
const router = routerMiddleware(history);

let middleware: StoreEnhancer<{ dispatch: {} }, {}>;
if (process.env.IS_ELECTRON) {
  const { forwardToMain } = require('electron-redux');
  middleware = applyMiddleware(forwardToMain, thunk, router);
} else {
  middleware = applyMiddleware(thunk, router);
}

const enhancer = middleware;

function configureStore(initialState?: IState): Store<IState> {
  return initialState == null
    ? createStore(createRootReducer(history), enhancer)
    : createStore(createRootReducer(history), initialState, enhancer);
}

export { history, configureStore };
