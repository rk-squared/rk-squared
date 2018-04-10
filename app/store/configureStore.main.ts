import { applyMiddleware, createStore } from 'redux';
import thunk from 'redux-thunk';
const { forwardToRenderer } = require('electron-redux');

import rootReducer from '../reducers';

const enhancer = applyMiddleware(thunk, forwardToRenderer);

export function configureStore(initialState: object | void) {
  return createStore(rootReducer, initialState, enhancer);
}
