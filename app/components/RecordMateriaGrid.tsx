import * as React from 'react';

import { ColDef } from 'ag-grid';
import { AgGridReact } from 'ag-grid-react';
import { RecordMateriaDetail, statusDescription } from '../actions/recordMateria';

interface Props {
  recordMateria: RecordMateriaDetail[];
}

export class RecordMateriaGrid extends React.Component<Props> {
  columnDefs: ColDef[];

  constructor(props: Props) {
    super(props);
    this.columnDefs = [
      { headerName: 'Name', field: 'name' },
      { headerName: 'Character', field: 'characterName' },
      { headerName: 'RM', field: 'order' },
      {
        headerName: 'Status',
        field: 'status',
        valueGetter: ({data}: { data: RecordMateriaDetail}) => statusDescription[data.status]
      },
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
          enableSorting={true}
          columnDefs={this.columnDefs}
          rowData={recordMateria}>
        </AgGridReact>
      </div>
    );
  }
}
