import * as React from 'react';
import * as ReactTooltip from 'react-tooltip';

import { RecordMateriaDetail, RecordMateriaStatus } from '../../actions/recordMateria';
import { LangType } from '../../api/apiUrls';
import { LangContext } from '../../contexts/LangContext';
import { enlir } from '../../data';
import * as urls from '../../data/urls';
import { BrTextToP } from '../common/BrTextToP';
import { StatusIcon } from './StatusIcon';

const styles = require('./RecordMateriaTooltip.scss');

interface Props {
  id: string;
  recordMateria: { [id: number]: RecordMateriaDetail };
  descriptionOnly?: boolean;
}

export class RecordMateriaTooltip extends React.Component<Props> {
  // noinspection JSUnusedGlobalSymbols
  static contextType = LangContext;
  context!: React.ContextType<typeof LangContext>;

  getContent = (recordMateriaId: string) => {
    const rm = this.props.recordMateria[+recordMateriaId];
    if (!rm) {
      return null;
    }
    const lang = this.context as LangType;
    const enlirRM = enlir.recordMateria[rm.name.toLowerCase()];

    const gameDescription = <BrTextToP text={rm.description} className={styles.gameDescription} />;
    const enlirDescription = enlirRM && <p className={styles.enlirDescription}>{enlirRM.effect}</p>;

    if (this.props.descriptionOnly) {
      return (
        <div className={styles.textBlock}>
          {gameDescription}
          {enlirDescription}
        </div>
      );
    }
    return (
      <>
        <div className={styles.iconsBlock}>
          <img src={urls.characterImage(lang, rm.characterId)} />
          <img src={urls.recordMateriaImage(lang, rm.id)} />
        </div>

        <div className={styles.textBlock}>
          <h6>{rm.name}</h6>
          {gameDescription}
          {enlirDescription}
          <div className={styles.statusBlock}>
            <StatusIcon status={rm.status} />
            <p>
              {rm.statusDescription}
              {rm.status === RecordMateriaStatus.Unlocked && (
                <span className={styles.unlockCondition}> ({rm.condition})</span>
              )}
            </p>
          </div>
        </div>
      </>
    );
  };

  render() {
    const { id } = this.props;
    return (
      <ReactTooltip
        id={id}
        className={styles.component}
        place="bottom"
        getContent={this.getContent}
      />
    );
  }
}
