import * as React from 'react';

import { RecordMateriaDetail } from '../../actions/recordMateria';
import { RecordMateriaTableGroup } from './RecordMateriaTableGroup';

import tables from './AttackReplacementDefinitions';

interface Props {
  recordMateria: { [id: number]: RecordMateriaDetail };
}

export class AttackReplacement extends React.Component<Props> {
  render() {
    const { recordMateria } = this.props;
    return <RecordMateriaTableGroup id="attackReplacement" recordMateria={recordMateria} tables={tables}/>;
  }
}
