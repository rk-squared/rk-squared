import * as React from 'react';

import * as classNames from 'classnames';

import { PrizeItem } from '../../actions/dungeons';
import { LangContext } from '../../contexts/LangContext';
import { enlir } from '../../data';
import { ItemType } from '../../data/items';
import { itemImage } from '../../data/urls';
import { RelicTooltip } from '../shared/RelicTooltip';

const styles = require('./PrizeList.scss');

interface Props {
  prizes: PrizeItem[];
  showTooltips?: boolean;
  className?: string;
}

// Gil amounts in particular can be quite large, so it's nice to include
// commas.  However, toLocaleString is significantly slower than toString.
// To accommodate, we'll try only invoking it if it looks like we need it.
const formatAmount = (amount: number) =>
  amount >= 1000 ? amount.toLocaleString() : amount.toString();

export class PrizeList extends React.PureComponent<Props> {
  render() {
    const { prizes, showTooltips, className } = this.props;
    return (
      <LangContext.Consumer>
        {lang => (
          <ul className={classNames(className, styles.component)}>
            {prizes.map((prize, i) => (
              <li
                key={i}
                data-tip={showTooltips}
                data-for={showTooltips ? `prize-tooltip-${prize.id}` : undefined}
              >
                <img src={itemImage(lang, prize.id, prize.type)} width={32} height={32} />
                {prize.name} ×{formatAmount(prize.amount)}
                {showTooltips && prize.type === ItemType.Relic && enlir.relics[prize.id] && (
                  <RelicTooltip
                    id={`prize-tooltip-${prize.id}`}
                    relicId={prize.id}
                    place="bottom"
                  />
                )}
              </li>
            ))}
          </ul>
        )}
      </LangContext.Consumer>
    );
  }
}
