import { connect } from 'react-redux';

import { DungeonBadge } from './DungeonBadge';
import { Dungeon } from '../actions/dungeons';
import { World } from '../actions/worlds';
import { IState } from '../reducers';
import { getWorldDungeons } from '../reducers/dungeons';

import * as _ from 'lodash';

interface Props {
  worlds: World[];
}

export default connect(
  (state: IState, { worlds }: Props) => {
    const worldDungeons: Array<Dungeon[] | undefined> = worlds.map(
      w => getWorldDungeons(state.dungeons, w.id)
    );
    return {
      dungeons: _.flatten(_.filter(worldDungeons) as any as Dungeon[][])
    };
  }
)(DungeonBadge);
