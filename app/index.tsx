import * as React from 'react';
import { render } from 'react-dom';
const { replayActionRenderer, getInitialStateRenderer } = require('electron-redux');
import { AppContainer } from 'react-hot-loader';

import { Root } from './containers/Root';
import { initializeGlobalStyles } from './globalStyles';

const { configureStore, history } = require('./store/configureStore');
const store = configureStore(getInitialStateRenderer());
replayActionRenderer(store);

initializeGlobalStyles('#root');

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
