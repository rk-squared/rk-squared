import * as React from 'react';
import { Route, Switch } from 'react-router';

import { History } from 'history';

import { routes } from '../routes';
import App from './App';

export const Routes = ({ history }: { history?: History }) => (
  <App history={history}>
    <Switch>
      {routes.map(({ path, component }, i) => (
        <Route path={path} component={component} key={i} />
      ))}
    </Switch>
  </App>
);
