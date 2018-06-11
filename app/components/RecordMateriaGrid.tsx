import * as React from 'react';

import { ColDef, RowNode } from 'ag-grid';
import { AgGridReact } from 'ag-grid-react';

import { RecordMateriaDetail } from '../actions/recordMateria';
import { series, SeriesId } from '../data/series';

interface Props {
  recordMateria: RecordMateriaDetail[];
}

type Comparator = ColDef['comparator'];
function compareByNumberField(fieldName: string): Comparator {
  return (valueA, valueB, nodeA, nodeB) => {
    const getField = (node: RowNode | undefined) => ((node || { data: {} }).data || {})[fieldName];
    return getField(nodeA) - getField(nodeB);
  };
}

export class RecordMateriaGrid extends React.Component<Props> {
  columnDefs: ColDef[];

  constructor(props: Props) {
    super(props);
    this.columnDefs = [
      {
        headerName: 'Series',
        width: 100,
        field: 'characterId',
        valueGetter: ({data}: {data: RecordMateriaDetail}) => series.short[data.seriesId as SeriesId],
        comparator: compareByNumberField('characterId'),
      },
      { headerName: 'Character', width: 150, field: 'characterName' },
      { headerName: 'RM', width: 75, field: 'order' },
      { headerName: 'Name', field: 'name' },
      {
        headerName: 'Status',
        field: 'status',
        valueGetter: ({data}: {data: RecordMateriaDetail}) => data.statusDescription,
        comparator: compareByNumberField('status'),
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
