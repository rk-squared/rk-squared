import * as React from 'react';

import { RecordMateriaProps } from './RecordMateriaList';
import { RecordMateriaTableGroup } from './RecordMateriaTableGroup';

import tables from './MiscDefinitions';

export class Misc extends React.PureComponent<RecordMateriaProps> {
  render() {
    return <RecordMateriaTableGroup id="attackReplacement" {...this.props} tables={tables} />;
  }
}
