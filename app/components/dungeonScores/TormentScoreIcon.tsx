import * as React from 'react';
const { default: FontAwesomeIcon } = require('@fortawesome/react-fontawesome');

import { DungeonScore, isSub30 } from '../../actions/dungeonScores';

const styles = require('./TormentScoreIcon.scss');

export class TormentScoreIcon extends React.Component<{ score: DungeonScore }> {
  render() {
    const { score } = this.props;
    if (isSub30(score)) {
      return (
        <FontAwesomeIcon
          className={styles.component + ' ' + styles.sub30}
          icon="check"
          fixedWidth
        />
      );
    } else {
      return (
        <FontAwesomeIcon
          className={styles.component + ' ' + styles.hidden}
          icon="check"
          fixedWidth
        />
      );
    }
  }
}
