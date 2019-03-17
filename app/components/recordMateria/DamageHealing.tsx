import * as React from 'react';

import { RecordMateriaProps } from './RecordMateriaList';
import { RecordMateriaTableGroup } from './RecordMateriaTableGroup';

import tables from './DamageHealingDefinitions';

export class DamageHealing extends React.PureComponent<RecordMateriaProps> {
  render() {
    return <RecordMateriaTableGroup id="damageHealing" {...this.props} tables={tables} />;
  }
}
