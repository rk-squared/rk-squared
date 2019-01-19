import * as React from 'react';

import { ColDef } from 'ag-grid';
import { AgGridReact } from 'ag-grid-react';
import { connect } from 'react-redux';

import { Dungeon } from '../../actions/dungeons';
import { IState } from '../../reducers';
import {
  DungeonWithScore,
  getMagiciteScores,
  MagiciteDungeonWithScore,
} from '../../selectors/dungeonsWithScore';
import { GridContainer } from '../common/GridContainer';

import * as _ from 'lodash';

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
        width: 90,
        field: 'worldId',
        valueFormatter: ({ data }: { data: MagiciteDungeonWithScore }) => data.element,
      },
      {
        headerName: '★',
        width: 40,
        field: 'stars',
      },
      {
        headerName: 'Name',
        width: 200,
        field: 'name',
        valueGetter: ({ data }: { data: MagiciteDungeonWithScore }) =>
          data.name.replace(' Record', ''),
      },
      {
        headerName: 'Completed',
        width: 90,
        field: 'isComplete',
      },
      {
        headerName: 'Mastered',
        width: 90,
        field: 'isMaster',
      },
      {
        headerName: 'Time',
        width: 85,
        field: 'score.time',
      },
    ];
  }

  getRowNodeId = (row: DungeonWithScore) => '' + row.id;

  render() {
    const { magiciteScores } = this.props;
    return (
      <GridContainer>
        <AgGridReact
          enableSorting={true}
          enableColResize={true}
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
