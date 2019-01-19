import * as React from 'react';

import { ICellRendererParams } from 'ag-grid';
import * as ReactTooltip from 'react-tooltip';

import { formatScore, isSub30 } from '../../actions/dungeonScores';
import { DungeonWithScore } from '../../selectors/dungeonsWithScore';
import { TormentScoreIcon } from './TormentScoreIcon';

export class TormentScoreCellRenderer extends React.Component<ICellRendererParams> {
  static ID = 'TORMENT_SCORE_CELL';

  componentDidMount() {
    ReactTooltip.rebuild();
  }

  render() {
    const { value } = this.props;
    const dungeon = value as DungeonWithScore;
    if (!dungeon.score) {
      return null;
    }
    const showTooltips = !isSub30(dungeon.score);
    return (
      <div data-tip={showTooltips ? dungeon.id : undefined} data-for={TormentScoreCellRenderer.ID}>
        {formatScore(dungeon.score)}
        <TormentScoreIcon score={dungeon.score} />
      </div>
    );
  }
}
