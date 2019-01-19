import * as React from 'react';

import { ColDef } from 'ag-grid';
import { AgGridReact } from 'ag-grid-react';
import { connect } from 'react-redux';
import * as ReactTooltip from 'react-tooltip';

import {
  Dungeon,
  formatDifficulty,
  getAvailablePrizes,
  getSortableDifficulty,
} from '../../actions/dungeons';
import { WorldCategory } from '../../actions/worlds';
import { series } from '../../data';
import { SeriesId } from '../../data/series';
import { IState } from '../../reducers';
import {
  DungeonWithScore,
  makeDungeonsWithScoresSelector,
} from '../../selectors/dungeonsWithScore';
import { PrizeList } from '../dungeons/PrizeList';
import { TormentScoreCellRenderer } from './TormentScoreCellRenderer';

import * as _ from 'lodash';

const getTormentDungeonScores = makeDungeonsWithScoresSelector(WorldCategory.Torment);

interface Props {
  dungeons: { [id: number]: Dungeon };
  dungeonScores: DungeonWithScore[];
}

export class TormentGrid extends React.Component<Props> {
  columnDefs: ColDef[];
  objectValues = _.memoize(_.values);

  constructor(props: Props) {
    super(props);

    this.columnDefs = [
      {
        headerName: 'Series',
        width: 65,
        field: 'world.seriesId',
        valueFormatter: ({ value }: { value: SeriesId }) => series.short[value],
      },
      { headerName: 'Name', width: 245, field: 'name' },
      {
        headerName: 'Difficulty',
        width: 85,
        field: 'difficulty',
        valueGetter: ({ data }: { data: DungeonWithScore }) => getSortableDifficulty(data),
        valueFormatter: ({ data }: { data: DungeonWithScore }) => formatDifficulty(data),
      },
      {
        headerName: 'Score',
        width: 65,
        field: 'score',
        cellRendererFramework: TormentScoreCellRenderer,
      },
    ];
  }

  getRowNodeId = (row: DungeonWithScore) => '' + row.id;
  getTooltipContent = (dungeonId: string) =>
    this.props.dungeons[+dungeonId] ? (
      <PrizeList prizes={getAvailablePrizes(this.props.dungeons[+dungeonId])} />
    ) : null;

  render() {
    const { dungeonScores } = this.props;
    return (
      <div style={{ height: '500px', width: '100%' }} className="ag-theme-balham">
        <AgGridReact
          enableSorting={true}
          enableColResize={true}
          columnDefs={this.columnDefs}
          rowData={this.objectValues(dungeonScores)}
          deltaRowDataMode={true}
          getRowNodeId={this.getRowNodeId}
          onViewportChanged={ReactTooltip.rebuild}
        />
        <ReactTooltip
          place="bottom"
          id={TormentScoreCellRenderer.ID}
          getContent={this.getTooltipContent}
        />
      </div>
    );
  }
}

export default connect((state: IState) => ({
  dungeons: state.dungeons.dungeons,
  dungeonScores: getTormentDungeonScores(state),
}))(TormentGrid);
