import * as React from 'react';

import { ICellRendererParams } from 'ag-grid';

import { CheckIcon } from './CheckIcon';

export class CheckIconCellRenderer extends React.Component<ICellRendererParams> {
  render() {
    const { value } = this.props;
    return <CheckIcon checked={value} />;
  }
}
