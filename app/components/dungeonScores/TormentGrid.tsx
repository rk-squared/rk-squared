import * as React from 'react';

import { ColDef } from 'ag-grid';
import { AgGridReact } from 'ag-grid-react';
import { connect } from 'react-redux';
import * as ReactTooltip from 'react-tooltip';

import { Dungeon, getAvailablePrizes } from '../../actions/dungeons';
import { series } from '../../data';
import { SeriesId } from '../../data/series';
import { IState } from '../../reducers';
import {
  DungeonWithScore,
  getTormentScores,
  TormentWorldWithScore,
} from '../../selectors/dungeonsWithScore';
import { PrizeList } from '../dungeons/PrizeList';
import { TormentScoreCellRenderer } from './TormentScoreCellRenderer';

import * as _ from 'lodash';

interface Props {
  dungeons: { [id: number]: Dungeon };
  tormentScores: TormentWorldWithScore[];
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
        width: 65,
        field: 'd240',
        cellRendererFramework: TormentScoreCellRenderer,
      },
      {
        headerName: 'D280',
        width: 65,
        field: 'd280',
        cellRendererFramework: TormentScoreCellRenderer,
      },
      {
        headerName: 'D???',
        width: 65,
        field: 'dUnknown',
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
    const { tormentScores } = this.props;
    return (
      <div style={{ height: '500px', width: '100%' }} className="ag-theme-balham">
        <AgGridReact
          enableSorting={true}
          enableColResize={true}
          columnDefs={this.columnDefs}
          rowData={this.objectValues(tormentScores)}
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
  tormentScores: getTormentScores(state),
}))(TormentGrid);
