import { connect } from 'react-redux';

import { World } from '../actions/worlds';
import { IState } from '../reducers';
import { getDungeonsForWorlds } from '../reducers/dungeons';
import DungeonPrizeList from './DungeonPrizeList';
import { Dungeon } from '../actions/dungeons';

interface StateProps {
  dungeons: Dungeon[];
}

interface OwnProps {
  worlds: World[];
}

export default connect<StateProps, {}, OwnProps>(
  (state: IState, { worlds }: OwnProps) => ({
    dungeons: getDungeonsForWorlds(state.dungeons, worlds)
  })
)(DungeonPrizeList as any);
