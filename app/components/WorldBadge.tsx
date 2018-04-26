import { connect } from 'react-redux';

import { DungeonBadge } from './DungeonBadge';
import { World } from '../actions/worlds';
import { IState } from '../reducers';
import { getDungeonsForWorlds } from '../reducers/dungeons';

interface Props {
  worlds: World[];
}

export default connect(
  (state: IState, { worlds }: Props) => ({
    dungeons: getDungeonsForWorlds(state.dungeons, worlds)
  })
)(DungeonBadge);
