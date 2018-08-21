import * as React from 'react';
import { render } from 'react-dom';
import * as Modal from 'react-modal';
const { replayActionRenderer, getInitialStateRenderer } = require('electron-redux');
import { AppContainer } from 'react-hot-loader';

import fontawesome from '@fortawesome/fontawesome';
import * as faArchive from '@fortawesome/fontawesome-free-solid/faArchive';
import * as faArrowDown from '@fortawesome/fontawesome-free-solid/faArrowDown';
import * as faCheck from '@fortawesome/fontawesome-free-solid/faCheck';
import * as faEllipsisH from '@fortawesome/fontawesome-free-solid/faEllipsisH';
import * as faLock from '@fortawesome/fontawesome-free-solid/faLock';
import * as faLockOpen from '@fortawesome/fontawesome-free-solid/faLockOpen';
import * as faQuestion from '@fortawesome/fontawesome-free-solid/faQuestion';
import * as faStar from '@fortawesome/fontawesome-free-solid/faStar';
import * as faUnlock from '@fortawesome/fontawesome-free-solid/faUnlock';

import { Root } from './containers/Root';

import './app.global.scss';

fontawesome.library.add(faArchive, faArrowDown, faCheck, faEllipsisH, faLock, faLockOpen, faQuestion, faStar, faUnlock);

const { configureStore, history } = require('./store/configureStore');
const store = configureStore(getInitialStateRenderer());
replayActionRenderer(store);

Modal.setAppElement('#root');

render(
  <AppContainer>
    <Root store={store} history={history} />
  </AppContainer>,
  document.getElementById('root')
);

if ((module as any).hot) {
  (module as any).hot.accept('./containers/Root', () => {
    // noinspection JSUnusedLocalSymbols
    const NextRoot = require('./containers/Root').default;
    render(
      <AppContainer>
        <NextRoot store={store} history={history} />
      </AppContainer>,
      document.getElementById('root')
    );
  });
}
