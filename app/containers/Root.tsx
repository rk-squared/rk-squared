import * as React from 'react';
import { Provider } from 'react-redux';
import { Store } from 'redux';

import { History } from 'history';
import { ConnectedRouter } from 'react-router-redux';

import { IState } from '../reducers';
import { Routes } from '../routes';

interface IRootType {
  store: Store<IState>;
  history: History;
}

export function Root({ store, history }: IRootType) {
  return (
    <Provider store={store}>
      <ConnectedRouter history={history}>
        <Routes />
      </ConnectedRouter>
    </Provider>
  );
}
