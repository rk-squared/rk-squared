import * as React from 'react';
import { Dungeon } from '../actions/dungeons';

import * as _ from 'lodash';

const styles = require('./DungeonBadge.scss');

/**
 * Shows dungeon status as a Bootstrap badge
 */
export const DungeonBadge = ({dungeons}: {dungeons: Dungeon[]}) => {
  if (!dungeons) {
    return null;
  }
  const total = dungeons.length;
  const mastered = _.sumBy(dungeons, d => +d.isMaster);
  if (mastered === total) {
    return (
      <span className={`badge badge-secondary ${styles.component}`}>
        {mastered} / {mastered} / {total}
      </span>
    );
  } else {
    const completed = _.sumBy(dungeons, d => +d.isComplete);
    const stamina = _.sumBy(dungeons, d => !d.isMaster ? d.totalStamina : 0);

    return (
      <span className={`badge badge-primary ${styles.component}`}>
        {mastered} / {completed} / {total}
        <br/>
        {stamina} stamina
      </span>
    );
  }
};
