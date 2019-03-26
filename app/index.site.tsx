import * as React from 'react';
import { hydrate, render } from 'react-dom';
import { AppContainer } from 'react-hot-loader';

import { Root } from './containers/Root';
import { initializeGlobalStyles } from './globalStyles';
import { configureStore, history } from './store/configureStore';

const store = configureStore(require('./tmp/store.json'));

const rootElement = document.getElementById('root')!;
initializeGlobalStyles(rootElement);

// Hot loading seems to interfere with react-snap and/or hydration, so manually
// and redundantly disable it.  (Or maybe it's just a problem with HTTP
// redirects and trailing slashes in URLs, which we now handle with joinUrl -
// but I don't want to retest now.)
if (rootElement.hasChildNodes()) {
  hydrate(<Root store={store} history={history} />, rootElement);
} else if (process.env.NODE_ENV === 'production') {
  render(<Root store={store} history={history} />, rootElement);
} else {
  render(
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
}
