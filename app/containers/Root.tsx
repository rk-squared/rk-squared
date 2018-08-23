import * as React from 'react';
import { Provider, Store } from 'react-redux';

import { History } from 'history';

import { ConnectedRouter } from 'react-router-redux';
import { Routes } from '../routes';

interface IRootType {
  store: Store<any>;
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
