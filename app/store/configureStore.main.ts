import { applyMiddleware, createStore, Store } from 'redux';
import { Persistor, persistReducer, persistStore } from 'redux-persist';
import createSagaMiddleware from 'redux-saga';
import thunk from 'redux-thunk';
const { forwardToRenderer } = require('electron-redux');
const { default: createElectronStorage } = require('redux-persist-electron-storage');

import { blacklist, IState, rootReducer } from '../reducers';

import { allSagas } from '../sagas';

const sagaMiddleware = createSagaMiddleware();

const enhancer = applyMiddleware(thunk, sagaMiddleware, forwardToRenderer);

// See https://github.com/rt2zz/redux-persist
// and https://github.com/psperber/redux-persist-electron-storage
const persistedReducer = persistReducer({
  key: 'root',
  storage: createElectronStorage(),
  blacklist
}, rootReducer);

export function configureStore(initialState?: IState): { store: Store<IState>, persistor: Persistor } {
  const store = initialState == null
    ? createStore(persistedReducer, enhancer)
    : createStore(persistedReducer, initialState, enhancer);
  const persistor = persistStore(store);
  return { store, persistor };
}

export function runSagas() {
  for (const i of allSagas) {
    sagaMiddleware.run(i);
  }
}
