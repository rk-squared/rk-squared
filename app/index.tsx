import * as React from 'react';
import { render } from 'react-dom';
import * as Modal from 'react-modal';
const { replayActionRenderer, getInitialStateRenderer } = require('electron-redux');
import { AppContainer } from 'react-hot-loader';

import { library } from '@fortawesome/fontawesome-svg-core';
import {
  faArchive,
  faArrowDown,
  faCheck,
  faCoffeeTogo,
  faEllipsisH,
  faLock,
  faLockOpen,
  faQuestion,
  faStar,
  faUnlock,
} from '@fortawesome/pro-solid-svg-icons';

import { Root } from './containers/Root';

import './app.global.scss';

library.add(
  faArchive,
  faArrowDown,
  faCheck,
  faCoffeeTogo,
  faEllipsisH,
  faLock,
  faLockOpen,
  faQuestion,
  faStar,
  faUnlock,
);

const { configureStore, history } = require('./store/configureStore');
const store = configureStore(getInitialStateRenderer());
replayActionRenderer(store);

Modal.setAppElement('#root');

render(
  <AppContainer>
    <Root store={store} history={history} />
  </AppContainer>,
  document.getElementById('root'),
);

if ((module as any).hot) {
  (module as any).hot.accept('./containers/Root', () => {
    // noinspection JSUnusedLocalSymbols
    const NextRoot = require('./containers/Root').default;
    render(
      <AppContainer>
        <NextRoot store={store} history={history} />
      </AppContainer>,
      document.getElementById('root'),
    );
  });
}
