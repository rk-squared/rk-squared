import * as React from 'react';

import { PrizeItem } from '../actions/dungeons';
import enlir from '../data/enlir';
import { ItemType } from '../data/items';
import { itemImage } from '../data/urls';
import { RelicTooltip } from './RelicTooltip';

const styles = require('./PrizeList.scss');

interface Props {
  prizes: PrizeItem[];
  showTooltips?: boolean;
}

export class PrizeList extends React.Component<Props> {
  render() {
    const { prizes, showTooltips } = this.props;
    return (
      <ul className={styles.component}>
        {prizes.map((prize, i) =>
          <li key={i} data-tip={showTooltips} data-for={showTooltips ? `prize-tooltip-${prize.id}` : undefined}>
            <img src={itemImage(prize.id, prize.type)} width={32} height={32}/>
            {prize.name} ×{prize.amount}
            {showTooltips && prize.type === ItemType.Relic && enlir.relics[prize.id] &&
              <RelicTooltip id={`prize-tooltip-${prize.id}`} relicId={prize.id} place="right"/>
            }
          </li>
        )}
      </ul>
    );
  }
}
