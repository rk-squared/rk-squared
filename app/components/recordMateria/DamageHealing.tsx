import * as React from 'react';

import { RecordMateriaDetail } from '../../actions/recordMateria';
import { RecordMateriaTableGroup } from './RecordMateriaTableGroup';

import tables from './DamageHealingDefinitions';

interface Props {
  recordMateria: { [id: number]: RecordMateriaDetail };
}

export class DamageHealing extends React.Component<Props> {
  render() {
    const { recordMateria } = this.props;
    return <RecordMateriaTableGroup id="damageHealing" recordMateria={recordMateria} tables={tables}/>;
  }
}
