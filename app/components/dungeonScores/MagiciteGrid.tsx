import * as React from 'react';

import { ColDef } from '@ag-grid-community/core';
import { AgGridReact } from '@ag-grid-community/react';
import { connect } from 'react-redux';

import * as _ from 'lodash';

import { Dungeon } from '../../actions/dungeons';
import { compareScore } from '../../actions/dungeonScores';
import { IState } from '../../reducers';
import {
  DungeonWithScore,
  getMagiciteScores,
  MagiciteDungeonWithScore,
} from '../../selectors/dungeonsWithScore';
import { compareWithUndefined } from '../../utils/typeUtils';
import { GridContainer } from '../common/GridContainer';
import { CheckIconCellRenderer } from './CheckIconCellRenderer';
import { MagiciteElementCellRenderer } from './MagiciteElementCellRenderer';
import { MagiciteNameCellRenderer } from './MagiciteNameCellRenderer';
import { MagiciteScoreCellRenderer } from './MagiciteScoreCellRenderer';

interface Props {
  dungeons: { [id: number]: Dungeon };
  magiciteScores: MagiciteDungeonWithScore[];
}

export class MagiciteGrid extends React.Component<Props> {
  columnDefs: ColDef[];
  objectValues = _.memoize(_.values);

  constructor(props: Props) {
    super(props);

    this.columnDefs = [
      {
        headerName: 'Element',
        width: 95,
        field: 'worldId', // World IDs correspond to elements and have a good sort order.
        cellRendererFramework: MagiciteElementCellRenderer,
        sortable: true,
        resizable: true,
      },
      {
        headerName: '★',
        width: 40,
        field: 'stars',
        cellStyle: { textAlign: 'center' },
        sortable: true,
        resizable: true,
      },
      {
        headerName: 'Name',
        width: 200,
        field: 'name',
        cellRendererFramework: MagiciteNameCellRenderer,
        sortable: true,
        resizable: true,
      },
      {
        headerName: 'Completed',
        width: 90,
        field: 'isComplete',
        cellClass: 'text-center',
        cellRendererFramework: CheckIconCellRenderer,
        sortable: true,
        resizable: true,
      },
      {
        headerName: 'Mastered',
        width: 90,
        field: 'isMaster',
        cellClass: 'text-center',
        cellRendererFramework: CheckIconCellRenderer,
        sortable: true,
        resizable: true,
      },
      {
        headerName: 'Time',
        width: 90,
        field: 'score',
        cellClass: 'text-right',
        cellRendererFramework: MagiciteScoreCellRenderer,
        comparator: compareWithUndefined(compareScore),
        sortable: true,
        resizable: true,
      },
    ];
  }

  getRowNodeId = (row: DungeonWithScore) => '' + row.id;

  render() {
    const { magiciteScores } = this.props;
    if (!magiciteScores.length) {
      return <div>No magicite dungeons have been loaded.</div>;
    }
    return (
      <GridContainer>
        <AgGridReact
          columnDefs={this.columnDefs}
          rowData={this.objectValues(magiciteScores)}
          deltaRowDataMode={true}
          getRowNodeId={this.getRowNodeId}
          domLayout="autoHeight"
        />
      </GridContainer>
    );
  }
}

export default connect((state: IState) => ({
  dungeons: state.dungeons.dungeons,
  magiciteScores: getMagiciteScores(state),
}))(MagiciteGrid);
