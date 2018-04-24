import * as React from 'react';

import { Dungeon, getAvailablePrizes } from '../actions/dungeons';
import { PrizeList } from './PrizeList';

interface Props {
  dungeons: Dungeon[];
}

export class DungeonPrizeList extends React.Component<Props & any> {
  render() {
    const { dungeons, ...props } = this.props;
    const prizes = getAvailablePrizes(dungeons);
    return <PrizeList {...props} prizes={prizes} showTooltips={true}/>;
  }
}
