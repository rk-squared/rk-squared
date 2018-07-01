import * as React from 'react';

import { RecordMateriaDetail, RecordMateriaStatus } from '../../actions/recordMateria';
import { CharacterRecordMateria, getByCharacter } from './byCharacter';
import { RecordMateriaTooltip } from './RecordMateriaTooltip';
import { StatusIcon } from './StatusIcon';

const styles = require('./RecordMateriaList.scss');

interface Props {
  id: string;
  recordMateria: { [id: number]: RecordMateriaDetail };
  show: CharacterRecordMateria[];
}

export class RecordMateriaList extends React.Component<Props> {
  getId(recordMateria: RecordMateriaDetail) {
    return this.props.id + '-' + recordMateria.id;
  }

  renderItem = (rm: RecordMateriaDetail | undefined, index: number) => {
    if (rm) {
      return (
        <li key={index} data-tip={true} data-for={this.getId(rm)}>
          <StatusIcon status={rm.status}/>{rm.characterName} {rm.order}
        </li>
      );
    } else {
      const character = this.props.show[index];
      return <li key={index}><StatusIcon status={RecordMateriaStatus.Unknown}/>{character[0]} {character[1]}</li>;
    }
  };

  renderTooltips = (rm: RecordMateriaDetail | undefined, index: number) => {
    return rm == null ? null : <RecordMateriaTooltip key={index} id={this.getId(rm)} rm={rm}/>;
  };

  render() {
    const { recordMateria, show } = this.props;
    const items = getByCharacter(recordMateria, show);
    return (
      <ul className={styles.component}>
        {items.map(this.renderItem)}
        {items.map(this.renderTooltips)}
      </ul>
    );
  }
}
