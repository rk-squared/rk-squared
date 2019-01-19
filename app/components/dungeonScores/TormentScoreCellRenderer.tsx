import * as React from 'react';

import { ICellRendererParams } from 'ag-grid';
import * as ReactTooltip from 'react-tooltip';

import { getAvailablePrizes } from '../../actions/dungeons';
import { DungeonScore, formatScore } from '../../actions/dungeonScores';
import { DungeonWithScore } from '../../selectors/dungeonsWithScore';
import { PrizeList } from '../dungeons/PrizeList';

function isTormentComplete(score: DungeonScore): boolean {
  return score.won && score.time != null && score.time < 31000;
}

export class TormentScoreCellRenderer extends React.Component<ICellRendererParams> {
  render() {
    const { data, node } = this.props;
    const dungeon = data as DungeonWithScore;
    const id = 'score-' + node.id;
    const showTooltips = dungeon.score && !isTormentComplete(dungeon.score);
    return (
      <div>
        <div data-tip={showTooltips} data-for={showTooltips ? id : undefined}>
          {dungeon.score ? formatScore(dungeon.score) : ''}
        </div>
        {showTooltips && (
          <ReactTooltip place="bottom" id={id}>
            <PrizeList prizes={getAvailablePrizes(dungeon)} />
          </ReactTooltip>
        )}
      </div>
    );
  }
}
