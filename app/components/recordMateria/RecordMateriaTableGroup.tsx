import * as React from 'react';

import { RecordMateriaProps } from './RecordMateriaList';
import { RecordMateriaTable } from './RecordMateriaTable';
import { TableDefinition } from './RecordMateriaTableDefinitions';
import { RecordMateriaTooltip } from './RecordMateriaTooltip';

interface Props extends RecordMateriaProps {
  id: string;
  tables: TableDefinition[];
}

export class RecordMateriaTableGroup extends React.Component<Props> {
  render() {
    const { id, recordMateria, isAnonymous, tables } = this.props;
    const tooltipId = `${id}-tooltips`;
    return (
      <>
        {tables.map((t, i) => (
          <RecordMateriaTable
            key={i}
            tooltipId={tooltipId}
            table={t}
            recordMateria={recordMateria}
            isAnonymous={isAnonymous}
          />
        ))}
        <RecordMateriaTooltip
          id={tooltipId}
          recordMateria={recordMateria}
          isAnonymous={isAnonymous}
        />
      </>
    );
  }
}
