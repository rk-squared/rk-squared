import * as React from 'react';

import { ICellRendererParams } from 'ag-grid-community';

import { EnlirElement } from '../../data/enlir';
import { MagiciteDungeonWithScore } from '../../selectors/dungeonsWithScore';

const styles = require('./MagiciteElementCellRenderer.scss');

const weakElement: { [e in EnlirElement]: EnlirElement } = {
  Fire: 'Water',
  Ice: 'Fire',
  Wind: 'Ice',
  Earth: 'Wind',
  Lightning: 'Earth',
  Water: 'Lightning',
  Holy: 'Dark',
  Dark: 'Holy',
  Poison: 'Poison',
  NE: 'NE',
};

export class OdinElementCellRenderer extends React.Component<ICellRendererParams> {
  render() {
    const { data } = this.props;
    const dungeon = data as MagiciteDungeonWithScore;
    return (
      <span className={styles.component + ' ' + dungeon.element.toLowerCase()}>
        {dungeon.element}
        <span className="text-muted pl-1">
          ({(weakElement[data.element as EnlirElement] || '???').toLowerCase()} weak)
        </span>
      </span>
    );
  }
}
