import * as React from 'react';
import { Route, Switch } from 'react-router';

import { routes } from '../routes';
import App from './App';

export const Routes = () => (
  <App>
    <Switch>
      {routes.map(({ path, component }, i) => (
        <Route path={path} component={component} key={i} />
      ))}
    </Switch>
  </App>
);
