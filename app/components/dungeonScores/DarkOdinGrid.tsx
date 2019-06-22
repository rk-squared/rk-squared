import * as React from 'react';

import { ColDef } from 'ag-grid';
import { AgGridReact } from 'ag-grid-react';
import { connect } from 'react-redux';

import * as _ from 'lodash';

import { IState } from '../../reducers';
import { getDarkOdinScores, MagiciteDungeonWithScore } from '../../selectors/dungeonsWithScore';
import { GridContainer } from '../common/GridContainer';
import { CheckIconCellRenderer } from './CheckIconCellRenderer';
import { DarkOdinElementCellRenderer } from './DarkOdinElementCellRenderer';

interface Props {
  darkOdinScores: MagiciteDungeonWithScore[];
}

export class MagiciteGrid extends React.Component<Props> {
  columnDefs: ColDef[];
  objectValues = _.memoize(_.values);

  constructor(props: Props) {
    super(props);

    this.columnDefs = [
      {
        headerName: 'Element',
        width: 300,
        field: 'element',
        cellRendererFramework: DarkOdinElementCellRenderer,
        cellRendererParams: { hideElementText: true },
      },
      {
        headerName: 'Completed',
        width: 90,
        field: 'isComplete',
        cellClass: 'text-center',
        cellRendererFramework: CheckIconCellRenderer,
        valueGetter: ({ data }: { data: MagiciteDungeonWithScore }) =>
          data.score ? data.score.won : false,
      },
    ];
  }

  getRowNodeId = (row: MagiciteDungeonWithScore) => '' + row.id + '-' + row.element;

  render() {
    const { darkOdinScores } = this.props;
    if (!darkOdinScores.length) {
      return <div>The Dark Odin Record has been loaded.</div>;
    }
    return (
      <GridContainer>
        <AgGridReact
          enableSorting={true}
          enableColResize={true}
          columnDefs={this.columnDefs}
          rowData={this.objectValues(darkOdinScores)}
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
  darkOdinScores: getDarkOdinScores(state),
}))(MagiciteGrid);
