import * as React from 'react';

import { Dungeon, hasAvailablePrizes } from '../../actions/dungeons';

import * as _ from 'lodash';

const styles = require('./DungeonBadge.scss');

interface Props {
  dungeons: Dungeon[];
  isAnonymous?: boolean;
}

const getClasses = (isActive: boolean) =>
  `badge ${styles.component} ` + (isActive ? 'badge-primary' : 'badge-secondary');

/**
 * Shows dungeon status as a Bootstrap badge
 */
export const DungeonBadge = ({ dungeons, isAnonymous }: Props) => {
  if (!dungeons || !dungeons.length) {
    return null;
  }
  const total = dungeons.length;

  if (isAnonymous) {
    const stamina = _.sumBy(dungeons, 'totalStamina');
    return (
      <span className={getClasses(true)}>
        {total}
        <br />
        {stamina} stamina
      </span>
    );
  }

  const mastered = _.sumBy(dungeons, d => +!hasAvailablePrizes(d));
  const hasUnlocked = _.find(dungeons, d => d.isUnlocked && hasAvailablePrizes(d));
  // TODO: Highlight in red if about to expire?
  // TODO: Add Cid missions
  // TODO: Add a tooltip explaining mastered / completed / total syntax
  // TODO: Mark dungeons that are not yet entered but that should be unlocked? (see access-controls branch)
  const classes = getClasses(hasUnlocked != null);
  if (mastered === total) {
    return (
      <span className={classes}>
        {mastered} / {mastered} / {total}
      </span>
    );
  } else {
    const completed = _.sumBy(dungeons, d => +d.isComplete);
    const stamina = _.sumBy(dungeons, d => (hasAvailablePrizes(d) ? d.totalStamina : 0));

    return (
      <span className={classes}>
        {mastered} / {completed} / {total}
        <br />
        {stamina} stamina
      </span>
    );
  }
};
