import * as React from 'react';

import { RecordMateriaDetail } from '../../actions/recordMateria';
import { RecordMateriaTable } from './RecordMateriaTable';
import { TableDefinition } from './RecordMateriaTableDefinitions';
import { RecordMateriaTooltip } from './RecordMateriaTooltip';

interface Props {
  id: string;
  recordMateria: { [id: number]: RecordMateriaDetail };
  tables: TableDefinition[];
}

export class RecordMateriaTableGroup extends React.Component<Props> {
  render() {
    const { id, recordMateria, tables } = this.props;
    const tooltipId = `${id}-tooltips`;
    return (
      <>
        {tables.map((t, i) => (
          <RecordMateriaTable
            key={i}
            tooltipId={tooltipId}
            table={t}
            recordMateria={recordMateria}
          />
        ))}
        <RecordMateriaTooltip id={tooltipId} recordMateria={recordMateria} />;
      </>
    );
  }
}
