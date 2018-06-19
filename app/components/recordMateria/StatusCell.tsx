import * as React from 'react';

import { RecordMateriaDetail, RecordMateriaStatus } from '../../actions/recordMateria';
import { StatusIcon } from './StatusIcon';

interface Props {
  value: RecordMateriaStatus;
  data: RecordMateriaDetail;
}

export class StatusCell extends React.Component<Props> {
  render() {
    const { data } = this.props;
    return <span><StatusIcon status={data.status}/> {data.statusDescription}</span>;
  }
}
