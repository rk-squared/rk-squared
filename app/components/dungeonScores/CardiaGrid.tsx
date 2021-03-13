import * as React from 'react';

import { ColDef } from '@ag-grid-community/core';
import { AgGridReact } from '@ag-grid-community/react';
import { connect } from 'react-redux';
import * as ReactTooltip from 'react-tooltip';

import * as _ from 'lodash';

import { Dungeon, getAvailablePrizes } from '../../actions/dungeons';
import { series } from '../../data';
import { SeriesId } from '../../data/series';
import { IState } from '../../reducers';
import {
  CardiaRealmWithScore,
  compareDungeonsWithScore,
  DungeonWithScore,
  getCardiaScores,
} from '../../selectors/dungeonsWithScore';
import { GridContainer } from '../common/GridContainer';
import { PrizeList } from '../dungeons/PrizeList';
import { CardiaScoreCellRenderer } from './CardiaScoreCellRenderer';

interface Props {
  dungeons: { [id: number]: Dungeon };
  cardiaScores: CardiaRealmWithScore[];
}

// TODO: Tooltips break if a tooltip is up while the score updates

const dColumnDef: ColDef = {
  width: 90,
  cellRendererFramework: CardiaScoreCellRenderer,
  cellClass: 'text-right',
  comparator: compareDungeonsWithScore,
  sortable: true,
  resizable: true,
};

const formatName = ({ value }: { value: string | undefined }) =>
  value ? value.replace(/\(.*?\)$/, '').replace(/^Dreambreaker - /, '') : '';

export class CardiaGrid extends React.Component<Props> {
  columnDefs: ColDef[];
  objectValues = _.memoize(_.values);

  constructor(props: Props) {
    super(props);

    this.columnDefs = [
      {
        headerName: 'Series',
        width: 65,
        field: 'seriesId',
        sortable: true,
        resizable: true,
        valueFormatter: ({ value }: { value: SeriesId }) => series.short[value],
      },
      {
        headerName: 'Torment',
        width: 165,
        field: 'torment.name',
        sortable: true,
        resizable: true,
        valueFormatter: formatName,
      },
      {
        headerName: 'D240',
        field: 'torment.d240',
        ...dColumnDef,
      },
      {
        headerName: 'D280',
        field: 'torment.d280',
        ...dColumnDef,
      },
      {
        headerName: 'D450',
        field: 'torment.d450',
        ...dColumnDef,
      },
      {
        headerName: 'Dreambreaker',
        width: 165,
        field: 'dreambreaker.name',
        sortable: true,
        resizable: true,
        valueFormatter: formatName,
      },
      {
        headerName: 'D580',
        field: 'dreambreaker',
        ...dColumnDef,
      },
    ];
  }

  getRowNodeId = (row: DungeonWithScore) => '' + row.seriesId;
  getTooltipContent = (dungeonId: string) =>
    this.props.dungeons[+dungeonId] ? (
      <PrizeList prizes={getAvailablePrizes(this.props.dungeons[+dungeonId])} />
    ) : null;

  render() {
    const { cardiaScores } = this.props;
    if (!cardiaScores.length) {
      return <div>No torment or Dreambreaker dungeons have been loaded.</div>;
    }
    return (
      <GridContainer>
        <AgGridReact
          columnDefs={this.columnDefs}
          rowData={this.objectValues(cardiaScores)}
          deltaRowDataMode={true}
          getRowNodeId={this.getRowNodeId}
          onFirstDataRendered={ReactTooltip.rebuild}
          onViewportChanged={ReactTooltip.rebuild}
          onRowDataChanged={ReactTooltip.rebuild}
          domLayout="autoHeight"
        />
        <ReactTooltip
          place="bottom"
          id={CardiaScoreCellRenderer.ID}
          getContent={this.getTooltipContent}
        />
      </GridContainer>
    );
  }
}

export default connect((state: IState) => ({
  dungeons: state.dungeons.dungeons,
  cardiaScores: getCardiaScores(state),
}))(CardiaGrid);
