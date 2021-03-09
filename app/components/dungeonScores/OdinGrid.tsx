import * as React from 'react';

import { ColDef } from '@ag-grid-community/core';
import { AgGridReact } from '@ag-grid-community/react';
import { connect } from 'react-redux';

import * as _ from 'lodash';

import { IState } from '../../reducers';
import { getOdinScores, OdinElementScore } from '../../selectors/dungeonsWithScore';
import { GridContainer } from '../common/GridContainer';
import { CheckIconCellRenderer } from './CheckIconCellRenderer';
import { OdinElementCellRenderer } from './OdinElementCellRenderer';
import { ArgentOdinScoreCellRenderer } from './ArgentOdinScoreCellRenderer';

interface Props {
  odinScores: OdinElementScore[];
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
        headerName: 'Dark Odin',
        width: 110,
        field: 'darkOdin',
        resizable: true,
        cellClass: 'text-center',
        cellRendererFramework: CheckIconCellRenderer,
        valueGetter: ({ data }: { data: OdinElementScore }) =>
          data.darkOdin && data.darkOdin.score ? data.darkOdin.score.won : false,
      },
      {
        headerName: 'Argent (phys.)',
        width: 110,
        field: 'argentPhysical',
        resizable: true,
        cellClass: 'text-right',
        cellRendererFramework: ArgentOdinScoreCellRenderer,
      },
      {
        headerName: 'Argent (mag.)',
        width: 110,
        field: 'argentMagical',
        resizable: true,
        cellClass: 'text-right',
        cellRendererFramework: ArgentOdinScoreCellRenderer,
      },
    ];
  }

  getRowNodeId = (row: OdinElementScore) => row.element;

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
