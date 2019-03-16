import * as React from 'react';
import { render } from 'react-dom';
import { AppContainer } from 'react-hot-loader';
import * as Modal from 'react-modal';

// https://stackoverflow.com/a/37480521/25507
const w = window as any;
w.$ = w.jQuery = require('jquery/dist/jquery.slim');
require('popper.js');
require('bootstrap');

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
const store = configureStore();

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
