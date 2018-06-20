import * as React from 'react';
const { default: FontAwesomeIcon } = require('@fortawesome/react-fontawesome');

import { RecordMateriaStatus } from '../../actions/recordMateria';

const styles = require('./StatusIcon.scss');

export class StatusIcon extends React.Component<{status: RecordMateriaStatus}> {
  render() {
    const { status } = this.props;
    switch (status) {
      case RecordMateriaStatus.Unobtained:
        return <FontAwesomeIcon classNames={styles.unobtained} icon="question"/>;
      case RecordMateriaStatus.LockedLowLevel:
        return <FontAwesomeIcon className={styles.lockedLowLevel} icon="arrow-down"/>;
      case RecordMateriaStatus.LockedMissingPrereq:
        return <FontAwesomeIcon className={styles.lockedMissingPrereq} icon="ellipsis-h"/>;
      case RecordMateriaStatus.Unlocked:
        return <FontAwesomeIcon className={styles.unlocked} icon="lock-open"/>;
      case RecordMateriaStatus.Collected:
        return <FontAwesomeIcon className={styles.collected} icon="check"/>;
      case RecordMateriaStatus.Favorite:
        return <FontAwesomeIcon className={styles.favorite} icon="star"/>;
      case RecordMateriaStatus.Vault:
        return <FontAwesomeIcon className={styles.vault} icon="archive"/>;
    }
  }
}
