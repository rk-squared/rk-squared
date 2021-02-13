import * as React from 'react';

import CardiaGrid from '../components/dungeonScores/CardiaGrid';
import OdinGrid from '../components/dungeonScores/OdinGrid';
import MagiciteGrid from '../components/dungeonScores/MagiciteGrid';
import { Page } from './Page';

const styles = require('./DungeonScoresPage.scss');

export default class DungeonScoresPage extends React.Component {
  render() {
    return (
      <Page title="Dungeon Scores" contentClassName={styles.component}>
        <h4 className={styles.firstHeader}>Cardia</h4>
        <CardiaGrid />

        <h4>Dark Odin and Argent Odin</h4>
        <OdinGrid />

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
