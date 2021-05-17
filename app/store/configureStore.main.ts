import produce from 'immer';
import { Action, applyMiddleware, createStore, Reducer, Store } from 'redux';
import {
  Persistor,
  persistReducer,
  persistStore,
  createMigrate,
  MigrationManifest,
} from 'redux-persist';
import createSagaMiddleware from 'redux-saga';
import thunk from 'redux-thunk';
const { forwardToRenderer } = require('electron-redux');
const createElectronStorage = require('redux-persist-electron-storage');

import { blacklist, createRootReducer, IState } from '../reducers';

import { allSagas } from '../sagas';

const sagaMiddleware = createSagaMiddleware();

const enhancer = applyMiddleware(thunk, sagaMiddleware, forwardToRenderer);

const migrations: MigrationManifest = {
  0: (state) =>
    produce(state, (draft) => {
      const characters = (draft as IState).characters as any;
      delete characters?.vault;
      delete characters?.soulBreakExp;
      delete characters?.legendMateriaExp;
      delete characters?.soulBreakExpRequired;
      delete characters?.legendMateriaExpRequired;
    }),
};

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
      version: 0,
      migrate: createMigrate(migrations, { debug: true }),
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
