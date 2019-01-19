import * as React from 'react';

import { ICellRendererParams } from 'ag-grid';
import * as ReactTooltip from 'react-tooltip';

import { DungeonScore, formatScore } from '../../actions/dungeonScores';
import { DungeonWithScore } from '../../selectors/dungeonsWithScore';

function isTormentComplete(score: DungeonScore): boolean {
  return score.won && score.time != null && score.time < 31000;
}

export class TormentScoreCellRenderer extends React.Component<ICellRendererParams> {
  static ID = 'TORMENT_SCORE_CELL';

  componentDidMount() {
    ReactTooltip.rebuild();
  }

  render() {
    const { value } = this.props;
    const dungeon = value as DungeonWithScore;
    const showTooltips = dungeon.score && !isTormentComplete(dungeon.score);
    return (
      <div data-tip={showTooltips ? dungeon.id : undefined} data-for={TormentScoreCellRenderer.ID}>
        {dungeon.score ? formatScore(dungeon.score) : ''}
      </div>
    );
  }
}
