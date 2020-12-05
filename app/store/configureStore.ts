import { History } from 'history';
import { Store } from 'redux';

import { IState } from '../reducers';

let configureStore: (initialState?: IState) => Store<IState>;
let history: History;

if (process.env.NODE_ENV === 'production') {
  ({ configureStore, history } = require('./configureStore.production'));
} else {
  ({ configureStore, history } = require('./configureStore.development'));
}

export { configureStore, history };
