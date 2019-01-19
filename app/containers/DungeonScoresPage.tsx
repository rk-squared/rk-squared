import * as React from 'react';

import TormentGrid from '../components/dungeonScores/TormentGrid';
import { Page } from './Page';

export default class DungeonScoresPage extends React.Component {
  render() {
    return (
      <Page title="Dungeon Scores">
        <h4>Torments</h4>
        <TormentGrid />
      </Page>
    );
  }
}
