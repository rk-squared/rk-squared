import * as React from 'react';

import { ColDef } from 'ag-grid';
import { AgGridReact } from 'ag-grid-react';
import { connect } from 'react-redux';
import * as ReactTooltip from 'react-tooltip';

import * as _ from 'lodash';

import { Dungeon, getAvailablePrizes } from '../../actions/dungeons';
import { series } from '../../data';
import { SeriesId } from '../../data/series';
import { IState } from '../../reducers';
import {
  compareDungeonsWithScore,
  DungeonWithScore,
  getTormentScores,
  TormentWorldWithScore,
} from '../../selectors/dungeonsWithScore';
import { GridContainer } from '../common/GridContainer';
import { PrizeList } from '../dungeons/PrizeList';
import { TormentScoreCellRenderer } from './TormentScoreCellRenderer';

interface Props {
  dungeons: { [id: number]: Dungeon };
  tormentScores: TormentWorldWithScore[];
}

const dColumnDef = {
  width: 85,
  cellRendererFramework: TormentScoreCellRenderer,
  cellClass: 'text-right',
  comparator: compareDungeonsWithScore,
};

export class TormentGrid extends React.Component<Props> {
  columnDefs: ColDef[];
  objectValues = _.memoize(_.values);

  constructor(props: Props) {
    super(props);

    this.columnDefs = [
      {
        headerName: 'Series',
        width: 85,
        field: 'seriesId',
        valueFormatter: ({ value }: { value: SeriesId }) => series.short[value],
      },
      {
        headerName: 'Name',
        width: 245,
        field: 'name',
        valueFormatter: ({ value }: { value: string }) => value.replace(/\(.*?\)$/, ''),
      },
      {
        headerName: 'D240',
        field: 'd240',
        ...dColumnDef,
      },
      {
        headerName: 'D280',
        field: 'd280',
        ...dColumnDef,
      },
      {
        headerName: 'D???',
        field: 'dUnknown',
        ...dColumnDef,
      },
    ];
  }

  getRowNodeId = (row: DungeonWithScore) => '' + row.id;
  getTooltipContent = (dungeonId: string) =>
    this.props.dungeons[+dungeonId] ? (
      <PrizeList prizes={getAvailablePrizes(this.props.dungeons[+dungeonId])} />
    ) : null;

  render() {
    const { tormentScores } = this.props;
    if (!tormentScores.length) {
      return <div>No torment dungeons have been loaded.</div>;
    }
    return (
      <GridContainer>
        <AgGridReact
          enableSorting={true}
          enableColResize={true}
          columnDefs={this.columnDefs}
          rowData={this.objectValues(tormentScores)}
          deltaRowDataMode={true}
          getRowNodeId={this.getRowNodeId}
          onViewportChanged={ReactTooltip.rebuild}
          domLayout="autoHeight"
        />
        <ReactTooltip
          place="bottom"
          id={TormentScoreCellRenderer.ID}
          getContent={this.getTooltipContent}
        />
      </GridContainer>
    );
  }
}

export default connect((state: IState) => ({
  dungeons: state.dungeons.dungeons,
  tormentScores: getTormentScores(state),
}))(TormentGrid);
