import * as React from 'react';
import { Provider } from 'react-redux';
import { Store } from 'redux';

import { ConnectedRouter } from 'connected-react-router';
import { History } from 'history';

import { IState } from '../reducers';
import { Routes } from './Routes';

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
