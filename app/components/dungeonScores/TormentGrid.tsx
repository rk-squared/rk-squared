import * as React from 'react';

import { ColDef } from 'ag-grid';
import { AgGridReact } from 'ag-grid-react';

import { formatDifficulty, getSortableDifficulty } from '../../actions/dungeons';
import { formatScore } from '../../actions/dungeonScores';
import { WorldCategory } from '../../actions/worlds';
import { series } from '../../data';
import { SeriesId } from '../../data/series';
import { IState } from '../../reducers';
import {
  DungeonWithScore,
  makeDungeonsWithScoresSelector,
} from '../../selectors/dungeonsWithScore';

import * as _ from 'lodash';
import { connect } from 'react-redux';

const getTormentDungeonScores = makeDungeonsWithScoresSelector(WorldCategory.Torment);

interface Props {
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
        valueFormatter: ({ data }: { data: DungeonWithScore }) =>
          data.score ? formatScore(data.score) : '',
      },
    ];
  }

  getRowNodeId = (row: DungeonWithScore) => '' + row.id;

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
        />
      </div>
    );
  }
}

export default connect((state: IState) => ({
  dungeonScores: getTormentDungeonScores(state),
}))(TormentGrid);
