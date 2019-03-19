import * as React from 'react';
import { hydrate, render } from 'react-dom';
import { AppContainer } from 'react-hot-loader';

import { Root } from './containers/Root';
import { initializeGlobalStyles } from './globalStyles';
import { configureStore, history } from './store/configureStore';

const store = configureStore(require('./tmp/store.json'));

const rootElement = document.getElementById('root')!;
initializeGlobalStyles(rootElement);
const renderOrHydrate = rootElement.hasChildNodes() ? hydrate : render;

renderOrHydrate(
  <AppContainer>
    <Root store={store} history={history} />
  </AppContainer>,
  rootElement,
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
