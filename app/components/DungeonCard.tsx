import * as React from 'react';
import { connect } from 'react-redux';
import * as ReactTooltip from 'react-tooltip';

import * as classNames from 'classnames';

import { Dungeon } from '../actions/dungeons';
import { World } from '../actions/worlds';
import { IState } from '../reducers';
import { CollapsibleCard } from './CollapsibleCard';
import { DungeonBadge } from './DungeonBadge';
import { DungeonPrizeList } from './DungeonPrizeList';
import { PrizeList } from './PrizeList';


const styles = require('./DungeonCard.scss');

interface Props {
  world: World;
}

interface ConnectedProps extends Props {
  dungeons: Dungeon[];
}

const DungeonCardTitle = ({world, dungeons}: {world: World, dungeons: Dungeon[]}) => (
  <span>
    {world.name}
    <DungeonBadge dungeons={dungeons}/>
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
        <ReactTooltip place="bottom" id={id}>
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
        {!dungeons
          ? <p className="mb-0">These dungeons have not been loaded.</p>
          : <div className="row">
              <div className="col-lg">
                <h6>Dungeons</h6>
                <ul className="mb-0">
                  {dungeons.map((d, i) => (
                    <DungeonListItem dungeon={d} key={i}/>
                  ))}
                </ul>
              </div>
              <div className="col-lg">
                <h6>Unclaimed Rewards</h6>
                <DungeonPrizeList dungeons={dungeons} className="mb-0"/>
              </div>
            </div>
        }
      </CollapsibleCard>
    );
  }
}

export default connect(
  (state: IState, ownProps: Props) => {
    const worldDungeons = state.dungeons.byWorld[ownProps.world.id];
    return {
      dungeons: worldDungeons ? worldDungeons.map((i: number) => state.dungeons.dungeons[i]) : undefined
    };
  }
)(DungeonCard);
