import * as React from 'react';

import { PrizeItem } from '../actions/dungeons';
import { itemImage } from '../data/urls';

const styles = require('./PrizeList.scss');

interface Props {
  prizes: PrizeItem[];
}

export class PrizeList extends React.Component<Props> {
  render() {
    return (
      <ul className={styles.component}>
        {this.props.prizes.map((prize, i) =>
          <li key={i}>
            <img src={itemImage(prize.id, prize.type)} width={32} height={32}/>
            {prize.name} ×{prize.amount}
          </li>
        )}
      </ul>
    );
  }
}
