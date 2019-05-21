import * as React from 'react';

import * as _ from 'lodash';

import { ColDef, ICellRendererParams } from 'ag-grid';
import { AgGridReact } from 'ag-grid-react';

import { enlir, EnlirSoulBreak, SharedSoulBreak } from '../../data/enlir';
import { describeEnlirSoulBreak, formatMrP, MrPSoulBreak } from '../../data/mrP';
import { GridContainer } from '../common/GridContainer';
import { RelicTypeIcon } from '../shared/RelicTypeIcon';

const styles = require('./SharedSoulBreakList.scss');

interface Props {
  isAnonymous?: boolean;
}

const sortedSoulBreaks = _.sortBy(enlir.sharedSoulBreaks, i => i.soulBreak.name);
const sharedMrPSoulBreaks: { [id: number]: MrPSoulBreak } = {};

function getSharedSoulBreakDescription(soulBreak: EnlirSoulBreak): string {
  if (!sharedMrPSoulBreaks[soulBreak.id]) {
    sharedMrPSoulBreaks[soulBreak.id] = describeEnlirSoulBreak(soulBreak);
  }
  return formatMrP(sharedMrPSoulBreaks[soulBreak.id]);
}

export class SharedSoulBreakList extends React.Component<Props> {
  columnDefs: ColDef[];

  constructor(props: Props) {
    super(props);
    this.columnDefs = [
      {
        headerName: 'Type',
        width: 80,
        field: 'relic.type',
        cellClass: 'text-center',
        cellRendererFramework: ({ value }: ICellRendererParams) => (
          <RelicTypeIcon type={value} className={styles.icon} />
        ),
      },
      {
        headerName: 'Relic',
        width: 145,
        field: 'relic.name',
        cellClass: ({ data }) => (!data.relic.gl ? 'font-italic' : ''),
      },
      {
        headerName: 'Soul Break',
        width: 180,
        field: 'soulBreak.name',
        cellClass: ({ data }) => (!data.relic.gl ? 'font-italic' : ''),
      },
      {
        headerName: 'Effects',
        width: 450,
        valueGetter: ({ data }) => getSharedSoulBreakDescription(data.soulBreak),
      },
    ];
  }

  getRowNodeId = (row: SharedSoulBreak) => '' + row.soulBreak.id;

  render() {
    return (
      <GridContainer style={{ height: '500px', width: '100%' }}>
        <AgGridReact
          enableSorting={true}
          enableColResize={true}
          columnDefs={this.columnDefs}
          rowData={sortedSoulBreaks}
          deltaRowDataMode={true}
          getRowNodeId={this.getRowNodeId}
          rowHeight={30}
        />
      </GridContainer>
    );
  }
}

export default SharedSoulBreakList;
