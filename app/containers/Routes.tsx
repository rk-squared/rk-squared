import * as React from 'react';
import { Route, Switch } from 'react-router';

import * as _ from 'lodash';

import { History } from 'history';

import { routes } from '../routes';
import App from './App';

const allRoutes = _.flatten([
  ...routes.filter(i => i.children != null).map(i => i.children!),
  routes,
]);

export const Routes = ({ history }: { history?: History }) => (
  <App history={history}>
    <Switch>
      {allRoutes.map(({ path, component }, i) => (
        <Route path={path} component={component} key={i} />
      ))}
    </Switch>
  </App>
);
