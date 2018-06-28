import * as React from 'react';

import { RecordMateriaDetail } from '../../actions/recordMateria';
import { RecordMateriaTable, TableDefinition } from './RecordMateriaTable';

interface Props {
  id: string;
  recordMateria: { [id: number]: RecordMateriaDetail };
  tables: TableDefinition[];
}

export class RecordMateriaTableGroup extends React.Component<Props> {
  getId = (index: number) => this.props.id + '-' + index;

  render() {
    const { recordMateria, tables } = this.props;
    return (
      <>
        {tables.map((t, i) =>
          <RecordMateriaTable key={i} id={this.getId(i)} table={t} recordMateria={recordMateria}/>
        )}
      </>
    );
  }
}
