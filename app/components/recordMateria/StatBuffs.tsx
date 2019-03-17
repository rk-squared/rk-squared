import * as React from 'react';

import { RecordMateriaProps } from './RecordMateriaList';
import { RecordMateriaTableGroup } from './RecordMateriaTableGroup';

import tables from './StatBuffsDefinitions';

export class StatBuffs extends React.PureComponent<RecordMateriaProps> {
  render() {
    return <RecordMateriaTableGroup id="statBuff" {...this.props} tables={tables} />;
  }
}
