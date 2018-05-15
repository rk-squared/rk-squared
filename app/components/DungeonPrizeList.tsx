import * as React from 'react';
import { connect } from 'react-redux';

import { Dungeon, getAvailablePrizes, PrizeItem } from '../actions/dungeons';
import { ItemType } from '../data/items';
import { IState } from '../reducers';
import { PrizeList } from './PrizeList';

import * as _ from 'lodash';

interface Props {
  dungeons: Dungeon[];
  showItemType: { [t in ItemType]: boolean };

  [s: string]: any;
}

export class DungeonPrizeList extends React.Component<Props> {
  render() {
    const { dungeons, showItemType, ...props } = this.props;
    const prizes = _.filter(getAvailablePrizes(dungeons), (p: PrizeItem) => showItemType[p.type]);
    return <PrizeList {...props} prizes={prizes} showTooltips={true}/>;
  }
}

interface StateProps {
  showItemType: { [t in ItemType]: boolean };
}

interface OwnProps {
  dungeons: Dungeon[];

  [s: string]: any;
}

export default connect<StateProps, {}, OwnProps>(
  (state: IState) => ({
    showItemType: state.prefs.showItemType
  })
)(DungeonPrizeList);
