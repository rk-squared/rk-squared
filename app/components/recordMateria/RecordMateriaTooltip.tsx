import * as React from 'react';
import * as ReactTooltip from 'react-tooltip';

import { RecordMateriaDetail, RecordMateriaStatus } from '../../actions/recordMateria';
import { enlir } from '../../data';
import * as urls from '../../data/urls';
import { BrTextToP } from '../common/BrTextToP';
import { StatusIcon } from './StatusIcon';

const styles = require('./RecordMateriaTooltip.scss');

interface Props {
  id: string;
  recordMateria: { [id: number]: RecordMateriaDetail };
}

export class RecordMateriaTooltip extends React.Component<Props> {
  getContent = (recordMateriaId: string) => {
    const rm = this.props.recordMateria[+recordMateriaId];
    if (!rm) {
      return null;
    }
    const enlirRM = enlir.recordMateria[rm.name.toLowerCase()];
    return (
      <>
        <div className={styles.iconsBlock}>
          <img src={urls.characterImage(rm.characterId)} />
          <img src={urls.recordMateriaImage(rm.id)} />
        </div>

        <div className={styles.textBlock}>
          <h6>{rm.name}</h6>
          <BrTextToP text={rm.description} className={styles.gameDescription} />
          <p className={styles.enlirDescription}>{enlirRM ? enlirRM.effect : ''}</p>
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
