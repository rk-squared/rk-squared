import * as React from 'react';

import { ICellRendererParams } from 'ag-grid';

import { DungeonScore, formatScore, isSub30 } from '../../actions/dungeonScores';
import { CheckIcon } from './CheckIcon';

export class MagiciteScoreCellRenderer extends React.Component<ICellRendererParams> {
  render() {
    const { value } = this.props;
    const score = value as DungeonScore;
    if (!score) {
      return null;
    }
    const sub30 = isSub30(score);
    return (
      <div>
        {formatScore(score)}
        <CheckIcon checked={sub30} />
      </div>
    );
  }
}
