import * as React from 'react';

import { ICellRendererParams } from 'ag-grid';

import { RecordMateriaDetail } from '../../actions/recordMateria';

interface Props {
  value: string;
  data: RecordMateriaDetail;
}

export class DescriptionCell extends React.PureComponent<ICellRendererParams & Props> {
  static ID = 'RECORD_MATERIA_DESCRIPTION_CELL';
  render() {
    const { value, data } = this.props;
    return (
      <span data-tip={data.id} data-for={DescriptionCell.ID}>
        {value}
      </span>
    );
  }
}
