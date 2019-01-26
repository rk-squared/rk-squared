import * as React from 'react';

import { RecordMateriaDetail, RecordMateriaStatus } from '../../actions/recordMateria';
import { CharacterRecordMateria, getByCharacter } from './byCharacter';
import { StatusIcon } from './StatusIcon';

const styles = require('./RecordMateriaList.scss');

interface Props {
  tooltipId: string;
  recordMateria: { [id: number]: RecordMateriaDetail };
  show: CharacterRecordMateria[];
}

export class RecordMateriaList extends React.Component<Props> {
  renderItem = (rm: RecordMateriaDetail | undefined, index: number) => {
    const { tooltipId } = this.props;
    if (rm) {
      return (
        <li key={index} data-tip={rm.id} data-for={tooltipId}>
          <StatusIcon status={rm.status} />
          {rm.characterName} {rm.order}
        </li>
      );
    } else {
      const character = this.props.show[index];
      return (
        <li key={index}>
          <StatusIcon status={RecordMateriaStatus.Unknown} />
          {character[0]} {character[1]}
        </li>
      );
    }
  };

  render() {
    const { recordMateria, show } = this.props;
    const items = getByCharacter(recordMateria, show);
    return <ul className={styles.component}>{items.map(this.renderItem)}</ul>;
  }
}
