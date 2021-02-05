import * as React from 'react';

import { ColDef } from 'ag-grid-community';
import { AgGridReact } from 'ag-grid-react';
import { connect } from 'react-redux';

import * as _ from 'lodash';

import { IState } from '../../reducers';
import { getOdinScores, MagiciteDungeonWithScore } from '../../selectors/dungeonsWithScore';
import { GridContainer } from '../common/GridContainer';
import { CheckIconCellRenderer } from './CheckIconCellRenderer';
import { OdinElementCellRenderer } from './OdinElementCellRenderer';

interface Props {
  odinScores: MagiciteDungeonWithScore[];
}

export class OdinGrid extends React.Component<Props> {
  columnDefs: ColDef[];
  objectValues = _.memoize(_.values);

  constructor(props: Props) {
    super(props);

    this.columnDefs = [
      {
        headerName: 'Element',
        width: 300,
        field: 'element',
        sortable: true,
        resizable: true,
        cellRendererFramework: OdinElementCellRenderer,
        cellRendererParams: { hideElementText: true },
      },
      {
        headerName: 'Completed',
        width: 90,
        field: 'isComplete',
        sortable: true,
        resizable: true,
        cellClass: 'text-center',
        cellRendererFramework: CheckIconCellRenderer,
        valueGetter: ({ data }: { data: MagiciteDungeonWithScore }) =>
          data.score ? data.score.won : false,
      },
    ];
  }

  getRowNodeId = (row: MagiciteDungeonWithScore) => '' + row.id + '-' + row.element;

  render() {
    const { odinScores } = this.props;
    if (!odinScores.length) {
      return <div>The Odin Records have not been loaded.</div>;
    }
    return (
      <GridContainer>
        <AgGridReact
          columnDefs={this.columnDefs}
          rowData={this.objectValues(odinScores)}
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
  odinScores: getOdinScores(state),
}))(OdinGrid);
