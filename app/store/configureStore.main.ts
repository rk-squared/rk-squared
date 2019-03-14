import { Action, applyMiddleware, createStore, Reducer, Store } from 'redux';
import { Persistor, persistReducer, persistStore } from 'redux-persist';
import createSagaMiddleware from 'redux-saga';
import thunk from 'redux-thunk';
const { forwardToRenderer } = require('electron-redux');
const createElectronStorage = require('redux-persist-electron-storage');

import { blacklist, createRootReducer, IState } from '../reducers';

import { allSagas } from '../sagas';

const sagaMiddleware = createSagaMiddleware();

const enhancer = applyMiddleware(thunk, sagaMiddleware, forwardToRenderer);

export function configureStore(
  initialState?: IState,
): { store: Store<IState>; persistor: Persistor } {
  // See https://github.com/rt2zz/redux-persist
  // and https://github.com/psperber/redux-persist-electron-storage
  const persistedReducer: Reducer<IState, Action> = persistReducer<IState, Action>(
    {
      key: 'root',
      storage: createElectronStorage(),
      blacklist,
    },
    createRootReducer(),
  );

  const store =
    initialState == null
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
