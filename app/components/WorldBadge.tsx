import { connect } from 'react-redux';

import { World } from '../actions/worlds';
import { IState } from '../reducers';
import { getDungeonsForWorlds } from '../reducers/dungeons';
import { DungeonBadge } from './DungeonBadge';

interface Props {
  worlds: World[];
}

export default connect(
  (state: IState, { worlds }: Props) => ({
    dungeons: getDungeonsForWorlds(state.dungeons, worlds)
  })
)(DungeonBadge);
