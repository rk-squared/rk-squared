import * as React from 'react';

import { ColDef } from 'ag-grid';
import { AgGridReact } from 'ag-grid-react';
import { RecordMateria } from '../actions/recordMateria';

interface Props {
  recordMateria: RecordMateria[];
}

export class RecordMateriaGrid extends React.Component<Props> {
  columnDefs: ColDef[];

  constructor(props: Props) {
    super(props);
    this.columnDefs = [
      { headerName: 'Name', field: 'name' },
      { headerName: 'Character', field: 'characterName' },
      { headerName: 'RM', field: 'order' },
      { headerName: 'Obtained', field: 'obtained', valueGetter: ({data}) => data.obtained ? '✔' : '' },
    ];
  }

  render() {
    const { recordMateria } = this.props;
    return (
      <div
        className="ag-theme-balham"
        style={{
          height: '500px',
          width: '100%' }}
      >
        <AgGridReact
          columnDefs={this.columnDefs}
          rowData={recordMateria}>
        </AgGridReact>
      </div>
    );
  }
}
