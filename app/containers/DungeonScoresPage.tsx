import * as React from 'react';

import MagiciteGrid from '../components/dungeonScores/MagiciteGrid';
import TormentGrid from '../components/dungeonScores/TormentGrid';
import { Page } from './Page';

const styles = require('./DungeonScoresPage.scss');

export default class DungeonScoresPage extends React.Component {
  render() {
    return (
      <Page title="Dungeon Scores">
        <h4>Torments</h4>
        <TormentGrid />

        <h4>Magicite</h4>
        <MagiciteGrid />

        <div className={`alert alert-secondary ${styles.howToTip}`}>
          <strong>Tip:</strong> You may need to enter a dungeon in order to get complete time and
          percent complete information.
        </div>
      </Page>
    );
  }
}
