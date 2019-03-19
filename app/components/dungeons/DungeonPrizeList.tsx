import * as React from 'react';
import { connect } from 'react-redux';

import { Dungeon, getAllPrizes, getAvailablePrizes } from '../../actions/dungeons';
import { ItemType } from '../../data/items';
import { IState } from '../../reducers';
import { PrizeList } from './PrizeList';

import * as _ from 'lodash';

const alwaysShow = (type: ItemType) => type === ItemType.DropItem;

interface Props {
  dungeons: Dungeon[];
  showItemType: { [t in ItemType]: boolean };
  isAnonymous?: boolean;

  [s: string]: any;
}

export class DungeonPrizeList extends React.Component<Props> {
  render() {
    const { dungeons, showItemType, isAnonymous, ...props } = this.props;
    const prizes = isAnonymous ? getAllPrizes(dungeons) : getAvailablePrizes(dungeons);
    const filteredPrizes = _.filter(prizes, p => alwaysShow(p.type) || showItemType[p.type]);
    return <PrizeList {...props} prizes={filteredPrizes} showTooltips={true} />;
  }
}

interface StateProps {
  showItemType: { [t in ItemType]: boolean };
}

interface OwnProps {
  dungeons: Dungeon[];

  [s: string]: any;
}

export default connect<StateProps, {}, OwnProps>((state: IState) => ({
  showItemType: state.prefs.showItemType,
}))(DungeonPrizeList);
