import * as React from 'react';
import { connect } from 'react-redux';
import * as ReactTooltip from 'react-tooltip';

import classNames from 'classnames';

import { Dungeon, formatDifficulty } from '../../actions/dungeons';
import { World } from '../../actions/worlds';
import { LangType } from '../../api/apiUrls';
import { localIcons } from '../../data/localData';
import { seriesIcon } from '../../data/urls';
import { IState } from '../../reducers';
import { getDungeonsForWorld } from '../../reducers/dungeons';
import { CollapsibleCard } from '../common/CollapsibleCard';
import { DungeonBadge } from './DungeonBadge';
import { getProcessor, rewardsTitle } from './DungeonCommon';
import DungeonPrizeList from './DungeonPrizeList';
import { PrizeList } from './PrizeList';

const styles = require('./DungeonCard.scss');

interface Props {
  world: World;
  isAnonymous?: boolean;
}

interface ConnectedProps extends Props {
  dungeons: Dungeon[];
}

const DungeonCardTitle = ({
  world,
  dungeons,
  isAnonymous,
}: {
  world: World;
  dungeons: Dungeon[];
  isAnonymous?: boolean;
}) => (
  <span className={styles.titleText}>
    {world.name}
    <DungeonBadge dungeons={dungeons} isAnonymous={isAnonymous} />
  </span>
);

const DungeonDetails = ({ dungeon }: { dungeon: Dungeon }) => (
  <p className={styles.details}>
    <span>Difficulty {formatDifficulty(dungeon)}</span>
    <span>Stamina {dungeon.totalStamina}</span>
  </p>
);

export const DungeonListItem = ({
  dungeon,
  isAnonymous,
}: {
  dungeon: Dungeon;
  isAnonymous?: boolean;
}) => {
  const { hasPrizes, completed, mastered, getPrizes } = getProcessor(isAnonymous).getInfo(dungeon);
  const classes = classNames({
    [styles.completed]: completed,
    [styles.mastered]: mastered,
  });
  const id = `dungeon-item-${dungeon.id}`;
  const showDetails = !mastered;
  const showTooltip = hasPrizes;
  return (
    <li className={classes}>
      <div data-tip={showTooltip} data-for={id}>
        {dungeon.name}
        {dungeon.detail && <span className="text-muted"> ({dungeon.detail})</span>}
        {showDetails && <DungeonDetails dungeon={dungeon} />}
      </div>
      {showTooltip && (
        <ReactTooltip place="bottom" id={id}>
          <PrizeList prizes={getPrizes(dungeon)} />
        </ReactTooltip>
      )}
    </li>
  );
};

/**
 * Lists all of the dungeons for a single world.
 */
export class DungeonCard extends React.PureComponent<ConnectedProps> {
  render() {
    const { world, dungeons, isAnonymous } = this.props;
    const noMessage = dungeons
      ? undefined
      : isAnonymous
      ? 'Not yet available.'
      : !world.isUnlocked
      ? 'You have not yet entered these dungeons.'
      : 'These dungeons have not been loaded.';

    let icon: string | undefined | null;
    let isSeriesIcon = false;
    if (world.iconUrl) {
      icon = world.iconUrl;
    } else if (world.localIcon && localIcons[world.localIcon]) {
      icon = localIcons[world.localIcon];
    } else {
      // For speed and simplicity, hard-code icons for GL.
      icon = seriesIcon(LangType.Gl, world.seriesId);
      isSeriesIcon = true;
    }

    // TODO: Rework tooltips?  They may be faster if we only render 1 per card.
    // See TormentGrid for the newer approach I'm using.
    return (
      <CollapsibleCard
        id={`world-${world.id}-dungeons`}
        title={() => (
          <DungeonCardTitle world={world} dungeons={dungeons} isAnonymous={isAnonymous} />
        )}
        titleClassName={classNames(styles.title, { [styles.seriesIcon]: isSeriesIcon })}
        titleStyle={{ backgroundImage: icon ? `url(${icon}` : undefined }}
      >
        {noMessage ? (
          <p className="mb-0">{noMessage}</p>
        ) : (
          <div className="row">
            <div className="col-lg">
              <h6>Dungeons</h6>
              <ul className="mb-0">
                {dungeons.map((d, i) => (
                  <DungeonListItem dungeon={d} key={i} isAnonymous={isAnonymous} />
                ))}
              </ul>
            </div>
            <div className="col-lg">
              <h6>{rewardsTitle(isAnonymous)}</h6>
              <DungeonPrizeList dungeons={dungeons} isAnonymous={isAnonymous} className="mb-0" />
            </div>
          </div>
        )}
      </CollapsibleCard>
    );
  }
}

export default connect((state: IState, ownProps: Props) => ({
  dungeons: getDungeonsForWorld(state.dungeons, ownProps.world.id),
}))(DungeonCard);
