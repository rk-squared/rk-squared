import * as React from 'react';
import { connect } from 'react-redux';
import * as ReactTooltip from 'react-tooltip';

import * as classNames from 'classnames';

import { Dungeon } from '../actions/dungeons';
import { World } from '../actions/worlds';
import { IState } from '../reducers';
import { CollapsibleCard } from './CollapsibleCard';
import { PrizeList } from './PrizeList';

import * as _ from 'lodash';

const styles = require('./DungeonCard.scss');

interface Props {
  world: World;
}

interface ConnectedProps extends Props {
  dungeons: Dungeon[];
}

const DungeonCardTitleBadge = ({world, dungeons}: {world: World, dungeons: Dungeon[]}) => {
  if (!dungeons) {
    return null;
  }
  const total = dungeons.length;
  const mastered = _.sumBy(dungeons, d => +d.isMaster);
  if (mastered === total) {
    return (
      <span className="badge badge-secondary">
        {mastered} / {mastered} / {total}
      </span>
    );
  } else {
    const completed = _.sumBy(dungeons, d => +d.isComplete);
    const stamina = _.sumBy(dungeons, d => !d.isMaster ? d.totalStamina : 0);

    return (
      <span className="badge badge-primary">
        {mastered} / {completed} / {total}
        <br/>
        {stamina} stamina
      </span>
    );
  }
};

const DungeonCardTitle = ({world, dungeons}: {world: World, dungeons: Dungeon[]}) => (
  <span className={styles.title}>
    {world.name}
    <DungeonCardTitleBadge world={world} dungeons={dungeons}/>
  </span>
);

const DungeonDetails = ({dungeon}: {dungeon: Dungeon}) => (
  <p className={styles.details}>
    <span>Difficulty {dungeon.difficulty === 0 ? '???' : dungeon.difficulty}</span>
    <span>Stamina {dungeon.totalStamina}</span>
  </p>
);

const DungeonListItem = ({dungeon}: {dungeon: Dungeon}) => {
  const classes = classNames({[styles.completed]: dungeon.isComplete, [styles.mastered]: dungeon.isMaster});
  const id = `dungeon-item-${dungeon.id}`;
  const showTooltip = !dungeon.isComplete || !dungeon.isMaster;
  return (
    <li className={classes}>
      <div data-tip={showTooltip} data-for={id}>
        {dungeon.name}
        {dungeon.isMaster || <DungeonDetails dungeon={dungeon}/>}
      </div>
      {showTooltip &&
        <ReactTooltip place="right" id={id}>
          {!dungeon.isComplete && <PrizeList prizes={dungeon.prizes.firstTime}/>}
          {!dungeon.isMaster && <PrizeList prizes={dungeon.prizes.mastery}/>}
        </ReactTooltip>
      }
    </li>
  );
};

/**
 * Lists all of the dungeons for a single world.
 */
export class DungeonCard extends React.Component<ConnectedProps> {
  render() {
    const { world, dungeons } = this.props;
    return (
      <CollapsibleCard
        id={`world-${world.id}-dungeons`}
        title={() => <DungeonCardTitle world={world} dungeons={dungeons}/>}
      >
        {dungeons &&
          <ul className="mb-0">
            {dungeons.map((d, i) => (
              <DungeonListItem dungeon={d} key={i}/>
            ))}
          </ul>
        }
      </CollapsibleCard>
    );
  }
}

export default connect(
  (state: IState, ownProps: Props) => ({
    dungeons: state.dungeons.byWorld[ownProps.world.id]
  })
)(DungeonCard);
