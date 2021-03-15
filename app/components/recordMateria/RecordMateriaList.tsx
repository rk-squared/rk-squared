import * as React from 'react';

import { RecordMateriaDetail, RecordMateriaStatus } from '../../actions/recordMateria';
import { LangType } from '../../api/apiUrls';
import { LangContext } from '../../contexts/LangContext';
import { enlir } from '../../data';
import { CharacterRecordMateria, getByCharacter } from './byCharacter';
import { StatusIcon } from './StatusIcon';

const styles = require('./RecordMateriaList.module.scss');

export interface RecordMateriaProps {
  recordMateria: { [id: number]: RecordMateriaDetail };
  isAnonymous?: boolean;
}

interface Props extends RecordMateriaProps {
  tooltipId: string;
  show: CharacterRecordMateria[];
}

export class RecordMateriaList extends React.Component<Props> {
  // noinspection JSUnusedGlobalSymbols
  static contextType = LangContext;
  context!: React.ContextType<typeof LangContext>;

  renderItem = (rm: RecordMateriaDetail | undefined, index: number) => {
    const { tooltipId } = this.props;
    const [characterName, order] = this.props.show[index];
    if (rm) {
      return (
        <li key={index} data-tip={rm.id} data-for={tooltipId}>
          {!this.props.isAnonymous && <StatusIcon status={rm.status} />}
          {rm.characterName} {rm.order}
        </li>
      );
    } else if (
      this.context === LangType.Gl &&
      enlir.charactersByName[characterName] &&
      !enlir.charactersByName[characterName].gl
    ) {
      // Our record materia data comes from the game, so characters who aren't
      // in GL won't have RM data.  Display nothing in that case.  (This code
      // should still allow us to handle newly released characters - our copy
      // of Enlir data will mistakenly have !gl, but we'll have RM data from
      // the game, so things should work.)
      return null;
    } else {
      return (
        <li key={index}>
          {!this.props.isAnonymous && <StatusIcon status={RecordMateriaStatus.Unknown} />}
          {characterName} {order}
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
