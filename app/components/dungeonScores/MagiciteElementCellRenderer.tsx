import * as React from 'react';

import { ICellRendererParams } from 'ag-grid-community';

import { MagiciteDungeonWithScore } from '../../selectors/dungeonsWithScore';

const styles = require('./MagiciteElementCellRenderer.scss');

export class MagiciteElementCellRenderer extends React.Component<ICellRendererParams> {
  render() {
    const { data } = this.props;
    const dungeon = data as MagiciteDungeonWithScore;
    return (
      <span className={styles.component + ' ' + dungeon.element.toLowerCase()}>
        {dungeon.element}
      </span>
    );
  }
}
