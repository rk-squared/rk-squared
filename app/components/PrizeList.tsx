import * as React from 'react';

import * as classNames from 'classnames';

import { PrizeItem } from '../actions/dungeons';
import enlir from '../data/enlir';
import { ItemType } from '../data/items';
import { itemImage } from '../data/urls';
import { RelicTooltip } from './RelicTooltip';

const styles = require('./PrizeList.scss');

interface Props {
  prizes: PrizeItem[];
  showTooltips?: boolean;
  className?: string;
}

export class PrizeList extends React.PureComponent<Props> {
  render() {
    const { prizes, showTooltips, className } = this.props;
    return (
      <ul className={classNames(className, styles.component)}>
        {prizes.map((prize, i) =>
          <li key={i} data-tip={showTooltips} data-for={showTooltips ? `prize-tooltip-${prize.id}` : undefined}>
            <img src={itemImage(prize.id, prize.type)} width={32} height={32}/>
            {prize.name} ×{prize.amount}
            {showTooltips && prize.type === ItemType.Relic && enlir.relics[prize.id] &&
              <RelicTooltip id={`prize-tooltip-${prize.id}`} relicId={prize.id} place="bottom"/>
            }
          </li>
        )}
      </ul>
    );
  }
}
