import * as React from 'react';
import { Route, Switch } from 'react-router';

import App from './containers/App';
import DropTrackerPage from './containers/DropTrackerPage';
import DungeonsPage from './containers/DungeonsPage';
import HomePage from './containers/HomePage';
import OptionsPage from './containers/OptionsPage';

export default () => (
  <App>
    <Switch>
      <Route path="/dropTracker" component={DropTrackerPage} />
      <Route path="/dungeons" component={DungeonsPage} />
      <Route path="/options" component={OptionsPage} />
      <Route path="/" component={HomePage} />
    </Switch>
  </App>
);
