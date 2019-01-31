import * as React from 'react';
import { Route, Switch } from 'react-router';

import App from './containers/App';
import DropTrackerPage from './containers/DropTrackerPage';
import DungeonScoresPage from './containers/DungeonScoresPage';
import DungeonsPage from './containers/DungeonsPage';
import HomePage from './containers/HomePage';
import OptionsPage from './containers/OptionsPage';
import RecordMateriaPage from './containers/RecordMateriaPage';

export const Routes = () => (
  <App>
    <Switch>
      <Route path="/dropTracker" component={DropTrackerPage} />
      <Route path="/dungeons" component={DungeonsPage} />
      <Route path="/dungeonScores" component={DungeonScoresPage} />
      <Route path="/recordMateria" component={RecordMateriaPage} />
      <Route path="/options" component={OptionsPage} />
      <Route path="/" component={HomePage} />
    </Switch>
  </App>
);
